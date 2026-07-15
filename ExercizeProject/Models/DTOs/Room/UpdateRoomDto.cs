using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Room
{
    public class UpdateRoomDto
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public required string Name { get; set; }

        public bool IsActive { get; set; }
    }
}
