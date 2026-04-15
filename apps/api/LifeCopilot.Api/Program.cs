
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using LifeCopilot.Api.Data;
using LifeCopilot.Api.Meta;
using LifeCopilot.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;


var builder = WebApplication.CreateBuilder(args);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "LifeCopilot API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

//Db
builder.Services.AddDbContext<LifeCopilotDbContext>(opt => 
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var cs = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(cs))
{
    throw new InvalidOperationException("Missing ConnectionStrings:Default (set ConnectionStrings__Default in App Service).");
}

// CORS
const string CorsPolicyName = "Vercel";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        policy
            .WithOrigins("https://life-copilot-opal.vercel.app", "http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Auth
var jwtIssuer = builder.Configuration["Jwt:Issuer"] 
    ?? throw new InvalidOperationException("Missing Jwt:Issuer");
var jwtAudience = builder.Configuration["Jwt:Audience"] 
    ?? throw new InvalidOperationException("Missing Jwt:Audience");
var jwtKey = builder.Configuration["Jwt:Key"] 
    ?? throw new InvalidOperationException("Missing Jwt:Key");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddScoped<PasswordHasher<UserEntity>>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LifeCopilotDbContext>();
    var shouldMigrate = app.Configuration.GetValue("RUN_MIGRATIONS", false);

    if (shouldMigrate)
    {
        db.Database.Migrate();
    }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors(CorsPolicyName);

app.UseAuthentication();
app.UseAuthorization();

var healthApi = app.MapGroup("/health");
var publicApi = app.MapGroup("/api");
var authenticatedApi = app.MapGroup("/api").RequireAuthorization();

healthApi.MapGet("", (IHostEnvironment env,IConfiguration config) =>
{
    var sha = config["GIT_SHA"] ?? "unknown";

    return Results.Ok(new
    {
        status = "ok",
        gitSha = sha,
        environment = env.EnvironmentName,
        utc = DateTimeOffset.UtcNow
    });
});

healthApi.MapGet("/db", async (LifeCopilotDbContext db) =>
{
    try
    {
        await db.Database.CanConnectAsync();
        return Results.Ok(new { status = "ok" });
    }
    catch
    {
        return Results.Problem("Database connection failed");
    }
});

publicApi.MapGet("/meta/version", (IHostEnvironment env, IConfiguration config) =>
{
    var assembly = Assembly.GetExecutingAssembly();
    var informationalVersion =
        assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
        ?? assembly.GetName().Version?.ToString()
        ?? "unknown";

    var response = new ApiVersionResponse
    {
        AppName = "LifeCopilot.Api",
        Environment = env.EnvironmentName,
        Version = informationalVersion,
        CommitSha = config["Build:CommitSha"] ?? Environment.GetEnvironmentVariable("BUILD_COMMIT_SHA"),
        BuildTimestampUtc = config["Build:TimestampUtc"] ?? Environment.GetEnvironmentVariable("BUILD_TIMESTAMP_UTC"),
        ServerTimeUtc = DateTime.UtcNow.ToString("O")
    };

    return Results.Ok(response);
})
.WithName("GetApiVersion")
.WithTags("Meta")
.AllowAnonymous();

publicApi.MapPost("/auth/register", async (
    RegisterRequest req,
    LifeCopilotDbContext db,
    PasswordHasher<UserEntity> passwordHasher,
    IConfiguration config) =>
{
    var email = req.Email.Trim().ToLowerInvariant();
    var displayName = string.IsNullOrWhiteSpace(req.DisplayName) ? null : req.DisplayName.Trim();

    var errors = new Dictionary<string, string[]>();

    if (string.IsNullOrWhiteSpace(email))
        errors["email"] = ["Email is required."];
    if (string.IsNullOrWhiteSpace(req.Password))
        errors["password"] = ["Password is required."];
    else if (req.Password.Length < 8)
        errors["password"] = ["Password must be at least 8 characters."];
    if (!string.IsNullOrWhiteSpace(displayName) && displayName.Length > 200)
        errors["displayName"] = ["Display name must be <= 200 characters."];

    if (errors.Count > 0)
        return Results.ValidationProblem(errors);

    var existing = await db.Users.FirstOrDefaultAsync(x => x.Email == email);
    if (existing is not null)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["email"] = ["An account with that email already exists."]
        });
    }

    var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    var user = new UserEntity
    {
        Id = Guid.NewGuid(),
        Email = email,
        DisplayName = displayName,
        CreatedAt = now,
        UpdatedAt = now
    };

    user.PasswordHash = passwordHasher.HashPassword(user, req.Password);

    db.Users.Add(user);
    await db.SaveChangesAsync();

    var token = CreateJwt(user, config);

    return Results.Ok(new AuthResponse
    {
        User = ToCurrentUserDto(user),
        AccessToken = token
    });
});

