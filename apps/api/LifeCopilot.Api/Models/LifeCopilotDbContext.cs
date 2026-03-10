using LifeCopilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeCopilot.Api.Data;

public class LifeCopilotDbContext : DbContext
{
    public LifeCopilotDbContext(DbContextOptions<LifeCopilotDbContext> options) : base(options) { }

    public DbSet<JobCardEntity> JobCards => Set<JobCardEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<JobCardEntity>()
            .HasIndex(x => x.LastTouchedAt);
    }
}