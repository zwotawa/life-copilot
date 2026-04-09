using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeCopilot.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWeeklyReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WeeklyReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    WeekStartDate = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AnchorGoalIdsJson = table.Column<string>(type: "text", nullable: false),
                    InfrastructureGoalId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MaintenanceGoalIdsJson = table.Column<string>(type: "text", nullable: false),
                    CreativeGoalId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    CreatedAt = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyReviews", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyReviews_UserId_WeekStartDate",
                table: "WeeklyReviews",
                columns: new[] { "UserId", "WeekStartDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeeklyReviews");
        }
    }
}