publicApi.MapPost("/auth/login", async (
    LoginRequest req,
    LifeCopilotDbContext db,
    PasswordHasher<UserEntity> passwordHasher,
    IConfiguration config) =>
{
    var email = req.Email.Trim().ToLowerInvariant();

    var user = await db.Users.FirstOrDefaultAsync(x => x.Email == email);
    if (user is null)
        return Results.Unauthorized();

    var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);
    if (verification == PasswordVerificationResult.Failed)
        return Results.Unauthorized();

    var token = CreateJwt(user, config);

    return Results.Ok(new AuthResponse
    {
        User = ToCurrentUserDto(user),
        AccessToken = token
    });
});

authenticatedApi.MapGet("/auth/me", async (
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userIdValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdValue, out var userId))
        return Results.Unauthorized();

    var user = await db.Users.FirstOrDefaultAsync(x => x.Id == userId);
    if (user is null)
        return Results.Unauthorized();

    return Results.Ok(ToCurrentUserDto(user));
});

authenticatedApi.MapGet("/goals", async (
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var goals = await db.Goals
        .Where(x => x.UserId == userId.Value)
        .OrderByDescending(x => x.UpdatedAt)
        .ToListAsync();

    return Results.Ok(goals.Select(ToGoalDto));
});

authenticatedApi.MapGet("/goals/{id}", async (
    string id,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (!Guid.TryParse(id, out var goalId))
        return Results.BadRequest("Invalid goal id.");

    var goal = await db.Goals.FirstOrDefaultAsync(x => x.Id == goalId && x.UserId == userId.Value);
    if (goal is null)
        return Results.NotFound();

    return Results.Ok(ToGoalDto(goal));
});

authenticatedApi.MapPost("/goals", async (
    SaveGoalRequest req,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(req.Title))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["title"] = ["Title is required."]
        });
    }

    var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    var goal = new GoalEntity
{
    Id = Guid.NewGuid(),
    UserId = userId.Value,
    Title = req.Title.Trim(),
    WhyItMatters = req.WhyItMatters?.Trim(),
    Lane = req.Lane,
    Type = req.Type,
    Status = req.Status,
    Priority = req.Priority,
    DueStyle = req.DueStyle,
    RealDeadline = req.RealDeadline,
    TargetDate = req.TargetDate,
    MinimumTouchFrequency = req.MinimumTouchFrequency,
    CurrentMilestone = req.CurrentMilestone?.Trim(),
    NextTinyAction = req.NextTinyAction?.Trim(),
    TypicalSessionSize = req.TypicalSessionSize,
    Energy = req.Energy,
    Resistance = req.Resistance,
    Excitement = req.Excitement,
    LastTouchedAt = req.LastTouchedAt,
    Notes = req.Notes,
    CreatedAt = string.IsNullOrWhiteSpace(req.CreatedAt) ? DateTime.UtcNow.ToString("O") : req.CreatedAt,
    UpdatedAt = string.IsNullOrWhiteSpace(req.UpdatedAt) ? DateTime.UtcNow.ToString("O") : req.UpdatedAt
};

    db.Goals.Add(goal);
    await db.SaveChangesAsync();

    return Results.Ok(ToGoalDto(goal));
});

