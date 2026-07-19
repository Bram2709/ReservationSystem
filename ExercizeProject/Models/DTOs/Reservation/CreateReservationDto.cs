using Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Reservation
{
    public class CreateReservationDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Range(1, 50)]
        public int PartySize { get; set; }

        [EnumDataType(typeof(TimeFrame))]
        public TimeFrame TimeFrame { get; set; }

        [Required]
        public DateTime ReservationDateTime { get; set; }

        // The restaurant this reservation belongs to. Verified against the caller's
        // organization before the reservation is written.
        [Required]
        public Guid RestaurantId { get; set; }

        // Null until the guest is assigned a table.
        public Guid? TableId { get; set; }

        // Table-hold length; null falls back to the restaurant's default.
        [Range(15, 720)]
        public int? DurationMinutes { get; set; }

        // True queues the reservation instead of booking it: no table, no covers count.
        public bool Waitlisted { get; set; }
    }
}
