
using LifeCopilot.Api.Data;
using LifeCopilot.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//Db
builder.Services.AddDbContext<LifeCopilotDbContext>(opt => 
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

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

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

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
        NextAction = string.IsNullOrWhiteSpace(req.NextAction) ? null : req.NextAction.Trim()
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
        var ok = await db.Database.CanConnectAsync();
        return ok ? Results.Ok(new { status = "ok" }) : Results.Problem("DB connection failed");
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
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