authenticatedApi.MapPut("/goals/{id}", async (
    string id,
    SaveGoalRequest req,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (!Guid.TryParse(id, out var goalId))
        return Results.BadRequest("Invalid goal id.");

    var goal = await db.Goals.FirstOrDefaultAsync(x => x.Id == goalId && x.UserId == userId.Value);
    if (goal is null)
        return Results.NotFound();

    if (string.IsNullOrWhiteSpace(req.Title))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["title"] = ["Title is required."]
        });
    }

    goal.Title = req.Title.Trim();
    goal.WhyItMatters = req.WhyItMatters?.Trim();
    goal.Lane = req.Lane;
    goal.Type = req.Type;
    goal.Status = req.Status;
    goal.Priority = req.Priority;
    goal.DueStyle = req.DueStyle;
    goal.RealDeadline = req.RealDeadline;
    goal.TargetDate = req.TargetDate;
    goal.MinimumTouchFrequency = req.MinimumTouchFrequency;
    goal.CurrentMilestone = req.CurrentMilestone?.Trim();
    goal.NextTinyAction = req.NextTinyAction?.Trim();
    goal.TypicalSessionSize = req.TypicalSessionSize;
    goal.Energy = req.Energy;
    goal.Resistance = req.Resistance;
    goal.Excitement = req.Excitement;
    goal.LastTouchedAt = req.LastTouchedAt;
    goal.Notes = req.Notes;
    goal.CreatedAt = req.CreatedAt;
    goal.UpdatedAt = string.IsNullOrWhiteSpace(req.UpdatedAt)
        ? DateTime.UtcNow.ToString("O")
        : req.UpdatedAt;

    await db.SaveChangesAsync();

    return Results.Ok(ToGoalDto(goal));
});

authenticatedApi.MapDelete("/goals/{id}", async (
    string id,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (!Guid.TryParse(id, out var goalId))
        return Results.BadRequest("Invalid goal id.");

    var goal = await db.Goals.FirstOrDefaultAsync(x => x.Id == goalId && x.UserId == userId.Value);
    if (goal is null)
        return Results.NotFound();

    db.Goals.Remove(goal);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

authenticatedApi.MapGet("/weekly-review/current", async (
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var weekStartDate = GetStartOfWeekIso(DateTime.UtcNow);

    var existing = await db.WeeklyReviews
        .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.WeekStartDate == weekStartDate);

    if (existing is null)
    {
        var now = DateTime.UtcNow.ToString("O");

        existing = new WeeklyReviewEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            WeekStartDate = weekStartDate,
            AnchorGoalIdsJson = "[]",
            InfrastructureGoalId = null,
            MaintenanceGoalIdsJson = "[]",
            CreativeGoalId = null,
            Notes = string.Empty,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.WeeklyReviews.Add(existing);
        await db.SaveChangesAsync();
    }

    return Results.Ok(ToWeeklyReviewDto(existing));
});

authenticatedApi.MapPut("/weekly-review/current", async (
    SaveWeeklyReviewRequest req,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var weekStartDate = string.IsNullOrWhiteSpace(req.WeekStartDate)
        ? GetStartOfWeekIso(DateTime.UtcNow)
        : req.WeekStartDate;

    var existing = await db.WeeklyReviews
        .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.WeekStartDate == weekStartDate);

    if (existing is null)
    {
        existing = new WeeklyReviewEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            CreatedAt = string.IsNullOrWhiteSpace(req.CreatedAt) ? DateTime.UtcNow.ToString("O") : req.CreatedAt
        };

        db.WeeklyReviews.Add(existing);
    }

    existing.WeekStartDate = weekStartDate;
    existing.AnchorGoalIdsJson = JsonSerializer.Serialize(req.AnchorGoalIds ?? []);
    existing.InfrastructureGoalId = req.InfrastructureGoalId;
    existing.MaintenanceGoalIdsJson = JsonSerializer.Serialize(req.MaintenanceGoalIds ?? []);
    existing.CreativeGoalId = req.CreativeGoalId;
    existing.Notes = req.Notes ?? string.Empty;
    existing.UpdatedAt = DateTime.UtcNow.ToString("O");

    await db.SaveChangesAsync();

    return Results.Ok(ToWeeklyReviewDto(existing));
});

