using Microsoft.EntityFrameworkCore;
using Models.Models;
using Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Repository.Repositories
{
    public class FloorplanRepository(ApplicationDbContext context) : IFloorplanRepository
    {
        public async Task<FloorPlan> CreateFloorplan(FloorPlan floorPlan)
        {
            context.FloorPlans.Add(floorPlan);
            await context.SaveChangesAsync();
            return floorPlan;
        }

        public Task<IEnumerable<FloorPlan>> GetFloorplansForRoom(Guid roomId)
        {
            return Task.FromResult<IEnumerable<FloorPlan>>(context.FloorPlans
                .Include(fp => fp.Shapes)
                .Where(fp => fp.RoomId == roomId)
                .ToList());
        }

        public async Task<FloorPlan> UpsertFloorplan(FloorPlan floorPlan)
        {
            var existing = await context.FloorPlans
                .Include(fp => fp.Shapes)
                .FirstOrDefaultAsync(fp => fp.RoomId == floorPlan.RoomId);

            if (existing == null)
            {
                await CreateFloorplan(floorPlan);
                return floorPlan;
            }

            // remove existing child tables
            if (existing.Shapes?.Count > 0)
            {
                context.Tables.RemoveRange(existing.Shapes);
            }

            foreach (var t in floorPlan.Shapes)
            {
                t.FloorPlanId = existing.Id;
            }

            existing.Shapes = floorPlan.Shapes;

            context.FloorPlans.Update(existing);
            await context.SaveChangesAsync();

            return existing;
        }
    }
}
