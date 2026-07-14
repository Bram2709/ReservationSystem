using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs.Restaurant;
using Service.Interface;
using Service.Services;
using System.Security.Claims;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RestaurantController(IRestaurantService restaurantService, ILogger<RestaurantController> logger) : ControllerBase
    {
       
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RestaurantDto>>> GetAllRestaurantsFromUserAsync()
        {
            var organizationIdString = User.FindFirstValue("organizationId");
            if (!Guid.TryParse(organizationIdString, out var organizationId))
                return Unauthorized();

            try
            {
                var restaurants = await restaurantService.GetAllRestaurantsFromUserAsync(organizationId);
                return Ok(restaurants);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while retrieving the user's restaurants";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }


        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateRestaurant([FromForm] CreateRestaurantDto dto)
        {
            var orgClaim = User.FindFirst("organizationId")?.Value;
            if (!Guid.TryParse(orgClaim, out var organizationId))
            {
                return BadRequest();
            }
                

            var created = await restaurantService.CreateAsync(dto, organizationId);
            return Ok(created);
        }
    }
}
