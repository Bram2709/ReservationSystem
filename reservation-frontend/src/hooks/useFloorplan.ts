import { useState } from "react";
import type { FloorShape } from "../types/shapes";
import { FloorplanService } from "../services/floorplanService";

export function useFloorplan() {
  const [shapes, setShapes] = useState<FloorShape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFloorplan = async (roomId: string) => {
    setIsLoading(true);
    try {
      const loaded = await FloorplanService.getFloorplan(roomId);
      setShapes(loaded);
    } catch {
      setShapes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWallSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const clearMultiSelection = () => setSelectedIds([]);

  const addRectTable = (top: number, right: number, bottom: number, left: number) => {
    setShapes(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "rect-table",
        x: 50,
        y: 50,
        width: 150,
        height: 100,
        rotation: 0,
        chairs: top + right + bottom + left,
        chairsLayout: [top, right, bottom, left] as [number, number, number, number]
      }
    ]);
  };

  const addCircleTable = () => {
    setShapes(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "circle-table",
        x: 150,
        y: 150,
        radius: 50,
        rotation: 0,
        chairs: 6
      }
    ]);
  };

  const addWall = () => {
    setShapes(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "wall",
        x: 100,
        y: 200,
        width: 200,
        rotation: 0
      }
    ]);
  };

  const createRoom = (wallIds: string[], label?: string) => {
    setShapes(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "room",
        wallIds,
        x: 0,
        y: 0,
        rotation: 0,
        label: label || `Room ${prev.filter(s => s.type === "room").length + 1}`
      }
    ]);
    setSelectedIds([]);
    setSelectedId(null);
  };

  const updateShape = (id: string, updates: Partial<FloorShape>) => {
    setShapes(prev => prev.map(s => (s.id === id ? { ...s, ...updates } as FloorShape : s)));
  };

  const removeShape = (id: string) => {
    setShapes(prev => prev.filter(s => s.id !== id));
    setSelectedId(cur => (cur === id ? null : cur));
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  /** Update table number locally and persist via PATCH. */
  const setTableNumber = async (id: string, tableNumber: number) => {
    updateShape(id, { tableNumber });
    try {
      await FloorplanService.patchShape(id, { tableNumber } as Partial<FloorShape>);
    } catch {
      // optimistic update stays in place; user can re-save via full save
    }
  };

  // Apply multiple updates in a single state tick (used for room drag)
  const batchUpdateShapes = (updates: { id: string; updates: Partial<FloorShape> }[]) => {
    setShapes(prev => {
      const map = new Map(updates.map(u => [u.id, u.updates]));
      return prev.map(s => map.has(s.id) ? { ...s, ...map.get(s.id) } as FloorShape : s);
    });
  };

  return {
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
    clearMultiSelection,
    createRoom
  };
}