authenticatedApi.MapPost("/weekly-review/reset", async (
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var weekStartDate = GetStartOfWeekIso(DateTime.UtcNow);

    var existing = await db.WeeklyReviews
        .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.WeekStartDate == weekStartDate);

    var now = DateTime.UtcNow.ToString("O");

    if (existing is null)
    {
        existing = new WeeklyReviewEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            CreatedAt = now
        };

        db.WeeklyReviews.Add(existing);
    }

    existing.WeekStartDate = weekStartDate;
    existing.AnchorGoalIdsJson = "[]";
    existing.InfrastructureGoalId = null;
    existing.MaintenanceGoalIdsJson = "[]";
    existing.CreativeGoalId = null;
    existing.Notes = string.Empty;
    existing.UpdatedAt = now;

    await db.SaveChangesAsync();

    return Results.Ok(ToWeeklyReviewDto(existing));
});

authenticatedApi.MapGet("/inbox", async (
    ClaimsPrincipal principal,
    LifeCopilotDbContext db
) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var inboxEntries = await db.InboxEntries
        .Where(x => x.UserId == userId.Value)
        .OrderByDescending(x => x.UpdatedAt)
        .ToListAsync();

    return Results.Ok(inboxEntries.Select(ToInboxEntryDto));    
});

authenticatedApi.MapPost("/inbox", async (
    CreateInboxEntryRequest req,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db
) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var text  = req.Text?.Trim() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(text))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
           ["text"] = ["text is required."] 
        });
    }

    var now = DateTime.UtcNow.ToString("O");

    var entry = new InboxEntryEntity
    {
        Id = Guid.NewGuid(),
        UserId = userId.Value,
        Text = text,
        Status = "new",
        Notes = string.Empty,
        LinkedGoalId = null,
        CapturedAt = now,
        UpdatedAt = now,
        CompletedAt = null  
    };

    db.InboxEntries.Add(entry);
    await db.SaveChangesAsync();

    return Results.Ok(ToInboxEntryDto(entry));
});

authenticatedApi.MapPut("/inbox/{id}", async (
    string id,
    UpdateInboxEntryRequest req,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db

) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (!Guid.TryParse(id, out var entryId))
        return Results.BadRequest("Invalid inbox entry id.");

    var existing = await db.InboxEntries
        .FirstOrDefaultAsync(x => x.Id == entryId && x.UserId == userId.Value);

    if (existing is null)
        return Results.NotFound();

    var text = req.Text?.Trim() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(text))
    {
        return Results.ValidationProblem( new Dictionary<string, string[]>
        {
            ["text"] = ["Text is required."]
        });
    }

    existing.Text = text;
    existing.Status = req.Status;
    existing.Notes = req.Notes;
    existing.LinkedGoalId = req.LinkedGoalId;
    existing.CapturedAt = req.CapturedAt;
    existing.CompletedAt = req.CompletedAt;
    existing.UpdatedAt = DateTime.UtcNow.ToString("O");

    await db.SaveChangesAsync();

    return Results.Ok(ToInboxEntryDto(existing));
});

authenticatedApi.MapPatch("/inbox/{id}/status", async (
    string id,
    UpdateInboxStatusRequest req,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db
) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (!Guid.TryParse(id, out var entryId))
        return Results.BadRequest("Invalid inbox entry id.");

    var existing = await db.InboxEntries
        .FirstOrDefaultAsync(x => x.Id == entryId && x.UserId == userId.Value);

    if (existing is null)
        return Results.NotFound();

    existing.Status = req.Status;
    existing.UpdatedAt = DateTime.UtcNow.ToString("O");

    await db.SaveChangesAsync();

    return Results.Ok(ToInboxEntryDto(existing));
});

