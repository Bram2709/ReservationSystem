using Models.DTOs.Restaurant;
using Models.Enums;

namespace Service.Interface
{
    public interface IRestaurantService
    {
        Task<IEnumerable<RestaurantDto>> GetAllRestaurantsFromUserAsync(Guid organizationId);

        Task<RestaurantDto?> GetByIdAsync(Guid id, Guid organizationId);

        Task<RestaurantDto> CreateAsync(CreateRestaurantDto restaurantDto, Guid organizationId);

        // Null when the restaurant does not exist for this organization.
        Task<RestaurantDto?> UpdateAsync(UpdateRestaurantDto restaurantDto, Guid organizationId);

        // Null when the restaurant does not exist for this organization.
        Task<RestaurantDto?> UpdateSettingsAsync(Guid restaurantId, RestaurantSettingsDto settings, Guid organizationId);

        Task<DeleteOutcome> DeleteAsync(Guid id, Guid organizationId);
    }
}
