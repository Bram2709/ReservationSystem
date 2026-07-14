using Models.Models;

namespace Models.DTOs.Room
{
    public class UpdateRoomDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public bool IsActive { get; set; }
        public Guid RestaurantId { get; set; }
    }
}
