using Models.Enums;

namespace Models.DTOs.Reservation
{
    // Response shape for a reservation. Kept free of navigation properties so
    // serializing never walks Restaurant -> Rooms -> FloorPlan -> Tables and cycles.
    public class ReservationDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PartySize { get; set; }
        public TimeFrame TimeFrame { get; set; }
        public DateTime ReservationDateTime { get; set; }

        public Guid RestaurantId { get; set; }
        public string? RestaurantName { get; set; }

        public Guid? TableId { get; set; }
        public int? TableNumber { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
