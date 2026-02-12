using Microsoft.EntityFrameworkCore;
using Models.Models;
using Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Repository.Repositories
{
    public class RestaurantRepository(ApplicationDbContext context) : IRestaurantRepository
    {
        public async Task<Restaurant?> GetByIdAsync(int id)
        {
            return await context.Restaurants.FindAsync(id);
        }

        public async Task<IEnumerable<Restaurant>> GetAllAsync()
        {
            return await context.Restaurants.ToListAsync();
        }

        public async Task<Restaurant> CreateAsync(Restaurant restaurant)
        {
            context.Restaurants.Add(restaurant);
            await context.SaveChangesAsync();
            return restaurant;
        }
            
        public async Task<Restaurant> UpdateAsync(Restaurant restaurant)
        {
            var result = context.Restaurants.Update(restaurant);
            await context.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var restaurant = await context.Restaurants.FindAsync(id);

            if (restaurant == null)
            {
                return false;
            }

            context.Restaurants.Remove(restaurant);
            await context.SaveChangesAsync();
            return true;
        }
    }
}
