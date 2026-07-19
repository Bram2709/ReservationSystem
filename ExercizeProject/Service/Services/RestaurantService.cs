using Models.DTOs.Restaurant;
using Models.Enums;
using Repository.Interfaces;
using Service.Interface;
using Service.Mapping;
using Entities = Models.Models;

namespace Service.Services
{
    public class RestaurantService(IRestaurantRepository restaurantRepository) : IRestaurantService
    {
        public async Task<IEnumerable<RestaurantDto>> GetAllRestaurantsFromUserAsync(Guid organizationId)
        {
            var restaurants = await restaurantRepository.GetAllRestaurantsFromUserAsync(organizationId);
            return restaurants.Select(ToDto);
        }

        public async Task<RestaurantDto?> GetByIdAsync(Guid id, Guid organizationId)
        {
            var restaurant = await restaurantRepository.GetByIdAsync(id, organizationId);
            return restaurant is null ? null : ToDto(restaurant);
        }

        public async Task<RestaurantDto> CreateAsync(CreateRestaurantDto restaurantDto, Guid organizationId)
        {
            Entities.Restaurant restaurant = new()
            {
                Name = restaurantDto.Name,
                Address = restaurantDto.Address,
                OrganizationId = organizationId
            };

            var created = await restaurantRepository.CreateAsync(restaurant);
            return ToDto(created);
        }

        public async Task<RestaurantDto?> UpdateAsync(UpdateRestaurantDto restaurantDto, Guid organizationId)
        {
            // Load the existing row rather than constructing a detached entity: saving a partially
            // populated Restaurant would blank out OrganizationId and Address.
            var restaurant = await restaurantRepository.GetByIdAsync(restaurantDto.Id, organizationId);
            if (restaurant is null)
                return null;

            restaurant.Name = restaurantDto.Name;
            restaurant.Address = restaurantDto.Address;

            var updated = await restaurantRepository.UpdateAsync(restaurant);
            return ToDto(updated);
        }

        public async Task<RestaurantDto?> UpdateSettingsAsync(Guid restaurantId, RestaurantSettingsDto settings, Guid organizationId)
        {
            var restaurant = await restaurantRepository.GetByIdAsync(restaurantId, organizationId);
            if (restaurant is null)
                return null;

            restaurant.BreakfastStart = settings.BreakfastStart;
            restaurant.BreakfastEnd = settings.BreakfastEnd;
            restaurant.LunchStart = settings.LunchStart;
            restaurant.LunchEnd = settings.LunchEnd;
            restaurant.DinnerStart = settings.DinnerStart;
            restaurant.DinnerEnd = settings.DinnerEnd;
            restaurant.DefaultDurationMinutes = settings.DefaultDurationMinutes;
            restaurant.MaxCoversPerService = settings.MaxCoversPerService;

            var updated = await restaurantRepository.UpdateAsync(restaurant);
            return ToDto(updated);
        }

        public async Task<DeleteOutcome> DeleteAsync(Guid id, Guid organizationId)
        {
            var restaurant = await restaurantRepository.GetByIdAsync(id, organizationId);
            if (restaurant is null)
                return DeleteOutcome.NotFound;

            // Rooms and reservations cascade from Restaurant. Refuse rather than quietly
            // destroying them — the caller has to clear them out first.
            if (await restaurantRepository.HasRoomsAsync(id) ||
                await restaurantRepository.HasReservationsAsync(id))
                return DeleteOutcome.Blocked;

            await restaurantRepository.DeleteAsync(restaurant);
            return DeleteOutcome.Deleted;
        }

        private static RestaurantDto ToDto(Entities.Restaurant r) => RestaurantMapping.ToDto(r);
    }
}
