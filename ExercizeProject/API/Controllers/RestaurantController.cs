using Microsoft.AspNetCore.Mvc;
using Models.Models;
using Service.Interface;
using Service.Services;

namespace API.Controllers
{
    
    [ApiController]
    [Route("api/[controller]")]
    public class RestaurantController(IRestaurantService restaurantService, ILogger<RestaurantController> logger) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Restaurant>>> GetAllRestaurants()
        {
            try
            {
                var restaurants = await restaurantService.GetAllAsync();
                return Ok(restaurants);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while retrieving reservations";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }
    }
}
