using Microsoft.EntityFrameworkCore;
using Models.Models;
using Repository.Interfaces;

namespace Repository.Repositories
{
    public class FloorplanRepository(ApplicationDbContext context) : IFloorplanRepository
    {
        public async Task<bool> RoomBelongsToOrganizationAsync(Guid roomId, Guid organizationId)
        {
            // Room -> Restaurant -> Organization
            return await context.Rooms
                .AnyAsync(r => r.Id == roomId && r.Restaurant!.OrganizationId == organizationId);
        }

        public async Task<IEnumerable<FloorPlan>> GetFloorplansForRoom(Guid roomId)
        {
            return await context.FloorPlans
                .Include(fp => fp.Shapes)
                .Where(fp => fp.RoomId == roomId)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<(FloorPlan FloorPlan, int UnassignedReservationCount)> SyncFloorplanAsync(
            Guid roomId, IReadOnlyList<Table> desiredTables)
        {
            var floorPlan = await context.FloorPlans
                .Include(fp => fp.Shapes)
                .FirstOrDefaultAsync(fp => fp.RoomId == roomId);

            if (floorPlan is null)
            {
                floorPlan = new FloorPlan { Id = Guid.NewGuid(), RoomId = roomId };
                context.FloorPlans.Add(floorPlan);
                foreach (var t in desiredTables)
                {
                    t.FloorPlanId = floorPlan.Id;
                    context.Tables.Add(t);
                }
                await context.SaveChangesAsync();
                return (floorPlan, 0);
            }

            var existingById = floorPlan.Shapes.ToDictionary(t => t.Id);
            var desiredIds = desiredTables.Where(t => t.Id != Guid.Empty).Select(t => t.Id).ToHashSet();

            // Removed tables: unassign their reservations (keep the bookings), then delete the table.
            var removed = floorPlan.Shapes.Where(t => !desiredIds.Contains(t.Id)).ToList();
            var removedIds = removed.Select(t => t.Id).ToList();

            var unassignedCount = 0;
            if (removedIds.Count > 0)
            {
                var affected = await context.Reservations
                    .Where(r => r.TableId != null && removedIds.Contains(r.TableId.Value))
                    .ToListAsync();

                foreach (var reservation in affected)
                {
                    reservation.TableId = null;
                    reservation.UpdatedAt = DateTime.UtcNow;
                }
                unassignedCount = affected.Count;

                context.Tables.RemoveRange(removed);
            }

            foreach (var desired in desiredTables)
            {
                if (desired.Id != Guid.Empty && existingById.TryGetValue(desired.Id, out var current))
                {
                    // Update in place so the Id — and any reservation pointing at it — survives.
                    current.TableNumber = desired.TableNumber;
                    current.Type = desired.Type;
                    current.X = desired.X;
                    current.Y = desired.Y;
                    current.Rotation = desired.Rotation;
                    current.Chairs = desired.Chairs;
                    current.MinSeats = desired.MinSeats;
                    current.MaxSeats = desired.MaxSeats;
                    current.Width = desired.Width;
                    current.Height = desired.Height;
                    current.Radius = desired.Radius;
                    current.ChairsLayout = desired.ChairsLayout;
                }
                else
                {
                    desired.FloorPlanId = floorPlan.Id;
                    context.Tables.Add(desired);
                }
            }

            await context.SaveChangesAsync();

            await context.Entry(floorPlan).Collection(fp => fp.Shapes).LoadAsync();
            return (floorPlan, unassignedCount);
        }
    }
}
