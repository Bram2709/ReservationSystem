using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Restaurant
{
    /// <summary>Operational settings; times are minutes from midnight, null = service closed.</summary>
    public class RestaurantSettingsDto
    {
        [Range(0, 1439)] public int? BreakfastStart { get; set; }
        [Range(0, 1439)] public int? BreakfastEnd { get; set; }
        [Range(0, 1439)] public int? LunchStart { get; set; }
        [Range(0, 1439)] public int? LunchEnd { get; set; }
        [Range(0, 1439)] public int? DinnerStart { get; set; }
        [Range(0, 1439)] public int? DinnerEnd { get; set; }

        [Range(15, 720)]
        public int DefaultDurationMinutes { get; set; } = 120;

        [Range(1, 10000)]
        public int? MaxCoversPerService { get; set; }
    }
}
