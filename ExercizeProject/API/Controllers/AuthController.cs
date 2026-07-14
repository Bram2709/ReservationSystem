using Microsoft.AspNetCore.Mvc;
using Models.DTOs;
using Service.Interface;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(IAuthService authService, ILogger<AuthController> logger) : ControllerBase
    {
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm]RegisterNewTenantRequestDTO request)
        {
            try
            {
                var user = await authService.RegisterAsync(request);
                return Ok(new { user.Id, user.Email });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception e)
            {
                logger.LogError(e, "Error during registration");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred during registration.");
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromForm]LoginRequestDTO request)
        {
            try
            {
                var user = await authService.LoginAsync(request);

                if (user is null)
                    return Unauthorized("Invalid email or password.");

                return Ok(new { user.Id, user.Email, user.JwtToken });
            }
            catch (Exception e)
            {
                logger.LogError(e, "Error during login");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred during login.");
            }
        }
    }
}

