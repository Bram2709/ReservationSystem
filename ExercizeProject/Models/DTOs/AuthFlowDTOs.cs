using Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Models.DTOs
{
    public class ForgotPasswordRequestDTO
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordRequestDTO
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required, StringLength(100, MinimumLength = 8)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class CreateStaffRequestDTO
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class TeamMemberDTO
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public OrganizationRole Role { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class StaffCreatedDTO
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;

        // Shown once to the inviting owner (and emailed to the staff member).
        public string TempPassword { get; set; } = string.Empty;
    }
}
