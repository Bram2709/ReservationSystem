using Models.Enums;

namespace Models.Models
{
    public class Reservation
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PartySize { get; set; }
        public TimeFrame TimeFrame { get; set; }
        public DateTime ReservationDateTime { get; set; }

        public int? TableId { get; set; }
        public Table? Table { get; set; }
        public int RestaurantId { get; set; }
        public Restaurant? Restaurant { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
}
