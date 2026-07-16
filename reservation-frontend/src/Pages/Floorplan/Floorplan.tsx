import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useRestaurants } from "../../hooks/useRestaurants";
import { useFloorplan } from "../../hooks/useFloorplan";
import { FloorplanService, tablesToShapes } from "../../services/floorplanService";
import { FloorplanCanvas, type Viewport } from "../../Components/Floorplan/FloorplanCanvas/FloorplanCanvas";
import { EditorTopBar } from "../../Components/Floorplan/EditorTopBar/EditorTopBar";
import { AddPanel } from "../../Components/Floorplan/AddPanel/AddPanel";
import { PropertiesPanel } from "../../Components/Floorplan/PropertiesPanel/PropertiesPanel";
import { apiErrorMessage } from "../../utils/apiError";
import style from "./Floorplan.module.css";

interface Notice {
  kind: "success" | "warning";
  text: string;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

export function Floorplan() {
  const { restaurants, refresh: refreshRestaurants } = useRestaurants();
  const [searchParams] = useSearchParams();

  const rooms = useMemo(
    () => restaurants.flatMap((r) => r.rooms.map((room) => ({ ...room, restaurantName: r.name }))),
    [restaurants]
  );

  const [selectedRoomId, setSelectedRoomId] = useState<string>(searchParams.get("roomId") ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, x: 0, y: 0 });
  // Bumped after a successful save to re-seed the editor from the refreshed cache
  // (picks up server-assigned table numbers).
  const [seedVersion, setSeedVersion] = useState(0);

  const {
    shapes,
    selectedIds,
    dirty,
    canUndo,
    canRedo,
    seed,
    select,
    selectMany,
    addTable,
    addWall,
    addRoomOutline,
    addDoor,
    addWindow,
    updateShape,
    previewShape,
    commitPreview,
    batchUpdateShapes,
    duplicateSelected,
    deleteSelected,
    moveSelected,
    undo,
    redo,
  } = useFloorplan();

