using Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Reservation
{
    public class UpdateReservationDto
    {
        [Required]
        public Guid Id { get; set; }

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

        public Guid? TableId { get; set; }

        [Range(15, 720)]
        public int? DurationMinutes { get; set; }
    }
}
