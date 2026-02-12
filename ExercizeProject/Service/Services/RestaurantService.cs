using System;
using System.Collections.Generic;
using System.Text;
using Models.DTOs.Restaurant;
using Models.Models;
using Repository.Interfaces;
using Service.Interface;

namespace Service.Services
{
    public class RestaurantService(IRestaurantRepository restaurantRepository) : IRestaurantService
    {
        public async Task<IEnumerable<Restaurant>> GetAllAsync()
        {
            return await restaurantRepository.GetAllAsync();
        }

        public async Task<Restaurant?> GetByIdAsync(int id)
        {
            return await restaurantRepository.GetByIdAsync(id);
        }

        public async Task<Restaurant> CreateAsync(CreateRestaurantDto restaurantDto)
        {
            Restaurant restaurant = new()
            {
                Name = restaurantDto.Name,

            };

            return await restaurantRepository.CreateAsync(restaurant);
        }

        public async Task<Restaurant> UpdateAsync(UpdateRestaurantDto restaurantDto)
        {
            Restaurant restaurant = new()
            {
                Id = restaurantDto.Id,
                Name = restaurantDto.Name
            };

            return await restaurantRepository.UpdateAsync(restaurant);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await restaurantRepository.DeleteAsync(id);
        }

        public Task OrganizeAsync(int restaurantId)
        {
            throw new NotImplementedException();
        }

        public Task MoveReservationAsync(int reservationId, int newTableId)
        {
            throw new NotImplementedException();
        }
    }
}
