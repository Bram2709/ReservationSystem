using Models.Enums;

namespace Models.Models
{
    public class Reservation
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PartySize { get; set; }
        public TimeFrame TimeFrame { get; set; }
        public DateTime ReservationDateTime { get; set; }

        public ReservationStatus Status { get; set; } = ReservationStatus.Confirmed;

        // How long the table is held from ReservationDateTime; drives overlap conflicts.
        public int DurationMinutes { get; set; } = 120;

        // Stamped when the ~24h reminder email has gone out, so it is sent only once.
        public DateTime? ReminderSentAt { get; set; }

        public Guid? TableId { get; set; }
        public Table? Table { get; set; }
        public Guid RestaurantId { get; set; }
        public Restaurant? Restaurant { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
}
