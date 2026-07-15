using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs.Restaurant;
using Models.DTOs.Room;
using Models.Enums;
using Service.Interface;
using System.Security.Claims;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RoomController(IRoomService roomService, ILogger<RoomController> logger) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomDto>>> GetAllRooms([FromQuery] Guid? restaurantId)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var rooms = await roomService.GetAllAsync(organizationId, restaurantId);
                return Ok(rooms);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while retrieving rooms";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<RoomDto>> GetRoom(Guid id)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var room = await roomService.GetByIdAsync(id, organizationId);
                return room is null ? NotFound() : Ok(room);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while retrieving the room";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpPost]
        public async Task<ActionResult<RoomDto>> CreateRoom([FromBody] CreateRoomDto dto)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var created = await roomService.CreateAsync(dto, organizationId);
                if (created is null)
                    return BadRequest("The restaurant does not belong to your organization.");

                return CreatedAtAction(nameof(GetRoom), new { id = created.Id }, created);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while creating the room";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<RoomDto>> UpdateRoom(Guid id, [FromBody] UpdateRoomDto dto)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            if (id != dto.Id)
                return BadRequest("The id in the route does not match the id in the body.");

            try
            {
                var updated = await roomService.UpdateAsync(dto, organizationId);
                return updated is null ? NotFound() : Ok(updated);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while updating the room";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteRoom(Guid id)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                return await roomService.DeleteAsync(id, organizationId) switch
                {
                    DeleteOutcome.Deleted => NoContent(),
                    DeleteOutcome.NotFound => NotFound(),
                    _ => Conflict("This room still has reservations seated at its tables."),
                };
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while deleting the room";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        private bool TryGetOrganizationId(out Guid organizationId) =>
            Guid.TryParse(User.FindFirstValue("organizationId"), out organizationId);
    }
}
