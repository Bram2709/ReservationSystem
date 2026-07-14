using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs.Room;
using Service.Interface;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RoomController(IRoomService roomService) : Controller
    {
        [HttpGet]
        public async Task<IActionResult> GetAllRooms()
        {
            var rooms = roomService.GetAllAsync();
            return Ok(rooms);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> PostRoom([FromForm] CreateRoomDto roomDto)
        {
            var room = await roomService.CreateAsync(roomDto);
            return Ok(room);
        }
    }
}
