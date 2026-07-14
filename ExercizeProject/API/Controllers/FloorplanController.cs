using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Models.DTOs;
using Models.Models;
using Service.Interface;
using System.Collections;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FloorplanController(IFloorplanInterface floorplanInterface, ILogger<FloorplanController> logger) : ControllerBase
    {

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        [HttpPost]
        public async Task<IActionResult> SaveFloorplan([FromBody] FloorplanDTO floorplanDTO)
        {
            if (floorplanDTO == null || floorplanDTO.Shapes.ValueKind != JsonValueKind.Array)
            {
                return BadRequest("Invalid floorplan data.");
            }

            try
            {
                var created = await floorplanInterface.saveFloorPlan(floorplanDTO);
                return Ok(created);
            }
            catch (Exception e)
            {
                logger.LogError(e, "Failed to save floorplan for RoomId {RoomId}", floorplanDTO?.RoomId);
                // return full exception text to aid debugging (remove in production)
                return StatusCode(StatusCodes.Status500InternalServerError, e.ToString());
            }
        }

        [HttpGet("{roomId:guid}")]
        public async Task<ActionResult<IEnumerable<FloorPlan>>> GetFloorplansForRoom([FromRoute] Guid roomId)
        {
            if (roomId == Guid.Empty)
            {
                return BadRequest();
            }
            try
            {
                var floorplans = await floorplanInterface.GetFloorplansForRoom(roomId);
                return Ok(floorplans);
            }
            catch (Exception e)
            {
                logger.LogError(e, "Failed to get floorplans for RoomId {RoomId}", roomId);
                return StatusCode(StatusCodes.Status500InternalServerError, e.ToString());
            }
        }
    }
}
