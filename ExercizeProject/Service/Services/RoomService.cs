using Models.DTOs.Restaurant;
using Models.DTOs.Room;
using Models.Enums;
using Repository.Interfaces;
using Service.Interface;
using Service.Mapping;
using Entities = Models.Models;

namespace Service.Services
{
    public class RoomService(IRoomRepository roomRepository) : IRoomService
    {
        public async Task<IEnumerable<RoomDto>> GetAllAsync(Guid organizationId, Guid? restaurantId = null)
        {
            var rooms = await roomRepository.GetAllAsync(organizationId, restaurantId);
            return rooms.Select(RestaurantMapping.ToDto);
        }

        public async Task<RoomDto?> GetByIdAsync(Guid id, Guid organizationId)
        {
            var room = await roomRepository.GetByIdAsync(id, organizationId);
            return room is null ? null : RestaurantMapping.ToDto(room);
        }

        public async Task<RoomDto?> CreateAsync(CreateRoomDto roomDto, Guid organizationId)
        {
            if (!await roomRepository.RestaurantBelongsToOrganizationAsync(roomDto.RestaurantId, organizationId))
                return null;

            Entities.Room room = new()
            {
                Name = roomDto.Name,
                IsActive = roomDto.IsActive,
                RestaurantId = roomDto.RestaurantId
            };

            var created = await roomRepository.CreateAsync(room);
            return RestaurantMapping.ToDto(created);
        }

        public async Task<RoomDto?> UpdateAsync(UpdateRoomDto roomDto, Guid organizationId)
        {
            // Load the existing row rather than constructing a detached entity, so RestaurantId
            // and the room's floorplan link survive the update.
            var room = await roomRepository.GetByIdAsync(roomDto.Id, organizationId);
            if (room is null)
                return null;

            room.Name = roomDto.Name;
            room.IsActive = roomDto.IsActive;

            var updated = await roomRepository.UpdateAsync(room);
            return RestaurantMapping.ToDto(updated);
        }

        public async Task<DeleteOutcome> DeleteAsync(Guid id, Guid organizationId)
        {
            var room = await roomRepository.GetByIdAsync(id, organizationId);
            if (room is null)
                return DeleteOutcome.NotFound;

            // Deleting a room cascades its floorplan and tables away. Refuse while reservations
            // are still seated at those tables.
            if (await roomRepository.HasReservationsAsync(id))
                return DeleteOutcome.Blocked;

            await roomRepository.DeleteAsync(room);
            return DeleteOutcome.Deleted;
        }
    }
}
