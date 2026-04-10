
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using LifeCopilot.Api.Data;
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

var apiKey = (app.Configuration["API_KEY"])?.Trim();

app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "";
    var method = context.Request.Method;

    var isSwagger = path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase);
    var isHealth = path.StartsWith("/health", StringComparison.OrdinalIgnoreCase);

    var isMutation = HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsDelete(method) || HttpMethods.IsPatch(method);
    var isAuth = path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase);
    var isGoals = path.StartsWith("/api/goals", StringComparison.OrdinalIgnoreCase);
    var isInbox = path.StartsWith("/api/inbox", StringComparison.OrdinalIgnoreCase);
    var isWeeklyReview = path.StartsWith("/api/weekly-review", StringComparison.OrdinalIgnoreCase);

    if (!isMutation || isSwagger || isHealth || isAuth || isGoals || isInbox || isWeeklyReview)
    {
        await next();
        return;
    }

    if (context.User?.Identity?.IsAuthenticated == true)
    {
        await next();
        return;
    }

    if (string.IsNullOrWhiteSpace(apiKey))
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsync("MIDDLEWARE_API_KEY_NOT_CONFIGURED");
        return;
    }

    var expected = (apiKey ?? "").Trim();

    if (!context.Request.Headers.TryGetValue("X-API-Key", out var provided) ||
        !string.Equals(provided.ToString().Trim(), expected, StringComparison.Ordinal))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsync("MIDDLEWARE_API_KEY_BLOCK");
        return;
    }

    await next();
});

app.MapGet("/debug/claims", (ClaimsPrincipal principal) =>
{
    return Results.Ok(principal.Claims.Select(c => new { c.Type, c.Value }));
}).RequireAuthorization();

app.MapGet("/debug/deploy-marker", () =>
{
    return Results.Ok("DEPLOY_MARKER_2026_04_10_A");
    
});

app.MapGet("/health", (IHostEnvironment env,IConfiguration config) =>
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

app.MapGet("/health/keylen", (IConfiguration cfg) =>
{
    var key = (cfg["API_KEY"] ?? "").Trim();
    return Results.Ok(new { keyLen = key.Length });
});

// Jobs CRUD
app.MapGet("/api/jobs", async (LifeCopilotDbContext db) =>
{
    var jobs = await db.JobCards
        .OrderByDescending( x =>  x.LastTouchedAt )
        .ToListAsync();

    return Results.Ok(jobs);
});

app.MapPost("/api/jobs", async (CreateJobCardRequest req, LifeCopilotDbContext db) =>
{
   var errors = ValidateCreation(req);
   if (errors.Count > 0) return Results.ValidationProblem(errors);

   var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
   var entity = new JobCardEntity
   {
        Id = Guid.NewGuid(),
        Company = req.Company.Trim(),
        Role = req.Role.Trim(),
        Stage = req.Stage.Trim(),
        Link = string.IsNullOrWhiteSpace(req.Link) ? null : req.Link.Trim(),
        CreatedAt = now,
        LastTouchedAt = now,
        NextAction = string.IsNullOrWhiteSpace(req.NextAction) ? null : req.NextAction.Trim(),
        NextTouchAt = req.NextTouchAt
   };

   db.JobCards.Add(entity);
   await db.SaveChangesAsync();

   return Results.Created($"/api/jobs/{entity.Id}", entity);
});

app.MapPut("/api/jobs/{id:guid}", async (Guid id, UpdateJobCardRequest req, LifeCopilotDbContext db) =>
{
    var entity = await db.JobCards.FindAsync(id);
    if (entity is null) return Results.NotFound();

    var errors = ValidateUpdate(req);
    if (errors.Count > 0) return Results.ValidationProblem(errors);

    entity.Company = req.Company.Trim();
    entity.Role = req.Role.Trim();
    entity.Link = string.IsNullOrWhiteSpace(req.Link) ? null : req.Link.Trim();
    entity.Stage = req.Stage.Trim();
    entity.NextAction = string.IsNullOrWhiteSpace(req.NextAction) ? null : req.NextAction.Trim();
    entity.LastTouchedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    entity.NextTouchAt = req.NextTouchAt;

    await db.SaveChangesAsync();
    return Results.Ok(entity);
});

app.MapDelete("/api/jobs/{id:guid}", async (Guid id, LifeCopilotDbContext db) =>
{
   var entity = await db.JobCards.FindAsync(id);
   if (entity is null) return Results.NotFound();

   db.JobCards.Remove(entity);
   await db.SaveChangesAsync();
   return Results.NoContent(); 
});

app.MapGet("/health/db", async (LifeCopilotDbContext db) =>
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

app.MapPost("/api/auth/register", async (
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

app.MapPost("/api/auth/login", async (
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

app.MapGet("/api/auth/me", async (
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
}).RequireAuthorization();

app.MapGet("/api/goals", async (
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
}).RequireAuthorization();

app.MapGet("/api/goals/{id}", async (
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
}).RequireAuthorization();

app.MapPost("/api/goals", async (
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
}).RequireAuthorization();

app.MapPut("/api/goals/{id}", async (
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
}).RequireAuthorization();

app.MapDelete("/api/goals/{id}", async (
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
}).RequireAuthorization();

app.MapGet("/api/weekly-review/current", async (
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
}).RequireAuthorization();

app.MapPut("/api/weekly-review/current", async (
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
}).RequireAuthorization();

app.MapPost("/api/weekly-review/reset", async (
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
}).RequireAuthorization();

app.MapGet("/api/inbox", async (
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
}).RequireAuthorization();

app.MapPost("/api/inbox", async (
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
}).RequireAuthorization();

app.MapPut("/api/inbox/{id}", async (
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
}).RequireAuthorization();

app.MapPatch("/api/inbox/{id}/status", async (
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
}).RequireAuthorization();

app.MapPatch("/api/inbox/{id}/convert", async (
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
}).RequireAuthorization();

app.MapDelete("/api/inbox/{id}", async (
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
}).RequireAuthorization();

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