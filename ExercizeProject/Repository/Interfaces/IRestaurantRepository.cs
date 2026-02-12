using System;
using System.Collections.Generic;
using System.Text;
using Models.Models;

namespace Repository.Interfaces
{
    public interface IRestaurantRepository
    {
        Task<Restaurant?> GetByIdAsync(int id);
        Task<IEnumerable<Restaurant>> GetAllAsync();
        Task<Restaurant> CreateAsync(Restaurant restaurant);
        Task<Restaurant> UpdateAsync(Restaurant restaurant);
        Task<bool> DeleteAsync(int id);
    }
}
