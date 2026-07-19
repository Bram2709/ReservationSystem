using Models.Enums;
using System;
using System.Collections.Generic;

namespace Models.Models
{
    public class User
    {
        public Guid Id { get; set; }
        required public string Email { get; set; }
        public bool EmailConfirmation { get; set; }
        required public string PasswordHash { get; set; }
        public bool IsActive { get; set; } = true;

        public OrganizationRole Role { get; set; }

        public Guid OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Rotating refresh-token (stored hashed) that backs the httpOnly session cookie.
        public string? RefreshTokenHash { get; set; }
        public DateTime? RefreshTokenExpiresAt { get; set; }

        // One-time password-reset token (stored hashed).
        public string? PasswordResetTokenHash { get; set; }
        public DateTime? PasswordResetExpiresAt { get; set; }
    }
}
