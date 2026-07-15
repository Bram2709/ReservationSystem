using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs.Reservation;
using Models.Enums;
using Service.Interface;
using System.Security.Claims;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController(IReservationService reservationService, ILogger<ReservationController> logger) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetReservations(
            [FromQuery] Guid? restaurantId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] TimeFrame? timeFrame)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var reservations = await reservationService.GetAllAsync(
                    organizationId, restaurantId, from, to, timeFrame);
                return Ok(reservations);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while retrieving reservations";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ReservationDto>> GetReservation(Guid id)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var reservation = await reservationService.GetByIdAsync(id, organizationId);
                return reservation is null ? NotFound() : Ok(reservation);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while retrieving the reservation";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpPost]
        public async Task<ActionResult<ReservationDto>> CreateReservation([FromBody] CreateReservationDto dto)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var created = await reservationService.CreateAsync(dto, organizationId);
                if (created is null)
                    return BadRequest("The restaurant or table does not belong to your organization.");

                return CreatedAtAction(nameof(GetReservation), new { id = created.Id }, created);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while creating the reservation";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ReservationDto>> UpdateReservation(Guid id, [FromBody] UpdateReservationDto dto)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            if (id != dto.Id)
                return BadRequest("The id in the route does not match the id in the body.");

            try
            {
                var updated = await reservationService.UpdateAsync(dto, organizationId);
                return updated is null ? NotFound() : Ok(updated);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while updating the reservation";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteReservation(Guid id)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var deleted = await reservationService.DeleteAsync(id, organizationId);
                return deleted ? NoContent() : NotFound();
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while deleting the reservation";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpGet("{id:guid}/available-tables")]
        public async Task<ActionResult<IEnumerable<TableAvailabilityDto>>> GetAvailableTables(Guid id)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var tables = await reservationService.GetAvailableTablesAsync(id, organizationId);
                return tables is null ? NotFound() : Ok(tables);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while retrieving available tables";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpPut("{id:guid}/table")]
        public async Task<ActionResult<ReservationDto>> AssignTable(Guid id, [FromBody] AssignTableDto dto)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var (outcome, reservation) = await reservationService.AssignTableAsync(id, dto.TableId, organizationId);
                return outcome switch
                {
                    AssignTableOutcome.Assigned => Ok(reservation),
                    AssignTableOutcome.ReservationNotFound => NotFound(),
                    AssignTableOutcome.TableNotInRestaurant => BadRequest("That table is not part of this reservation's restaurant."),
                    AssignTableOutcome.TableOccupied => Conflict("That table is already taken for this service."),
                    _ => StatusCode(StatusCodes.Status500InternalServerError),
                };
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while assigning the table";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        private bool TryGetOrganizationId(out Guid organizationId) =>
            Guid.TryParse(User.FindFirstValue("organizationId"), out organizationId);
    }
}
