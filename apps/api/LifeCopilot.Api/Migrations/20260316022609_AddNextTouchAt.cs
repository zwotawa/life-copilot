using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeCopilot.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNextTouchAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "NextTouchAt",
                table: "JobCards",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NextTouchAt",
                table: "JobCards");
        }
    }
}
