using System;
using System.Collections.Generic;
using System.Linq;
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

        public async Task<Restaurant> CreateAsync(CreateRestaurantDto restaurantDto, Guid organizationId)
        {
            Restaurant restaurant = new()
            {
                Name = restaurantDto.Name,
                OrganizationId = organizationId
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

        public async Task<IEnumerable<RestaurantDto>> GetAllRestaurantsFromUserAsync(Guid userId)
        {
            var restaurants = await restaurantRepository.GetAllRestaurantsFromUserAsync(userId);

            return restaurants.Select(r => new RestaurantDto
            {
                Id = r.Id,
                Name = r.Name,
                Address = r.Address,
                Rooms = r.Rooms.Select(room => new RoomDto
                {
                    Id = room.Id,
                    Name = room.Name,
                    IsActive = room.IsActive,
                    FloorPlan = room.FloorPlan == null ? null : new FloorPlanDto
                    {
                        Id = room.FloorPlan.Id,
                        Shapes = room.FloorPlan.Shapes.Select(t => new TableDto
                        {
                            Id = t.Id,
                            TableNumber = t.TableNumber,
                            MinSeats = t.MinSeats,
                            MaxSeats = t.MaxSeats,
                            X = t.X,
                            Y = t.Y,
                            Chairs = t.Chairs,
                            Rotation = t.Rotation,
                            Type = t.Type
                        }).ToList()
                    }
                }).ToList()
            });
        }
    }
}