  const room = rooms.find((r) => r.id === selectedRoomId);
  const roomRef = useRef(room);
  roomRef.current = room;
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rooms.length && !selectedRoomId) setSelectedRoomId(rooms[0].id);
  }, [rooms, selectedRoomId]);

  // Seed the editor when the room changes or after a save — deliberately NOT on every
  // cache refresh, so a background revalidation can't wipe in-progress edits.
  useEffect(() => {
    const current = roomRef.current;
    seed(current?.floorPlan ? tablesToShapes(current.floorPlan.shapes) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, seedVersion, seed]);

  // Warn on tab close / refresh while there are unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Keyboard shortcuts (skipped while typing in a field).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return;

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && key === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (e.key === "Escape") {
        select(null);
        return;
      }
      const step = e.shiftKey ? 50 : 10;
      if (e.key === "ArrowUp") { e.preventDefault(); moveSelected(0, -step); }
      else if (e.key === "ArrowDown") { e.preventDefault(); moveSelected(0, step); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); moveSelected(-step, 0); }
      else if (e.key === "ArrowRight") { e.preventDefault(); moveSelected(step, 0); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, duplicateSelected, deleteSelected, moveSelected, select]);

  function handleRoomChange(id: string) {
    if (id === selectedRoomId) return;
    if (dirty && !window.confirm("You have unsaved floorplan changes. Discard them and switch rooms?")) return;
    setSelectedRoomId(id);
    setNotice(null);
    setViewport({ scale: 1, x: 0, y: 0 });
  }

  // --- Zoom controls ---

  const zoomAt = (factor: number) => {
    const rect = canvasAreaRef.current?.getBoundingClientRect();
    const cx = (rect?.width ?? 800) / 2;
    const cy = (rect?.height ?? 600) / 2;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, viewport.scale * factor));
    setViewport({
      scale: newScale,
      x: cx - ((cx - viewport.x) / viewport.scale) * newScale,
      y: cy - ((cy - viewport.y) / viewport.scale) * newScale,
    });
  };

  const zoomToFit = () => {
    if (shapes.length === 0) {
      setViewport({ scale: 1, x: 0, y: 0 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of shapes) {
      if (s.type === "room-outline") {
        for (let i = 0; i < s.points.length; i += 2) {
          minX = Math.min(minX, s.points[i]);
          maxX = Math.max(maxX, s.points[i]);
          minY = Math.min(minY, s.points[i + 1]);
          maxY = Math.max(maxY, s.points[i + 1]);
        }
      } else if (s.type === "circle-table") {
        minX = Math.min(minX, s.x - s.radius);
        maxX = Math.max(maxX, s.x + s.radius);
        minY = Math.min(minY, s.y - s.radius);
        maxY = Math.max(maxY, s.y + s.radius);
      } else {
        const w = "width" in s ? s.width : 0;
        const h = s.type === "rect-table" ? s.height : 10;
        minX = Math.min(minX, s.x);
        maxX = Math.max(maxX, s.x + w);
        minY = Math.min(minY, s.y - h);
        maxY = Math.max(maxY, s.y + h);
      }
    }
    const pad = 60;
    const rect = canvasAreaRef.current?.getBoundingClientRect();
    const cw = rect?.width ?? 800;
    const ch = rect?.height ?? 600;
    const scale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, Math.min(cw / (maxX - minX + pad * 2), ch / (maxY - minY + pad * 2)))
    );
    setViewport({
      scale,
      x: cw / 2 - ((minX + maxX) / 2) * scale,
      y: ch / 2 - ((minY + maxY) / 2) * scale,
    });
  };

  // --- Save ---

  async function handleSave() {
    if (!selectedRoomId) return;
    setSaving(true);
    setNotice(null);
    try {
      const result = await FloorplanService.saveFloorplan(shapes, selectedRoomId);
      // Pull the canonical result (server-assigned table numbers) back into the editor.
      await refreshRestaurants();
      setSeedVersion((v) => v + 1);
      const unassigned = result.unassignedReservationCount;
      setNotice(
        unassigned > 0
          ? {
              kind: "warning",
              text: `Floorplan saved. ${unassigned} reservation${unassigned === 1 ? " was" : "s were"} unassigned because ${unassigned === 1 ? "its" : "their"} table was removed — find ${unassigned === 1 ? "it" : "them"} under 'Unassigned' in the Reservations tab.`,
            }
          : { kind: "success", text: "Floorplan saved." }
      );
    } catch (err) {
      setNotice({ kind: "warning", text: apiErrorMessage(err, "Could not save the floorplan. Please try again.") });
    } finally {
      setSaving(false);
    }
  }

  const hasOutline = shapes.some((s) => s.type === "room-outline");

  return (
    <div className={style.wrapper}>
      <EditorTopBar
        rooms={rooms.map((r) => ({ id: r.id, name: r.name, restaurantName: r.restaurantName }))}
        selectedRoomId={selectedRoomId}
        onRoomChange={handleRoomChange}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={viewport.scale}
        onZoomIn={() => zoomAt(1.25)}
        onZoomOut={() => zoomAt(0.8)}
        onZoomFit={zoomToFit}
        onZoomReset={() => setViewport({ scale: 1, x: 0, y: 0 })}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
      />

      {notice && (
        <div className={notice.kind === "success" ? style.noticeSuccess : style.noticeWarning} role="status">
          <span>{notice.text}</span>
          <button className={style.noticeClose} onClick={() => setNotice(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className={style.emptyState}>
          <p className={style.emptyTitle}>No rooms to design yet</p>
          <p className={style.emptyBody}>
            Create a restaurant with at least one room first, then draw its floorplan here.
          </p>
          <Link className={style.emptyLink} to="/restaurants">Go to Restaurants</Link>
        </div>
      ) : (
        <div className={style.body}>
          <AddPanel
            onAddTable={addTable}
            onAddRoomOutline={addRoomOutline}
            onAddWall={addWall}
            onAddDoor={addDoor}
            onAddWindow={addWindow}
            hasOutline={hasOutline}
          />

          <div className={style.canvasArea} ref={canvasAreaRef}>
            <FloorplanCanvas
              shapes={shapes}
              selectedIds={selectedIds}
              viewport={viewport}
              onViewportChange={setViewport}
              onSelect={select}
              onSelectMany={selectMany}
              onUpdate={updateShape}
              onBatchUpdate={batchUpdateShapes}
              onPreview={previewShape}
              onCommitPreview={commitPreview}
            />
          </div>

          <PropertiesPanel
            shapes={shapes}
            selectedIds={selectedIds}
            onUpdateShape={updateShape}
            onBatchUpdate={batchUpdateShapes}
            onDuplicateSelected={duplicateSelected}
            onDeleteSelected={deleteSelected}
          />
        </div>
      )}
    </div>
  );
}
