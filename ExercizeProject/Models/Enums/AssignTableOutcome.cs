namespace Models.Enums
{
    public enum AssignTableOutcome
    {
        Assigned,

        /// <summary>No such reservation for this organization.</summary>
        ReservationNotFound,

        /// <summary>The table does not exist in this reservation's restaurant.</summary>
        TableNotInRestaurant,

        /// <summary>Another reservation already holds the table in this slot.</summary>
        TableOccupied
    }
}