authenticatedApi.MapPatch("/inbox/{id}/convert", async (
    string id,
    ConvertInboxEntryRequest req,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db
) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (!Guid.TryParse(id, out var entryId))
        return Results.BadRequest("Invalid inbox entry id.");

    var existing = await db.InboxEntries
        .FirstOrDefaultAsync(x => x.Id == entryId && x.UserId == userId.Value);

    if (existing is null)
        return Results.NotFound();

    if (string.IsNullOrWhiteSpace(req.GoalId))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["goaId"] = ["GoalId is required."]
        });
    }

    existing.LinkedGoalId = req.GoalId;
    existing.Status = "archived";
    existing.UpdatedAt = DateTime.UtcNow.ToString("O");

    await db.SaveChangesAsync();

    return Results.Ok(ToInboxEntryDto(existing));
});

authenticatedApi.MapDelete("/inbox/{id}", async (
    string id,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db
) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (!Guid.TryParse(id, out var entryId))
        return Results.BadRequest("Invalid inbox entry id.");

    var existing = await db.InboxEntries
        .FirstOrDefaultAsync(x => x.Id == entryId && x.UserId == userId.Value);

    if (existing is null)
        return Results.NotFound();

    db.InboxEntries.Remove(existing);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

authenticatedApi.MapGet("/daily-rotation/{date}", async (
    string date,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var existing = await db.DailyRotations
        .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.Date == date);

    if (existing is null)
    {
        return Results.Ok(new List<DailyRotationItemDto>());
    }

    var items = JsonSerializer.Deserialize<List<DailyRotationItemDto>>(existing.ItemsJson) ?? [];
    return Results.Ok(items);
});

authenticatedApi.MapPut("/daily-rotation/{date}", async (
    string date,
    SaveDailyRotationRequest req,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var now = DateTime.UtcNow.ToString("O");

    var existing = await db.DailyRotations
        .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.Date == date);

    if (existing is null)
    {
        existing = new DailyRotationEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            Date = date,
            CreatedAt = now
        };

        db.DailyRotations.Add(existing);
    }

    existing.Date = date;
    existing.ItemsJson = JsonSerializer.Serialize(req.Items ?? []);
    existing.UpdatedAt = now;

    await db.SaveChangesAsync();

    var items = JsonSerializer.Deserialize<List<DailyRotationItemDto>>(existing.ItemsJson) ?? [];
    return Results.Ok(items);
});

authenticatedApi.MapDelete("/daily-rotation/{date}", async (
    string date,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var existing = await db.DailyRotations
        .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.Date == date);

    if (existing is null)
        return Results.NoContent();

    db.DailyRotations.Remove(existing);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

authenticatedApi.MapGet("/completion-history", async (
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var summaries = await db.DailyCompletionSummaries
        .Where(x => x.UserId == userId.Value)
        .OrderByDescending(x => x.Date)
        .ToListAsync();

    return Results.Ok(summaries.Select(ToDailyCompletionSummaryDto));
});

authenticatedApi.MapPut("/completion-history/{date}", async (
    string date,
    DailyCompletionSummaryDto req,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(date))
        return Results.BadRequest("Date is required.");

    var existing = await db.DailyCompletionSummaries
        .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.Date == date);

    if (existing is null)
    {
        existing = new DailyCompletionSummaryEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            Date = date
        };

        db.DailyCompletionSummaries.Add(existing);
    }

    existing.CompletedCount = req.CompletedCount;
    existing.TotalCount = req.TotalCount;
    existing.CompletionPercent = req.CompletionPercent;
    existing.FullyCompleted = req.FullyCompleted;
    existing.UpdatedAt = DateTime.UtcNow.ToString("O");

    await db.SaveChangesAsync();

    return Results.Ok(ToDailyCompletionSummaryDto(existing));
});

authenticatedApi.MapGet("/goal-progress/goal/{goalId}", async (
    string goalId,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var events = await db.GoalProgressEvents
        .Where(x => x.UserId == userId.Value && x.GoalId == goalId)
        .OrderByDescending(x => x.CreatedAt)
        .ToListAsync();

    return Results.Ok(events.Select(ToGoalProgressEventDto));
});

