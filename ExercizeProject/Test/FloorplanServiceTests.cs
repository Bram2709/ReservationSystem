using Microsoft.EntityFrameworkCore;
using Models.DTOs;
using Models.Enums;
using Models.Models;
using System.Text.Json;
using Xunit;

namespace Test
{
    public class FloorplanServiceTests : IDisposable
    {
        private readonly TestApp _app = new();

        public void Dispose() => _app.Dispose();

        private static FloorplanDTO Plan(Guid roomId, params object[] shapes) => new()
        {
            RoomId = roomId,
            Shapes = JsonSerializer.SerializeToElement(shapes),
        };

        private static object Shape(Guid id, int tableNumber, int chairs = 4, int x = 10, int y = 10) => new
        {
            id,
            tableNumber,
            type = "rect-table",
            x,
            y,
            rotation = 0,
            chairs,
            chairsLayout = new[] { chairs / 2, 0, chairs - chairs / 2, 0 },
            width = 100,
            height = 100,
            radius = 0,
            minSeats = 1,
            maxSeats = chairs,
        };

        /// <summary>Org + restaurant + a bare room (no floorplan yet).</summary>
        private (Guid OrgId, Guid RestaurantId, Guid RoomId) SeedRoom()
        {
            var org = new Organization { Id = Guid.NewGuid(), Name = "Org", CreatedAt = DateTime.UtcNow };
            var restaurant = new Restaurant { Id = Guid.NewGuid(), Name = "R", OrganizationId = org.Id };
            var room = new Room { Id = Guid.NewGuid(), Name = "Main", IsActive = true, RestaurantId = restaurant.Id };
            _app.Db.AddRange(org, restaurant, room);
            _app.Db.SaveChanges();
            return (org.Id, restaurant.Id, room.Id);
        }

        [Fact]
        public async Task Save_KeepsTableIdentity_SoReservationsSurviveEdits()
        {
            var (orgId, restaurantId, roomId) = SeedRoom();
            var tableId = Guid.NewGuid();

            await _app.Floorplans.SaveFloorPlanAsync(Plan(roomId, Shape(tableId, 1)), orgId);

            var booking = await _app.Reservations.CreateAsync(
                TestApp.Booking(restaurantId, TestApp.LocalUtc(2030, 6, 10, 19), 2), orgId);
            Assert.Equal(tableId, booking.Reservation!.TableId);

            // Move the table; same id — the reservation must still point at it.
            await _app.Floorplans.SaveFloorPlanAsync(Plan(roomId, Shape(tableId, 1, x: 400)), orgId);

            var after = await _app.Reservations.GetByIdAsync(booking.Reservation.Id, orgId);
            Assert.Equal(tableId, after!.TableId);
            Assert.Equal(400, _app.Db.Tables.AsNoTracking().Single(t => t.Id == tableId).X);
        }

        [Fact]
        public async Task Save_RemovingTable_UnassignsButKeepsReservations()
        {
            var (orgId, restaurantId, roomId) = SeedRoom();
            var keep = Guid.NewGuid();
            var remove = Guid.NewGuid();
            await _app.Floorplans.SaveFloorPlanAsync(Plan(roomId, Shape(keep, 1), Shape(remove, 2)), orgId);

            var booking = await _app.Reservations.CreateAsync(
                TestApp.Booking(restaurantId, TestApp.LocalUtc(2030, 6, 10, 19), 2, tableId: remove), orgId);

            var result = await _app.Floorplans.SaveFloorPlanAsync(Plan(roomId, Shape(keep, 1)), orgId);

            Assert.Equal(1, result!.UnassignedReservationCount);
            var after = await _app.Reservations.GetByIdAsync(booking.Reservation!.Id, orgId);
            Assert.NotNull(after);              // the reservation was kept…
            Assert.Null(after!.TableId);        // …but is no longer seated
        }

        [Fact]
        public async Task Save_AssignsNextFreeNumber_ToUnnumberedTables()
        {
            var (orgId, _, roomId) = SeedRoom();

            await _app.Floorplans.SaveFloorPlanAsync(
                Plan(roomId, Shape(Guid.NewGuid(), 1), Shape(Guid.NewGuid(), 0), Shape(Guid.NewGuid(), 0)), orgId);

            var numbers = _app.Db.Tables.AsNoTracking().Select(t => t.TableNumber).OrderBy(n => n).ToList();
            Assert.Equal(new[] { 1, 2, 3 }, numbers);
        }

        [Fact]
        public async Task Save_ForForeignRoom_IsRefused()
        {
            var (_, _, roomId) = SeedRoom();
            var other = SeedRoom(); // different organization

            var result = await _app.Floorplans.SaveFloorPlanAsync(
                Plan(roomId, Shape(Guid.NewGuid(), 1)), other.OrgId);

            Assert.Null(result);
        }

        [Fact]
        public async Task Save_ReplacesRemovedAndInsertsNew_InOnePass()
        {
            var (orgId, _, roomId) = SeedRoom();
            var a = Guid.NewGuid();
            var b = Guid.NewGuid();
            await _app.Floorplans.SaveFloorPlanAsync(Plan(roomId, Shape(a, 1), Shape(b, 2)), orgId);

            var c = Guid.NewGuid();
            var result = await _app.Floorplans.SaveFloorPlanAsync(Plan(roomId, Shape(a, 1), Shape(c, 0)), orgId);

            Assert.Equal(2, result!.TableCount);
            var ids = _app.Db.Tables.AsNoTracking().Select(t => t.Id).ToHashSet();
            Assert.Contains(a, ids);
            Assert.Contains(c, ids);
            Assert.DoesNotContain(b, ids);
            // The new table takes the next free number after the kept #1.
            Assert.Equal(2, _app.Db.Tables.AsNoTracking().Single(t => t.Id == c).TableNumber);
        }
    }
}
