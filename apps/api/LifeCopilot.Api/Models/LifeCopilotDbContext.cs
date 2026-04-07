using LifeCopilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeCopilot.Api.Data;

public class LifeCopilotDbContext : DbContext
{
    public LifeCopilotDbContext(DbContextOptions<LifeCopilotDbContext> options) : base(options) { }

    public DbSet<JobCardEntity> JobCards => Set<JobCardEntity>();
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<GoalEntity> Goals => Set<GoalEntity>();

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

        modelBuilder.Entity<GoalEntity>()
            .HasIndex(x => new { x.UserId, x.Status });

        modelBuilder.Entity<GoalEntity>()
            .HasIndex(x => new { x.UserId, x.UpdatedAt });

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Title)
            .HasMaxLength(200);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Description)
            .HasMaxLength(4000);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Lane)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Type)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Status)
            .HasMaxLength(100);
    }
}