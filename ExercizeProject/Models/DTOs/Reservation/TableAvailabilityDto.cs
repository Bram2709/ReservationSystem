namespace Models.DTOs.Reservation
{
    // One seatable table in a restaurant, annotated with whether it can take a given
    // reservation's slot and party. Drives the "assign a table" picker.
    public class TableAvailabilityDto
    {
        public Guid Id { get; set; }
        public int TableNumber { get; set; }
        public int MinSeats { get; set; }
        public int MaxSeats { get; set; }
        public string? RoomName { get; set; }

        // True when another reservation already holds this table in the same slot.
        public bool IsOccupied { get; set; }
        public string? OccupiedByName { get; set; }

        // True when the table is large enough for the party.
        public bool FitsParty { get; set; }

        // True when this is the table currently assigned to the reservation being edited.
        public bool IsCurrent { get; set; }
    }
}
