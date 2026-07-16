import { useCallback, useRef, useState } from "react";
import type { FloorShape, RoomOutlineShape } from "../types/shapes";
import { isTableShape } from "../types/shapes";
import type { TablePreset } from "../Components/Floorplan/presets";

const HISTORY_LIMIT = 50;

/** Default room boundary for a fresh outline: a generous rectangle. */
const DEFAULT_OUTLINE_POINTS = [40, 40, 840, 40, 840, 560, 40, 560];

/**
 * Editor state for one room's floorplan: shapes, selection, dirty flag, and an
 * undo/redo history. History snapshots are taken on *finalized* changes (add,
 * delete, drag-end, property edit) — never on intermediate drag frames.
 */
export function useFloorplan() {
    const [shapes, setShapesState] = useState<FloorShape[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [dirty, setDirty] = useState(false);
    // Bumped whenever the history stacks change so canUndo/canRedo re-render.
    const [, setHistoryVersion] = useState(0);

    // Mutations read from this ref (not the state variable) so handlers never see a
    // stale closure; history pushes stay outside setState updaters, which React
    // StrictMode double-invokes.
    const shapesRef = useRef<FloorShape[]>([]);
    const undoStack = useRef<FloorShape[][]>([]);
    const redoStack = useRef<FloorShape[][]>([]);

    const setShapes = (next: FloorShape[]) => {
        shapesRef.current = next;
        setShapesState(next);
    };

    /** Apply a finalized change: snapshot the old state for undo, mark dirty. */
    const commit = useCallback((next: FloorShape[]) => {
        undoStack.current.push(shapesRef.current);
        if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
        redoStack.current = [];
        setShapes(next);
        setDirty(true);
        setHistoryVersion((v) => v + 1);
    }, []);

    /** Replace everything from persisted data: new room selected, or fresh save result. */
    const seed = useCallback((initial: FloorShape[]) => {
        undoStack.current = [];
        redoStack.current = [];
        setShapes(initial);
        setSelectedIds([]);
        setDirty(false);
        setHistoryVersion((v) => v + 1);
    }, []);

    // --- Selection ---

    const select = useCallback((id: string | null, additive = false) => {
        if (id === null) {
            setSelectedIds([]);
            return;
        }
        setSelectedIds((prev) => {
            if (!additive) return [id];
            return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        });
    }, []);

    const selectMany = useCallback((ids: string[]) => {
        setSelectedIds(ids);
    }, []);

    // --- Adding shapes ---

    /** Stagger spawn positions so consecutive adds don't stack on one spot. */
    const spawnPoint = () => {
        const n = shapesRef.current.length % 6;
        return { x: 120 + n * 40, y: 120 + n * 40 };
    };

    const addTable = useCallback((preset: TablePreset) => {
        const { x, y } = spawnPoint();
        const base = { id: crypto.randomUUID(), x, y, rotation: 0, tableNumber: 0 };

        const shape: FloorShape =
            preset.kind === "circle"
                ? {
                    ...base,
                    type: "circle-table",
                    radius: preset.radius ?? 45,
                    chairs: preset.chairs ?? preset.maxSeats,
                    minSeats: preset.minSeats,
                    maxSeats: preset.maxSeats,
                }
                : {
                    ...base,
                    type: "rect-table",
                    width: preset.width ?? 150,
                    height: preset.height ?? 100,
                    chairsLayout: preset.chairsLayout ?? [2, 0, 2, 0],
                    chairs: (preset.chairsLayout ?? [2, 0, 2, 0]).reduce((a, b) => a + b, 0),
                    minSeats: preset.minSeats,
                    maxSeats: preset.maxSeats,
                };

        commit([...shapesRef.current, shape]);
        setSelectedIds([shape.id]);
    }, [commit]);

    const addWall = useCallback(() => {
        const { x, y } = spawnPoint();
        const shape: FloorShape = { id: crypto.randomUUID(), type: "wall", x, y, width: 200, rotation: 0 };
        commit([...shapesRef.current, shape]);
        setSelectedIds([shape.id]);
    }, [commit]);

    /** One boundary per room: if an outline already exists, select it instead. */
    const addRoomOutline = useCallback(() => {
        const existing = shapesRef.current.find((s) => s.type === "room-outline");
        if (existing) {
            setSelectedIds([existing.id]);
            return;
        }
        const shape: RoomOutlineShape = {
            id: crypto.randomUUID(),
            type: "room-outline",
            x: 0,
            y: 0,
            rotation: 0,
            points: [...DEFAULT_OUTLINE_POINTS],
        };
        commit([...shapesRef.current, shape]);
        setSelectedIds([shape.id]);
    }, [commit]);

    const addDoor = useCallback(() => {
        const { x, y } = spawnPoint();
        const shape: FloorShape = { id: crypto.randomUUID(), type: "door", x, y, width: 60, rotation: 0 };
        commit([...shapesRef.current, shape]);
        setSelectedIds([shape.id]);
    }, [commit]);

    const addWindow = useCallback(() => {
        const { x, y } = spawnPoint();
        const shape: FloorShape = { id: crypto.randomUUID(), type: "window", x, y, width: 80, rotation: 0 };
        commit([...shapesRef.current, shape]);
        setSelectedIds([shape.id]);
    }, [commit]);

    // --- Editing ---

    const updateShape = useCallback((id: string, updates: Partial<FloorShape>) => {
        commit(shapesRef.current.map((s) => (s.id === id ? ({ ...s, ...updates } as FloorShape) : s)));
    }, [commit]);

    // Live preview while a corner handle drags: state updates every frame, but only
    // one history entry (the pre-drag snapshot) lands when the drag finishes.
    const transientBase = useRef<FloorShape[] | null>(null);

    const previewShape = useCallback((id: string, updates: Partial<FloorShape>) => {
        if (!transientBase.current) transientBase.current = shapesRef.current;
        setShapes(shapesRef.current.map((s) => (s.id === id ? ({ ...s, ...updates } as FloorShape) : s)));
    }, []);

    const commitPreview = useCallback(() => {
        if (!transientBase.current) return;
        undoStack.current.push(transientBase.current);
        if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
        redoStack.current = [];
        transientBase.current = null;
        setDirty(true);
        setHistoryVersion((v) => v + 1);
    }, []);

    /** One history entry for a group of related updates (e.g. multi-drag end). */
    const batchUpdateShapes = useCallback((updates: { id: string; updates: Partial<FloorShape> }[]) => {
        const map = new Map(updates.map((u) => [u.id, u.updates]));
        commit(shapesRef.current.map((s) => (map.has(s.id) ? ({ ...s, ...map.get(s.id) } as FloorShape) : s)));
    }, [commit]);

    const duplicateSelected = useCallback(() => {
        const clones: FloorShape[] = [];
        for (const s of shapesRef.current) {
            // The room boundary is one-per-room; everything else clones freely.
            if (!selectedIds.includes(s.id) || s.type === "room-outline") continue;
            const clone = { ...s, id: crypto.randomUUID(), x: s.x + 30, y: s.y + 30 } as FloorShape;
            if (isTableShape(clone)) clone.tableNumber = 0; // server assigns the next free number
            clones.push(clone);
        }
        if (clones.length === 0) return;
        commit([...shapesRef.current, ...clones]);
        setSelectedIds(clones.map((c) => c.id));
    }, [commit, selectedIds]);

    const deleteSelected = useCallback(() => {
        if (selectedIds.length === 0) return;
        commit(shapesRef.current.filter((s) => !selectedIds.includes(s.id)));
        setSelectedIds([]);
    }, [commit, selectedIds]);

    /** Arrow-key nudge. Room outlines translate their polygon instead of x/y. */
    const moveSelected = useCallback((dx: number, dy: number) => {
        if (selectedIds.length === 0) return;
        commit(shapesRef.current.map((s) => {
            if (!selectedIds.includes(s.id)) return s;
            if (s.type === "room-outline") {
                return { ...s, points: s.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy)) };
            }
            return { ...s, x: s.x + dx, y: s.y + dy } as FloorShape;
        }));
    }, [commit, selectedIds]);

    // --- History ---

    const undo = useCallback(() => {
        const prev = undoStack.current.pop();
        if (!prev) return;
        redoStack.current.push(shapesRef.current);
        setShapes(prev);
        setSelectedIds([]);
        setDirty(true);
        setHistoryVersion((v) => v + 1);
    }, []);

    const redo = useCallback(() => {
        const next = redoStack.current.pop();
        if (!next) return;
        undoStack.current.push(shapesRef.current);
        setShapes(next);
        setSelectedIds([]);
        setDirty(true);
        setHistoryVersion((v) => v + 1);
    }, []);

    return {
        shapes,
        selectedIds,
        dirty,
        canUndo: undoStack.current.length > 0,
        canRedo: redoStack.current.length > 0,
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
    };
}
