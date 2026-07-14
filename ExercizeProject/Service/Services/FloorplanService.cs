using Models.DTOs;
using Models.DTOs.Table;
using Models.Models;
using Repository.Interfaces;
using Service.Interface;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Linq;

namespace Service.Services
{
    public class FloorplanService(IFloorplanRepository floorplanRepository) : IFloorplanInterface
    {
        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public async Task<FloorPlan> saveFloorPlan(FloorplanDTO floorplanDto)
        {
            List<TableShapeDto> shapes;
            try
            {
                shapes = JsonSerializer.Deserialize<List<TableShapeDto>>(floorplanDto.Shapes.GetRawText(), _jsonOptions) ?? new List<TableShapeDto>();
            }
            catch (JsonException je)
            {
                // rethrow with the raw JSON so the controller can log it for debugging
                throw new Exception($"Failed to deserialize shapes JSON: {je.Message}. Raw JSON: {floorplanDto.Shapes.GetRawText()}", je);
            }

            // map DTOs to your EF entity. Adjust mapping rules to suit your domain.
            var tables = shapes.Select((s, index) => new Table
            {
                TableNumber = index + 1, // or derive from DTO if available TODO: consider how to handle table numbering - should it be client-generated or server-generated?
                X = s.X,
                Y = s.Y,
                Rotation = s.Rotation,
                Type = s.Type ?? string.Empty,
                // store number of chairs as an int on the entity (preserve layout in DTO if you need it)
                Chairs = s.Chairs,
                MinSeats = 1,
                MaxSeats = s.ChairsLayout?.Count ?? 0,
                ChairsLayout = s.ChairsLayout ?? new List<int>(),
                Height = s.Height ?? 0,
                Width = s.Width ?? 0,
                Radius = s.Radius ?? 0,
                //tablenumber
                // If you need to persist width/height/radius, extend Table entity accordingly
            }).ToList();

            var floorPlan = new FloorPlan
            {
                Id = Guid.NewGuid(),
                RoomId = floorplanDto.RoomId,
                Shapes = tables
            };

            // ensure tables reference the created floorplan id
            foreach (var t in floorPlan.Shapes)
            {
                t.FloorPlanId = floorPlan.Id;
            }

            // persist using repository
            return await floorplanRepository.UpsertFloorplan(floorPlan);
        }

        public Task<IEnumerable<FloorPlan>> GetFloorplansForRoom(Guid roomId)
        {
            return floorplanRepository.GetFloorplansForRoom(roomId);
        }
    }
}
