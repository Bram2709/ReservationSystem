using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Room
{
    public class CreateRoomDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public required string Name { get; set; }

        public bool IsActive { get; set; }

        [Required]
        public Guid RestaurantId { get; set; }
    }
}
