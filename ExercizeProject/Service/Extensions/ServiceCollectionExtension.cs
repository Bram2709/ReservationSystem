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
        }
    }
}
