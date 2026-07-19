using Microsoft.AspNetCore.Mvc;
using Models.DTOs;
using Service.Interface;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(IAuthService authService, ILogger<AuthController> logger) : ControllerBase
    {
        private const string RefreshCookie = "refreshToken";

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm] RegisterNewTenantRequestDTO request)
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
        public async Task<IActionResult> Login([FromForm] LoginRequestDTO request)
        {
            try
            {
                var result = await authService.LoginAsync(request);

                if (result is null)
                    return Unauthorized("Invalid email or password.");

                SetRefreshCookie(result.RefreshToken);
                return Ok(new { result.User.Id, result.User.Email, result.User.JwtToken });
            }
            catch (Exception e)
            {
                logger.LogError(e, "Error during login");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred during login.");
            }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            try
            {
                var token = Request.Cookies[RefreshCookie];
                if (string.IsNullOrEmpty(token))
                    return Unauthorized();

                var result = await authService.RefreshAsync(token);
                if (result is null)
                {
                    ClearRefreshCookie();
                    return Unauthorized();
                }

                SetRefreshCookie(result.RefreshToken);
                return Ok(new { result.User.JwtToken });
            }
            catch (Exception e)
            {
                logger.LogError(e, "Error during token refresh");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred during refresh.");
            }
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var token = Request.Cookies[RefreshCookie];
                if (!string.IsNullOrEmpty(token))
                    await authService.LogoutAsync(token);

                ClearRefreshCookie();
                return NoContent();
            }
            catch (Exception e)
            {
                logger.LogError(e, "Error during logout");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred during logout.");
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDTO request)
        {
            try
            {
                await authService.ForgotPasswordAsync(request.Email);
                // Always 200: whether the account exists is not disclosed.
                return Ok(new { message = "If that account exists, a reset email has been sent." });
            }
            catch (Exception e)
            {
                logger.LogError(e, "Error during forgot-password");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred.");
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDTO request)
        {
            try
            {
                var ok = await authService.ResetPasswordAsync(request);
                return ok
                    ? Ok(new { message = "Password updated. You can now log in." })
                    : BadRequest("This reset link is invalid or has expired. Request a new one.");
            }
            catch (Exception e)
            {
                logger.LogError(e, "Error during reset-password");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred.");
            }
        }

        private void SetRefreshCookie(string token)
        {
            Response.Cookies.Append(RefreshCookie, token, new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/api/auth",
                Expires = DateTimeOffset.UtcNow.AddDays(14),
            });
        }

        private void ClearRefreshCookie()
        {
            Response.Cookies.Delete(RefreshCookie, new CookieOptions { Path = "/api/auth" });
        }
    }
}
