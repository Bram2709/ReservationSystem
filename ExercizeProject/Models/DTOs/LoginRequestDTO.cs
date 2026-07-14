namespace Models.DTOs
{
    public class LoginRequestDTO
    {
        required public string Email { get; set; }
        required public string Password { get; set; }
    }
}
