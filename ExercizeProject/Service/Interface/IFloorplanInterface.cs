using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Nodes;
using Models.DTOs;
using Models.Models;

namespace Service.Interface
{
    public interface IFloorplanInterface
    {
        Task<FloorPlan> saveFloorPlan(FloorplanDTO floorplanDto);
        Task<IEnumerable<FloorPlan>> GetFloorplansForRoom(Guid roomId);
    }
}
