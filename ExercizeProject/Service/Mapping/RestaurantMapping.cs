using Models.DTOs.Restaurant;
using Entities = Models.Models;

namespace Service.Mapping
{
    // Shared by RestaurantService and RoomService so a room is described identically
    // whichever endpoint returns it.
    internal static class RestaurantMapping
    {
        public static RestaurantDto ToDto(this Entities.Restaurant r) => new()
        {
            Id = r.Id,
            Name = r.Name,
            Address = r.Address,
            Rooms = r.Rooms.Select(ToDto).OrderBy(room => room.Name).ToList()
        };

        public static RoomDto ToDto(this Entities.Room room)
        {
            var shapes = room.FloorPlan?.Shapes ?? [];

            // A room's capacity isn't stored; it's whatever its tables can seat. Walls and other
            // decor shapes carry no seats, so they fall out here.
            var tables = shapes.Where(t => t.MaxSeats > 0).ToList();

            return new RoomDto
            {
                Id = room.Id,
                Name = room.Name,
                IsActive = room.IsActive,
                RestaurantId = room.RestaurantId,
                TableCount = tables.Count,
                Seats = tables.Sum(t => t.MaxSeats),
                FloorPlan = room.FloorPlan is null ? null : new FloorPlanDto
                {
                    Id = room.FloorPlan.Id,
                    Shapes = room.FloorPlan.Shapes.Select(t => new TableDto
                    {
                        Id = t.Id,
                        TableNumber = t.TableNumber,
                        MinSeats = t.MinSeats,
                        MaxSeats = t.MaxSeats,
                        X = t.X,
                        Y = t.Y,
                        Chairs = t.Chairs,
                        Rotation = t.Rotation,
                        Type = t.Type,
                        Width = t.Width,
                        Height = t.Height,
                        Radius = t.Radius
                    }).ToList()
                }
            };
        }
    }
}
