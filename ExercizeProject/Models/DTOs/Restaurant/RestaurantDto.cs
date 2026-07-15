namespace Models.DTOs.Restaurant
{
    public class RestaurantDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public string? Address { get; set; }
        public List<RoomDto> Rooms { get; set; } = [];
    }

    public class RoomDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public bool IsActive { get; set; }
        public Guid RestaurantId { get; set; }
        public FloorPlanDto? FloorPlan { get; set; }

        // Derived from the room's floorplan rather than stored: a room's capacity is
        // whatever its tables can actually seat.
        public int TableCount { get; set; }
        public int Seats { get; set; }
    }

    public class FloorPlanDto
    {
        public Guid Id { get; set; }
        public List<TableDto> Shapes { get; set; } = [];
    }

    public class TableDto
    {
        public Guid Id { get; set; }
        public int TableNumber { get; set; }
        public int MinSeats { get; set; }
        public int MaxSeats { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int Chairs { get; set; }
        public int Rotation { get; set; }
        public string? Type { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public int Radius { get; set; }
    }
}
