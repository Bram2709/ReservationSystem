namespace Models.DTOs
{
    public class FloorplanSaveResultDto
    {
        public Guid FloorPlanId { get; set; }
        public Guid RoomId { get; set; }
        public int TableCount { get; set; }

        // How many reservations were unassigned because their table was removed in this save.
        public int UnassignedReservationCount { get; set; }
    }
}
