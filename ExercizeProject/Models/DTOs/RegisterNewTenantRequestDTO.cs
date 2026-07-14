using System;
using System.Collections.Generic;
using System.Text;

namespace Models.DTOs
{
    public class RegisterNewTenantRequestDTO
    {
        public string OrganizationName { get; set; }
        public string OwnerEmail { get; set; }
        public string Password { get; set; }

    }
}
