using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Service.Interface;
using System.Net;
using System.Net.Mail;

namespace Service.Services
{
    /// <summary>
    /// Sends mail through the SMTP server configured under "Email:*" in appsettings.
    /// Registered only when Email:SmtpHost is present; otherwise LoggingEmailSender runs.
    /// </summary>
    public class SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger) : IEmailSender
    {
        public async Task SendAsync(string to, string subject, string body)
        {
            try
            {
                var host = config["Email:SmtpHost"]!;
                var port = int.TryParse(config["Email:SmtpPort"], out var p) ? p : 587;
                var from = config["Email:From"] ?? "noreply@aurareserve.local";

                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = bool.TryParse(config["Email:UseSsl"], out var ssl) ? ssl : true,
                };
                var user = config["Email:User"];
                if (!string.IsNullOrEmpty(user))
                    client.Credentials = new NetworkCredential(user, config["Email:Password"]);

                using var message = new MailMessage(from, to, subject, body);
                await client.SendMailAsync(message);
            }
            catch (Exception e)
            {
                // Email is best-effort: a mail failure must never fail the business operation.
                logger.LogError(e, "Failed to send email to {To}: {Subject}", to, subject);
            }
        }
    }

    /// <summary>Dev fallback when no SMTP server is configured: writes the mail to the log.</summary>
    public class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
    {
        public Task SendAsync(string to, string subject, string body)
        {
            logger.LogInformation("EMAIL (no SMTP configured)\nTo: {To}\nSubject: {Subject}\n{Body}", to, subject, body);
            return Task.CompletedTask;
        }
    }
}
