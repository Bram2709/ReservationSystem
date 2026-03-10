using System;
using System.Collections.Generic;
using System.Text;
using Models.DTOs.Restaurant;
using Models.Models;

namespace Service.Interface
{
    public interface IRestaurantService
    {
        Task<IEnumerable<Restaurant>> GetAllAsync();
        Task<Restaurant?> GetByIdAsync(int id);
        Task<Restaurant> CreateAsync(CreateRestaurantDto restaurantDto);
        Task<Restaurant> UpdateAsync(UpdateRestaurantDto restaurantDto);
        Task<bool> DeleteAsync(int id);

        Task OrganizeAsync(int restaurantId);
        Task MoveReservationAsync(int reservationId, int newTableId);
    }
}
