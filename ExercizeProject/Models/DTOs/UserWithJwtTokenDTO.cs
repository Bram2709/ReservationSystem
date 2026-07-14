using Models.Enums;
using Models.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Models.DTOs
{
    public class UserWithJwtTokenDTO
    {
        public Guid Id { get; set; }
        public string Email { get; set; }

        public OrganizationRole Role { get; set; }

        public string JwtToken { get; set; }

    }
}
