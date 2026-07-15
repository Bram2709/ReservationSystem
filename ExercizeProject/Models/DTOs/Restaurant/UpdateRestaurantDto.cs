using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Restaurant
{
    public class UpdateRestaurantDto
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Address { get; set; }
    }
}
