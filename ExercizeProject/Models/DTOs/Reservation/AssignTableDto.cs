namespace Models.DTOs.Reservation
{
    public class AssignTableDto
    {
        // Null unassigns the reservation from its table.
        public Guid? TableId { get; set; }
    }
}
