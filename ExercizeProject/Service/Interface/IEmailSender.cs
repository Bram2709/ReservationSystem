namespace Service.Interface
{
    public interface IEmailSender
    {
        /// <summary>Sends a plain-text email. Implementations must not throw on failure.</summary>
        Task SendAsync(string to, string subject, string body);
    }
}
