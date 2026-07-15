import { useFloorplan } from "../../hooks/useFloorplan";
import { FloorplanCanvas } from "../../Components/Floorplan/FloorplanCanvas/FloorplanCanvas";
import { Toolbar } from "../../Components/Floorplan/Toolbar/Toolbar";
import style from "./Floorplan.module.css";
import { FloorplanService } from "../../services/floorplanService";
import { useRestaurants } from "../../hooks/useRestaurants";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function Floorplan() {
  const {
    shapes,
    isLoading,
    loadFloorplan,
    addRectTable,
    addCircleTable,
    addWall,
    updateShape,
    setTableNumber,
    batchUpdateShapes,
    selectedId,
    setSelectedId,
    selectedIds,
    toggleWallSelection,
    createRoom
  } = useFloorplan();

  const { restaurants } = useRestaurants();

  // The Restaurants page links here with ?roomId=… to jump straight to a room's floorplan.
  const [searchParams] = useSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState<string>(searchParams.get("roomId") ?? "");

  // derive flat list of rooms with restaurant name
  const rooms = restaurants.flatMap(r => r.rooms.map(room => ({ ...room, restaurantName: r.name })));

  // derive the currently selected shape object
  const selectedShape = shapes.find(s => s.id === selectedId);

  useEffect(() => {
    if (rooms.length && !selectedRoomId) setSelectedRoomId(rooms[0].id);
  }, [rooms]);

  useEffect(() => {
    if (selectedRoomId) loadFloorplan(selectedRoomId);
  }, [selectedRoomId]);

  function handleRoomChange(id: string) {
    setSelectedRoomId(id);
  }

  async function saveFloorPlan() {
    if (!selectedRoomId) return;
    await FloorplanService.saveFloorplan(shapes, selectedRoomId);
  }

  return (
    <div className={style.wrapper}>
      <div className={style.leftSide}>
        <h1>Restaurant Floorplan Editor</h1>

        <div className={style.roomSelector}>
          <label htmlFor="select-room">Edit room:</label>
          <select
            id="select-room"
            value={selectedRoomId}
            onChange={(e) => handleRoomChange(e.target.value)}
          >
            <option value="">-- Select a room --</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.restaurantName})
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p>Loading floorplan…</p>
        ) : (
          <FloorplanCanvas
            shapes={shapes}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={setSelectedId}
            onMultiSelect={toggleWallSelection}
            onUpdate={updateShape}
            onBatchUpdate={batchUpdateShapes}
          />
        )}
      </div>
      
      <div className={style.rightSide}>
        <Toolbar
          onAddRect={() => addRectTable(2, 0, 2, 0)}
          onAddRectWithSideChair={() => addRectTable(2,1,2,0)}
          onAddRectWithSideChairs={() => addRectTable(2,1,2,1)}
          onAddCircle={addCircleTable}
          onAddWall={addWall}
          onGroupAsRoom={() => createRoom(selectedIds)}
          selectedWallCount={selectedIds.length}
          onSaveFloorplan={saveFloorPlan}
          selectedShape={selectedShape}
          onSetTableNumber={setTableNumber}
          onUpdateShape={updateShape}
        />
      </div>
    </div>
  );
}