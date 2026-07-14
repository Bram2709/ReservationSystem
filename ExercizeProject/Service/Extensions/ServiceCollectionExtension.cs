using Microsoft.Extensions.DependencyInjection;
using Service.Interface;
using Service.Services;
using System;

namespace Service.Extensions
{
    public static class ServiceCollectionExtension
    {
        public static void AddServices(this IServiceCollection services)
        {
            services.AddScoped<IRestaurantService, RestaurantService>();
            services.AddScoped<IReservationService, ReservationService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IFloorplanInterface, FloorplanService>();
            services.AddScoped<IRoomService, RoomService>();

        }
    }
}
