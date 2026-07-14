using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repository.Migrations
{
    /// <inheritdoc />
    public partial class DesingChangeFloorplan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tables_Rooms_RoomId",
                table: "Tables");

            migrationBuilder.RenameColumn(
                name: "RoomId",
                table: "Tables",
                newName: "FloorPlanId");

            migrationBuilder.RenameIndex(
                name: "IX_Tables_RoomId",
                table: "Tables",
                newName: "IX_Tables_FloorPlanId");

            migrationBuilder.CreateTable(
                name: "FloorPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FloorPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FloorPlans_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlans_RoomId",
                table: "FloorPlans",
                column: "RoomId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tables_FloorPlans_FloorPlanId",
                table: "Tables",
                column: "FloorPlanId",
                principalTable: "FloorPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tables_FloorPlans_FloorPlanId",
                table: "Tables");

            migrationBuilder.DropTable(
                name: "FloorPlans");

            migrationBuilder.RenameColumn(
                name: "FloorPlanId",
                table: "Tables",
                newName: "RoomId");

            migrationBuilder.RenameIndex(
                name: "IX_Tables_FloorPlanId",
                table: "Tables",
                newName: "IX_Tables_RoomId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tables_Rooms_RoomId",
                table: "Tables",
                column: "RoomId",
                principalTable: "Rooms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
