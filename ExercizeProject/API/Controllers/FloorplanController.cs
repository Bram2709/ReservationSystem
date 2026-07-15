using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs;
using Models.Models;
using Service.Interface;
using System.Security.Claims;
using System.Text.Json;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FloorplanController(IFloorplanInterface floorplanInterface, ILogger<FloorplanController> logger) : ControllerBase
    {
        [HttpPost]
        public async Task<ActionResult<FloorplanSaveResultDto>> SaveFloorplan([FromBody] FloorplanDTO floorplanDTO)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            if (floorplanDTO == null || floorplanDTO.Shapes.ValueKind != JsonValueKind.Array)
                return BadRequest("Invalid floorplan data.");

            try
            {
                var result = await floorplanInterface.SaveFloorPlanAsync(floorplanDTO, organizationId);
                return result is null ? NotFound("Room not found for your organization.") : Ok(result);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while saving the floorplan";
                logger.LogError(e, "Failed to save floorplan for RoomId {RoomId}", floorplanDTO?.RoomId);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpGet("{roomId:guid}")]
        public async Task<ActionResult<IEnumerable<FloorPlan>>> GetFloorplansForRoom([FromRoute] Guid roomId)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            if (roomId == Guid.Empty)
                return BadRequest();

            try
            {
                var floorplans = await floorplanInterface.GetFloorplansForRoomAsync(roomId, organizationId);
                return floorplans is null ? NotFound("Room not found for your organization.") : Ok(floorplans);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while retrieving the floorplan";
                logger.LogError(e, "Failed to get floorplans for RoomId {RoomId}", roomId);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        private bool TryGetOrganizationId(out Guid organizationId) =>
            Guid.TryParse(User.FindFirstValue("organizationId"), out organizationId);
    }
}
