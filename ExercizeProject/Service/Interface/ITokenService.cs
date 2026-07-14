using Models.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Service.Interface
{
    public interface ITokenService
    {
        string GenerateJwtToken(User user);
    }
}
