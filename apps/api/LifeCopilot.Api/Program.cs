
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
            .WithOrigins("https://life-copilot-opal.vercel.app/", "http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

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

app.Run();

static Dictionary<string, string[]> ValidateCreation(CreateJobCardRequest req) => ValidateCore(req.Company, req.Role, req.Stage);
static Dictionary<string, string[]> ValidateUpdate(UpdateJobCardRequest req) => ValidateCore(req.Company, req.Role, req.Stage);


static Dictionary<string, string[]> ValidateCore(string company, string role, string stage)
{
    var errors = new Dictionary<string, string[]>();

    if (string.IsNullOrWhiteSpace(company)) errors["company"] = ["Company is required."];
    if (string.IsNullOrWhiteSpace(role)) errors["role"] = ["Role is required."];
    if (string.IsNullOrWhiteSpace(stage)) errors["stage"] = ["Stage is required"];

    var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        { "toApply", "applied", "followUp", "interview" };
    if (!string.IsNullOrWhiteSpace(stage) && !allowed.Contains(stage))
        errors["stage"] = [$"Stage must be one of: {string.Join(", ", allowed)}."];

    return errors;
}   