using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeCopilot.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateGoals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "EnergyLevel",
                table: "Goals");

            migrationBuilder.RenameColumn(
                name: "TouchFrequency",
                table: "Goals",
                newName: "TargetDate");

            migrationBuilder.RenameColumn(
                name: "SessionSize",
                table: "Goals",
                newName: "RealDeadline");

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedAt",
                table: "Goals",
                type: "text",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AlterColumn<string>(
                name: "LastTouchedAt",
                table: "Goals",
                type: "text",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DueStyle",
                table: "Goals",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedAt",
                table: "Goals",
                type: "text",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AddColumn<string>(
                name: "CurrentMilestone",
                table: "Goals",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Energy",
                table: "Goals",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Excitement",
                table: "Goals",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MinimumTouchFrequency",
                table: "Goals",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NextTinyAction",
                table: "Goals",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Goals",
                type: "character varying(8000)",
                maxLength: 8000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "Goals",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Resistance",
                table: "Goals",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TypicalSessionSize",
                table: "Goals",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WhyItMatters",
                table: "Goals",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentMilestone",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "Energy",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "Excitement",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "MinimumTouchFrequency",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "NextTinyAction",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "Resistance",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "TypicalSessionSize",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "WhyItMatters",
                table: "Goals");

            migrationBuilder.RenameColumn(
                name: "TargetDate",
                table: "Goals",
                newName: "TouchFrequency");

            migrationBuilder.RenameColumn(
                name: "RealDeadline",
                table: "Goals",
                newName: "SessionSize");

            migrationBuilder.AlterColumn<long>(
                name: "UpdatedAt",
                table: "Goals",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<long>(
                name: "LastTouchedAt",
                table: "Goals",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DueStyle",
                table: "Goals",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<long>(
                name: "CreatedAt",
                table: "Goals",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Goals",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnergyLevel",
                table: "Goals",
                type: "text",
                nullable: true);
        }
    }
}
