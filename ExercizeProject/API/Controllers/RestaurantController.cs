using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs.Restaurant;
using Models.Enums;
using Service.Interface;
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
            if (!TryGetOrganizationId(out var organizationId))
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

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<RestaurantDto>> GetRestaurant(Guid id)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var restaurant = await restaurantService.GetByIdAsync(id, organizationId);
                return restaurant is null ? NotFound() : Ok(restaurant);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while retrieving the restaurant";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpPost]
        public async Task<ActionResult<RestaurantDto>> CreateRestaurant([FromBody] CreateRestaurantDto dto)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var created = await restaurantService.CreateAsync(dto, organizationId);
                return CreatedAtAction(nameof(GetRestaurant), new { id = created.Id }, created);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while creating the restaurant";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<RestaurantDto>> UpdateRestaurant(Guid id, [FromBody] UpdateRestaurantDto dto)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            if (id != dto.Id)
                return BadRequest("The id in the route does not match the id in the body.");

            try
            {
                var updated = await restaurantService.UpdateAsync(dto, organizationId);
                return updated is null ? NotFound() : Ok(updated);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while updating the restaurant";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteRestaurant(Guid id)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                return await restaurantService.DeleteAsync(id, organizationId) switch
                {
                    DeleteOutcome.Deleted => NoContent(),
                    DeleteOutcome.NotFound => NotFound(),
                    _ => Conflict("Remove this restaurant's rooms and reservations before deleting it."),
                };
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while deleting the restaurant";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        private bool TryGetOrganizationId(out Guid organizationId) =>
            Guid.TryParse(User.FindFirstValue("organizationId"), out organizationId);
    }
}
