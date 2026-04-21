using LifeCopilot.Api.GoalMilestones;
using LifeCopilot.Api.Models;
using LifeCopilot.Api.Surfacing;
using Microsoft.EntityFrameworkCore;

namespace LifeCopilot.Api.Data;

public class LifeCopilotDbContext : DbContext
{
    public LifeCopilotDbContext(DbContextOptions<LifeCopilotDbContext> options) : base(options) { }

    public DbSet<JobCardEntity> JobCards => Set<JobCardEntity>();
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<GoalEntity> Goals => Set<GoalEntity>();
    public DbSet<WeeklyReviewEntity> WeeklyReviews => Set<WeeklyReviewEntity>();
    public DbSet<InboxEntryEntity> InboxEntries => Set<InboxEntryEntity>();
    public DbSet<DailyRotationEntity> DailyRotations => Set<DailyRotationEntity>();
    public DbSet<DailyCompletionSummaryEntity> DailyCompletionSummaries => Set<DailyCompletionSummaryEntity>();
    public DbSet<GoalProgressEventEntity> GoalProgressEvents => Set<GoalProgressEventEntity>();
    public DbSet<SurfacingDecisionEventEntity> SurfacingDecisionEvents => Set<SurfacingDecisionEventEntity>();
    public DbSet<GoalMilestoneEntity> GoalMilestones => Set<GoalMilestoneEntity>();

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
            .Property(x => x.WhyItMatters)
            .HasMaxLength(2000);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Lane)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Type)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Status)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Priority)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.DueStyle)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.MinimumTouchFrequency)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.CurrentMilestone)
            .HasMaxLength(1000);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.NextTinyAction)
            .HasMaxLength(1000);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.TypicalSessionSize)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Energy)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Resistance)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Excitement)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalEntity>()
            .Property(x => x.Notes)
            .HasMaxLength(8000);

        modelBuilder.Entity<WeeklyReviewEntity>()
            .HasIndex(x => new { x.UserId, x.WeekStartDate })
            .IsUnique();

        modelBuilder.Entity<WeeklyReviewEntity>()
            .Property(x => x.WeekStartDate)
            .HasMaxLength(100);

        modelBuilder.Entity<WeeklyReviewEntity>()
            .Property(x => x.InfrastructureGoalId)
            .HasMaxLength(100);

        modelBuilder.Entity<WeeklyReviewEntity>()
            .Property(x => x.CreativeGoalId)
            .HasMaxLength(100);

        modelBuilder.Entity<WeeklyReviewEntity>()
            .Property(x => x.Notes)
            .HasMaxLength(8000);

        modelBuilder.Entity<InboxEntryEntity>()
            .HasIndex(x => new { x.UserId, x.Status });

        modelBuilder.Entity<InboxEntryEntity>()
            .HasIndex(x => new { x.UserId, x.UpdatedAt });

        modelBuilder.Entity<InboxEntryEntity>()
            .Property(x => x.Text)
            .HasMaxLength(4000);

        modelBuilder.Entity<InboxEntryEntity>()
            .Property(x => x.Status)
            .HasMaxLength(100);

        modelBuilder.Entity<InboxEntryEntity>()
            .Property(x => x.LinkedGoalId)
            .HasMaxLength(100);

        modelBuilder.Entity<InboxEntryEntity>()
            .Property(x => x.Notes)
            .HasMaxLength(8000);

        modelBuilder.Entity<DailyRotationEntity>()
            .HasIndex(x => new { x.UserId, x.Date })
            .IsUnique();

        modelBuilder.Entity<DailyRotationEntity>()
            .Property(x => x.Date)
            .HasMaxLength(20);

        modelBuilder.Entity<DailyRotationEntity>()
            .Property(x => x.ItemsJson)
            .HasColumnType("text");

        modelBuilder.Entity<DailyCompletionSummaryEntity>()
            .HasIndex(x => new { x.UserId, x.Date })
            .IsUnique();

        modelBuilder.Entity<DailyCompletionSummaryEntity>()
            .Property(x => x.Date)
            .HasMaxLength(20);

        modelBuilder.Entity<DailyCompletionSummaryEntity>()
            .Property(x => x.UpdatedAt)
            .HasMaxLength(100);
        
        modelBuilder.Entity<GoalProgressEventEntity>()
            .HasIndex(x => new { x.UserId, x.GoalId });

        modelBuilder.Entity<GoalProgressEventEntity>()
            .HasIndex(x => new { x.UserId, x.SourceItemId });

        modelBuilder.Entity<GoalProgressEventEntity>()
            .Property(x => x.GoalId)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalProgressEventEntity>()
            .Property(x => x.Date)
            .HasMaxLength(20);

        modelBuilder.Entity<GoalProgressEventEntity>()
            .Property(x => x.CreatedAt)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalProgressEventEntity>()
            .Property(x => x.Type)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalProgressEventEntity>()
            .Property(x => x.Source)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalProgressEventEntity>()
            .Property(x => x.SourceItemId)
            .HasMaxLength(100);

        modelBuilder.Entity<GoalProgressEventEntity>()
            .Property(x => x.TaskText)
            .HasMaxLength(2000);

        modelBuilder.Entity<GoalProgressEventEntity>()
            .Property(x => x.Notes)
            .HasMaxLength(8000);

        modelBuilder.Entity<SurfacingDecisionEventEntity>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Context).IsRequired();
            entity.Property(x => x.GoalTitle).IsRequired();
            entity.Property(x => x.ReasonsJson).IsRequired();
        });

        modelBuilder.Entity<GoalMilestoneEntity>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title).IsRequired();
            entity.Property(x => x.Status).IsRequired();

            entity.HasIndex(x => new { x.UserId, x.GoalId, x.Order });
        });
    }
}