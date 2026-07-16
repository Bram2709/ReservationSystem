using Models.DTOs;
using Models.DTOs.Table;
using Models.Models;
using Repository.Interfaces;
using Service.Interface;
using System.Text.Json;

namespace Service.Services
{
    public class FloorplanService(IFloorplanRepository floorplanRepository) : IFloorplanInterface
    {
        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public async Task<FloorplanSaveResultDto?> SaveFloorPlanAsync(FloorplanDTO floorplanDto, Guid organizationId)
        {
            if (!await floorplanRepository.RoomBelongsToOrganizationAsync(floorplanDto.RoomId, organizationId))
                return null;

            List<TableShapeDto> shapes;
            try
            {
                shapes = JsonSerializer.Deserialize<List<TableShapeDto>>(
                    floorplanDto.Shapes.GetRawText(), _jsonOptions) ?? [];
            }
            catch (JsonException je)
            {
                throw new Exception(
                    $"Failed to deserialize shapes JSON: {je.Message}. Raw JSON: {floorplanDto.Shapes.GetRawText()}", je);
            }

            var tables = MapToTables(shapes);

            var (floorPlan, unassignedCount) = await floorplanRepository.SyncFloorplanAsync(
                floorplanDto.RoomId, tables);

            return new FloorplanSaveResultDto
            {
                FloorPlanId = floorPlan.Id,
                RoomId = floorPlan.RoomId,
                TableCount = tables.Count,
                UnassignedReservationCount = unassignedCount
            };
        }

        private static List<Table> MapToTables(List<TableShapeDto> shapes)
        {
            var tables = shapes.Select(s => new Table
            {
                // Preserve the client's shape id so the same table keeps its identity — and its
                // reservations — across saves. Empty means a brand-new shape (DB assigns the id).
                Id = s.Id,
                TableNumber = s.TableNumber,
                X = s.X,
                Y = s.Y,
                Rotation = s.Rotation,
                Type = s.Type ?? string.Empty,
                Chairs = s.Chairs,
                // Prefer the client's explicit seat range; fall back to deriving from chair
                // count for older payloads. Walls/outlines carry no chairs -> 0 seats.
                MinSeats = s.MinSeats ?? (s.Chairs > 0 ? 1 : 0),
                MaxSeats = s.MaxSeats ?? s.Chairs,
                ChairsLayout = s.ChairsLayout ?? [],
                Height = s.Height ?? 0,
                Width = s.Width ?? 0,
                Radius = s.Radius ?? 0,
                Points = s.Points ?? []
            }).ToList();

            AssignMissingTableNumbers(tables);
            return tables;
        }

        // Give any seatable table without a number the next free one, leaving existing numbers intact.
        private static void AssignMissingTableNumbers(List<Table> tables)
        {
            var used = tables.Where(t => t.TableNumber > 0).Select(t => t.TableNumber).ToHashSet();
            var next = 1;
            foreach (var table in tables.Where(t => t.MaxSeats > 0 && t.TableNumber <= 0))
            {
                while (used.Contains(next)) next++;
                table.TableNumber = next;
                used.Add(next);
            }
        }
    }
}
