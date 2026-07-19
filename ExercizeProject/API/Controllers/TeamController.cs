using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs;
using Service.Interface;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace API.Controllers
{
    // Team management is owner-only: staff accounts can't invite or remove colleagues.
    [Authorize(Roles = "Owner")]
    [ApiController]
    [Route("api/[controller]")]
    public class TeamController(IAuthService authService, ILogger<TeamController> logger) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamMemberDTO>>> GetTeam()
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                return Ok(await authService.GetTeamAsync(organizationId));
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while loading the team";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpPost]
        public async Task<ActionResult<StaffCreatedDTO>> InviteStaff([FromBody] CreateStaffRequestDTO request)
        {
            if (!TryGetOrganizationId(out var organizationId))
                return Unauthorized();

            try
            {
                var created = await authService.CreateStaffAsync(organizationId, request.Email);
                return created is null
                    ? Conflict("An account with this email already exists.")
                    : Ok(created);
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while creating the staff account";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        [HttpDelete("{userId:guid}")]
        public async Task<IActionResult> RemoveStaff(Guid userId)
        {
            if (!TryGetOrganizationId(out var organizationId) || !TryGetUserId(out var callerId))
                return Unauthorized();

            try
            {
                var ok = await authService.RemoveStaffAsync(organizationId, userId, callerId);
                return ok ? NoContent() : BadRequest("This member can't be removed.");
            }
            catch (Exception e)
            {
                const string errorMsg = "An error occurred while removing the staff account";
                logger.LogError(e, errorMsg);
                return StatusCode(StatusCodes.Status500InternalServerError, errorMsg);
            }
        }

        private bool TryGetOrganizationId(out Guid organizationId) =>
            Guid.TryParse(User.FindFirstValue("organizationId"), out organizationId);

        private bool TryGetUserId(out Guid userId) =>
            Guid.TryParse(
                User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier),
                out userId);
    }
}
