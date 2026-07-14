using Models.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Repository.Interfaces
{
    public interface IFloorplanRepository
    {
        Task<FloorPlan> CreateFloorplan(FloorPlan floorPlan);
        Task<FloorPlan> UpsertFloorplan(FloorPlan floorPlan);
        Task<IEnumerable<FloorPlan>> GetFloorplansForRoom(Guid roomId);
    }
}
