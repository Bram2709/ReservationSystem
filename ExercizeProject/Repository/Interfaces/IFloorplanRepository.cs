using Models.Models;

namespace Repository.Interfaces
{
    public interface IFloorplanRepository
    {
        Task<bool> RoomBelongsToOrganizationAsync(Guid roomId, Guid organizationId);

        /// <summary>
        /// Reconciles the room's floorplan with the desired set of tables, matching by table Id:
        /// existing tables are updated in place (preserving reservation links), new ones inserted,
        /// removed ones deleted. Reservations on a removed table are unassigned rather than deleted.
        /// Returns the floorplan and how many reservations were unassigned.
        /// </summary>
        Task<(FloorPlan FloorPlan, int UnassignedReservationCount)> SyncFloorplanAsync(
            Guid roomId, IReadOnlyList<Table> desiredTables);
    }
}
