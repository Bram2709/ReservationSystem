using Models.DTOs;
using Models.Models;

namespace Service.Interface
{
    public interface IFloorplanInterface
    {
        // Null when the room is not owned by the caller's organization.
        Task<FloorplanSaveResultDto?> SaveFloorPlanAsync(FloorplanDTO floorplanDto, Guid organizationId);

        Task<IEnumerable<FloorPlan>?> GetFloorplansForRoomAsync(Guid roomId, Guid organizationId);
    }
}
