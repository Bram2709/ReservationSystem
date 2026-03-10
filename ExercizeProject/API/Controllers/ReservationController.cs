using System.Collections;
using Microsoft.AspNetCore.Mvc;
using Models.Models;
using Service.Interface;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController(IReservationService reservationService, ILogger<ReservationController> logger) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Reservation>>> GetReservationsTask()
        {
            try
            {
                var reservation = await reservationService.GetAllAsync();
                return Ok(reservation);
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
