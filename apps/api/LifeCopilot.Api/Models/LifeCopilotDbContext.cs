using LifeCopilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeCopilot.Api.Data;

public class LifeCopilotDbContext : DbContext
{
    public LifeCopilotDbContext(DbContextOptions<LifeCopilotDbContext> options) : base(options) { }

    public DbSet<JobCardEntity> JobCards => Set<JobCardEntity>();
    public DbSet<UserEntity> Users => Set<UserEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<JobCardEntity>()
            .HasIndex(x => x.LastTouchedAt);

        modelBuilder.Entity<UserEntity>()
            .HasIndex(x => x.Email)
            .IsUnique();

        modelBuilder.Entity<UserEntity>()
            .Property(x => x.Email)
            .HasMaxLength(320);

        modelBuilder.Entity<UserEntity>()
            .Property(x => x.DisplayName)
            .HasMaxLength(200);
    }
}