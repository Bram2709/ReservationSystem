using Microsoft.EntityFrameworkCore;
using Models.Enums;
using Repository;
using Service.Interface;

namespace API.Services
{
    /// <summary>
    /// Sends each confirmed reservation one reminder email roughly 24 hours ahead.
    /// Runs every 30 minutes; ReminderSentAt guarantees exactly-once per reservation.
    /// </summary>
    public class ReservationReminderService(
        IServiceScopeFactory scopeFactory,
        ILogger<ReservationReminderService> logger) : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(30);

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SendDueRemindersAsync(stoppingToken);
                }
                catch (Exception e)
                {
                    logger.LogError(e, "Reservation reminder pass failed");
                }

                try
                {
                    await Task.Delay(Interval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    return;
                }
            }
        }

        private async Task SendDueRemindersAsync(CancellationToken ct)
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var email = scope.ServiceProvider.GetRequiredService<IEmailSender>();

            // A window rather than an exact instant, so a missed pass still catches up.
            var from = DateTime.UtcNow.AddHours(23);
            var to = DateTime.UtcNow.AddHours(25);

            var due = await db.Reservations
                .Include(r => r.Restaurant)
                .Where(r => !r.IsDeleted
                    && r.Status == ReservationStatus.Confirmed
                    && r.ReminderSentAt == null
                    && r.Email != ""
                    && r.ReservationDateTime >= from
                    && r.ReservationDateTime < to)
                .ToListAsync(ct);

            foreach (var reservation in due)
            {
                var when = reservation.ReservationDateTime.ToLocalTime();
                await email.SendAsync(
                    reservation.Email,
                    $"Reminder: your reservation at {reservation.Restaurant?.Name ?? "the restaurant"} tomorrow",
                    $"Hi {reservation.Name},\n\n" +
                    $"A quick reminder of your reservation:\n" +
                    $"  Restaurant: {reservation.Restaurant?.Name}\n" +
                    $"  When: {when:dddd d MMMM, HH:mm}\n" +
                    $"  Party size: {reservation.PartySize}\n\n" +
                    "We look forward to seeing you!");

                reservation.ReminderSentAt = DateTime.UtcNow;
            }

            if (due.Count > 0)
            {
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Sent {Count} reservation reminder(s)", due.Count);
            }
        }
    }
}
