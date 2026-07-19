using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs.Customer;
using Service.Interface;
using System.Security.Claims;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController(IReservationService reservationService, ILogger<CustomerController> logger) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers()
        {
            if (!Guid.TryParse(User.FindFirstValue("organizationId"), out var organizationId))
                return Unauthorized();

            try
            {
                return Ok(await reservationService.GetCustomersAsync(organizationId));
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while loading customers";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }
    }
}
