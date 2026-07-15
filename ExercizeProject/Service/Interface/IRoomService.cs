using Models.DTOs.Restaurant;
using Models.DTOs.Room;
using Models.Enums;

namespace Service.Interface
{
    public interface IRoomService
    {
        Task<IEnumerable<RoomDto>> GetAllAsync(Guid organizationId, Guid? restaurantId = null);

        Task<RoomDto?> GetByIdAsync(Guid id, Guid organizationId);

        // Null when the target restaurant is not owned by this organization.
        Task<RoomDto?> CreateAsync(CreateRoomDto roomDto, Guid organizationId);

        // Null when the room does not exist for this organization.
        Task<RoomDto?> UpdateAsync(UpdateRoomDto roomDto, Guid organizationId);

        Task<DeleteOutcome> DeleteAsync(Guid id, Guid organizationId);
    }
}