authenticatedApi.MapGet("/goal-progress/source-item/{sourceItemId}", async (
    string sourceItemId,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    var existing = await db.GoalProgressEvents
        .FirstOrDefaultAsync(x => x.UserId == userId.Value && x.SourceItemId == sourceItemId);

    if (existing is null)
        return Results.NotFound();

    return Results.Ok(ToGoalProgressEventDto(existing));
});

authenticatedApi.MapPost("/goal-progress", async (
    GoalProgressEventDto req,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(req.GoalId))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["goalId"] = ["GoalId is required."]
        });
    }

    var entity = new GoalProgressEventEntity
    {
        Id = Guid.NewGuid(),
        UserId = userId.Value,
        GoalId = req.GoalId,
        Date = req.Date,
        CreatedAt = string.IsNullOrWhiteSpace(req.CreatedAt)
            ? DateTime.UtcNow.ToString("O")
            : req.CreatedAt,
        Type = req.Type,
        TaskText = req.TaskText,
        Notes = req.Notes,
        Source = req.Source,
        SourceItemId = req.SourceItemId
    };

    db.GoalProgressEvents.Add(entity);
    await db.SaveChangesAsync();

    return Results.Ok(ToGoalProgressEventDto(entity));
});

authenticatedApi.MapDelete("/goal-progress/{id}", async (
    string id,
    ClaimsPrincipal principal,
    LifeCopilotDbContext db) =>
{
    var userId = GetCurrentUserId(principal);
    if (userId is null)
        return Results.Unauthorized();

    if (!Guid.TryParse(id, out var eventId))
        return Results.BadRequest("Invalid goal progress event id.");

    var existing = await db.GoalProgressEvents
        .FirstOrDefaultAsync(x => x.Id == eventId && x.UserId == userId.Value);

    if (existing is null)
        return Results.NotFound();

    db.GoalProgressEvents.Remove(existing);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.Run();

static Dictionary<string, string[]> ValidateCreation(CreateJobCardRequest req) 
    => ValidateCore(req.Company, req.Role, req.Stage, req.Link, req.NextAction);
static Dictionary<string, string[]> ValidateUpdate(UpdateJobCardRequest req) 
    => ValidateCore(req.Company, req.Role, req.Stage, req.Link, req.NextAction);


static Dictionary<string, string[]> ValidateCore(string company, string role, string stage, string? link = null, string? NextAction = null)
{
    var errors = new Dictionary<string, string[]>();

    if (string.IsNullOrWhiteSpace(company)) errors["company"] = ["Company is required."];
    else if (company.Length > 200) errors["company"] = ["Company must be <= 200 characters."];

    if (string.IsNullOrWhiteSpace(role)) errors["role"] = ["Role is required."];
    else if (role.Length > 200) errors["role"] = ["Role must be <= 200 characters."];

    if (string.IsNullOrWhiteSpace(stage)) errors["stage"] = ["Stage is required"];
    else
    {
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            { "toApply", "applied", "followUp", "interview" };
        if (!string.IsNullOrWhiteSpace(stage) && !allowed.Contains(stage))
            errors["stage"] = [$"Stage must be one of: {string.Join(", ", allowed)}."];
    }

    if(!string.IsNullOrWhiteSpace(link) && link.Length > 500) errors["link"] = ["Link must be <= 500 characters"];
    if(!string.IsNullOrWhiteSpace(NextAction) && NextAction.Length > 500) errors["nextAction"] = ["NextAction must be <= 500 characters"];

    return errors;
}   

static string CreateJwt(UserEntity user, IConfiguration config)
{
    var issuer = config["Jwt:Issuer"]!;
    var audience = config["Jwt:Audience"]!;
    var key = config["Jwt:Key"]!;
    var expiryMinutes = int.TryParse(config["Jwt:ExpiryMinutes"], out var parsed) ? parsed : 60;

    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new(ClaimTypes.Email, user.Email)
    };

    if (!string.IsNullOrWhiteSpace(user.DisplayName))
    {
        claims.Add(new Claim(ClaimTypes.Name, user.DisplayName));
    }

    var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
    var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
        signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}

static CurrentUserDto ToCurrentUserDto(UserEntity user) => new()
{
    Id = user.Id.ToString(),
    Email = user.Email,
    DisplayName = user.DisplayName,
    IsAuthenticated = true
};

static GoalDto ToGoalDto(GoalEntity goal) => new()
{
    Id = goal.Id.ToString(),
    Title = goal.Title,
    WhyItMatters = goal.WhyItMatters,
    Lane = goal.Lane,
    Type = goal.Type,
    Status = goal.Status,
    Priority = goal.Priority,
    DueStyle = goal.DueStyle,
    RealDeadline = goal.RealDeadline,
    TargetDate = goal.TargetDate,
    MinimumTouchFrequency = goal.MinimumTouchFrequency,
    CurrentMilestone = goal.CurrentMilestone,
    NextTinyAction = goal.NextTinyAction,
    TypicalSessionSize = goal.TypicalSessionSize,
    Energy = goal.Energy,
    Resistance = goal.Resistance,
    Excitement = goal.Excitement,
    LastTouchedAt = goal.LastTouchedAt,
    Notes = goal.Notes,
    CreatedAt = goal.CreatedAt,
    UpdatedAt = goal.UpdatedAt
};

static Guid? GetCurrentUserId(ClaimsPrincipal principal)
{
    var raw = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    return Guid.TryParse(raw, out var userId) ? userId : null;
}

static WeeklyReviewDto ToWeeklyReviewDto(WeeklyReviewEntity entity) => new()
{
    Id = entity.Id.ToString(),
    WeekStartDate = entity.WeekStartDate,
    AnchorGoalIds = JsonSerializer.Deserialize<List<string>>(entity.AnchorGoalIdsJson) ?? [],
    InfrastructureGoalId = entity.InfrastructureGoalId,
    MaintenanceGoalIds = JsonSerializer.Deserialize<List<string>>(entity.MaintenanceGoalIdsJson) ?? [],
    CreativeGoalId = entity.CreativeGoalId,
    Notes = entity.Notes,
    CreatedAt = entity.CreatedAt,
    UpdatedAt = entity.UpdatedAt
};

static string GetStartOfWeekIso(DateTime date)
{
    var copy = date;
    var day = (int)copy.DayOfWeek;
    var diff = day == 0 ? -6 : 1 - day;
    copy = copy.AddDays(diff);
    var start = new DateTime(copy.Year, copy.Month, copy.Day, 0, 0, 0, DateTimeKind.Utc);
    return start.ToString("O");
}

static InboxEntryDto ToInboxEntryDto(InboxEntryEntity entity) => new()
{
    Id = entity.Id.ToString(),
    Text = entity.Text,
    Status = entity.Status,
    Notes = entity.Notes,
    LinkedGoalId = entity.LinkedGoalId,
    CapturedAt = entity.CapturedAt,
    UpdatedAt = entity.UpdatedAt,
    CompletedAt = entity.CompletedAt
};

static DailyCompletionSummaryDto ToDailyCompletionSummaryDto(DailyCompletionSummaryEntity entity) => new()
{
    Date = entity.Date,
    CompletedCount = entity.CompletedCount,
    TotalCount = entity.TotalCount,
    CompletionPercent = entity.CompletionPercent,
    FullyCompleted = entity.FullyCompleted
};

static GoalProgressEventDto ToGoalProgressEventDto(GoalProgressEventEntity entity) => new()
{
    Id = entity.Id.ToString(),
    GoalId = entity.GoalId,
    Date = entity.Date,
    CreatedAt = entity.CreatedAt,
    Type = entity.Type,
    TaskText = entity.TaskText,
    Notes = entity.Notes,
    Source = entity.Source,
    SourceItemId = entity.SourceItemId
};