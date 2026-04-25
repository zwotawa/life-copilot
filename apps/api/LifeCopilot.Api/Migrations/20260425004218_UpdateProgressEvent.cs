using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeCopilot.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProgressEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "MilestoneId",
                table: "GoalProgressEvents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MilestoneTitle",
                table: "GoalProgressEvents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TinyTaskId",
                table: "GoalProgressEvents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TinyTaskTitle",
                table: "GoalProgressEvents",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MilestoneId",
                table: "GoalProgressEvents");

            migrationBuilder.DropColumn(
                name: "MilestoneTitle",
                table: "GoalProgressEvents");

            migrationBuilder.DropColumn(
                name: "TinyTaskId",
                table: "GoalProgressEvents");

            migrationBuilder.DropColumn(
                name: "TinyTaskTitle",
                table: "GoalProgressEvents");
        }
    }
}
