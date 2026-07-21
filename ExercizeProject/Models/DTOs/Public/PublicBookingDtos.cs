using Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Public
{
    /// <summary>What an anonymous guest may know about a restaurant.</summary>
    public class PublicRestaurantDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public List<PublicServiceDto> Services { get; set; } = [];
    }

    /// <summary>A bookable service and its window (minutes from midnight, local).</summary>
    public class PublicServiceDto
    {
        public TimeFrame TimeFrame { get; set; }
        public int Start { get; set; }
        public int End { get; set; }
    }

    public class PublicAvailabilityDto
    {
        public TimeFrame TimeFrame { get; set; }

        /// <summary>Bookable local start times for this service, "HH:mm".</summary>
        public List<string> Slots { get; set; } = [];
    }

    public class PublicBookingRequestDto
    {
        [Required, StringLength(100, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Range(1, 50)]
        public int PartySize { get; set; }

        [EnumDataType(typeof(TimeFrame))]
        public TimeFrame TimeFrame { get; set; }

        [Required]
        public DateTime ReservationDateTime { get; set; }
    }

    public class PublicBookingResultDto
    {
        public Guid ReservationId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public DateTime ReservationDateTime { get; set; }
        public int PartySize { get; set; }
    }
}
