namespace Models.DTOs.Customer
{
    /// <summary>A guest, aggregated from their reservation history (keyed by email).</summary>
    public class CustomerDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public int TotalReservations { get; set; }
        public int NoShows { get; set; }
        public int TotalGuests { get; set; }
        public DateTime FirstVisit { get; set; }
        public DateTime LastVisit { get; set; }
    }
}
