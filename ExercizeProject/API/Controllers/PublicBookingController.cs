using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs.Public;
using Service.Interface;

namespace API.Controllers
{
    /// <summary>Guest-facing booking API: no authentication, minimal data exposure.</summary>
    [AllowAnonymous]
    [ApiController]
    [Route("api/public")]
    public class PublicBookingController(IPublicBookingService bookingService, ILogger<PublicBookingController> logger) : ControllerBase
    {
        [HttpGet("restaurant/{id:guid}")]
        public async Task<ActionResult<PublicRestaurantDto>> GetRestaurant(Guid id)
        {
            try
            {
                var restaurant = await bookingService.GetRestaurantAsync(id);
                return restaurant is null ? NotFound() : Ok(restaurant);
            }
            catch (Exception e)
            {
                logger.LogError(e, "Public restaurant lookup failed for {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        [HttpGet("restaurant/{id:guid}/availability")]
        public async Task<ActionResult<IEnumerable<PublicAvailabilityDto>>> GetAvailability(
            Guid id, [FromQuery] DateOnly date, [FromQuery] int partySize = 2)
        {
            if (partySize < 1 || partySize > 50)
                return BadRequest("Party size must be between 1 and 50.");

            try
            {
                var availability = await bookingService.GetAvailabilityAsync(id, date, partySize);
                return availability is null ? NotFound() : Ok(availability);
            }
            catch (Exception e)
            {
                logger.LogError(e, "Public availability failed for {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        [HttpPost("restaurant/{id:guid}/book")]
        public async Task<ActionResult<PublicBookingResultDto>> Book(Guid id, [FromBody] PublicBookingRequestDto request)
        {
            try
            {
                var (outcome, result) = await bookingService.BookAsync(id, request);
                return outcome switch
                {
                    PublicBookingOutcome.Booked => Ok(result),
                    PublicBookingOutcome.RestaurantNotFound => NotFound(),
                    PublicBookingOutcome.OutsideServiceWindow =>
                        BadRequest("That time is outside the restaurant's booking hours."),
                    PublicBookingOutcome.SlotUnavailable =>
                        Conflict("That time was just taken — please pick another slot."),
                    _ => StatusCode(StatusCodes.Status500InternalServerError),
                };
            }
            catch (Exception e)
            {
                logger.LogError(e, "Public booking failed for {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }
    }
}
