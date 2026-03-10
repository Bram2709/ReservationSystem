using Models.Models;

namespace Models.DTOs.Room
{
    public class UpdateRoomDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public bool IsActive { get; set; }
        public int RestaurantId { get; set; }
    }
}
