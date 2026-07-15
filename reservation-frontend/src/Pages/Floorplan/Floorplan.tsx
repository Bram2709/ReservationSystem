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
    removeShape,
    setTableNumber,
    batchUpdateShapes,
    selectedId,
    setSelectedId,
    selectedIds,
    toggleWallSelection,
    createRoom
  } = useFloorplan();

  const { restaurants, refresh: refreshRestaurants } = useRestaurants();

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

  // Delete/Backspace removes the selected shape — but not while typing in a field.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (typing || !selectedId) return;
      e.preventDefault();
      removeShape(selectedId);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId, removeShape]);

  const [saveNotice, setSaveNotice] = useState<{ kind: "success" | "warning"; text: string } | null>(null);

  function handleRoomChange(id: string) {
    setSelectedRoomId(id);
    setSaveNotice(null);
  }

  async function saveFloorPlan() {
    if (!selectedRoomId) return;
    try {
      const result = await FloorplanService.saveFloorplan(shapes, selectedRoomId);
      // Tables changed — refresh the shared cache so Floor view and room counts stay accurate.
      void refreshRestaurants();
      const unassigned = result.unassignedReservationCount;
      setSaveNotice(
        unassigned > 0
          ? {
              kind: "warning",
              text: `Floorplan saved. ${unassigned} reservation${unassigned === 1 ? " was" : "s were"} unassigned because ${unassigned === 1 ? "its" : "their"} table was removed — find ${unassigned === 1 ? "it" : "them"} under 'Unassigned' in the Reservations tab.`,
            }
          : { kind: "success", text: "Floorplan saved." }
      );
    } catch {
      setSaveNotice({ kind: "warning", text: "Could not save the floorplan. Please try again." });
    }
  }

  return (
    <div className={style.wrapper}>
      <div className={style.leftSide}>
        <h1>Restaurant Floorplan Editor</h1>

        {saveNotice && (
          <div
            className={saveNotice.kind === "success" ? style.noticeSuccess : style.noticeWarning}
            role="status"
          >
            <span>{saveNotice.text}</span>
            <button className={style.noticeClose} onClick={() => setSaveNotice(null)} aria-label="Dismiss">×</button>
          </div>
        )}

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
          onDeleteShape={removeShape}
        />
      </div>
    </div>
  );
}