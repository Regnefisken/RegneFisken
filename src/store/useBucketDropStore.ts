import { create } from 'zustand';
import type { RollCatchResult } from '../types/fish.js';

interface BucketDropState {
  seq: number;
  queue: RollCatchResult[];
  /** Bumpes så `BucketCatchFish` fjerner alle 3D-fisk i spanden (brandmand e.l.). */
  clearVisualSeq: number;
  enqueue: (fish: RollCatchResult) => void;
  clearQueue: () => void;
  drainQueue: () => RollCatchResult[];
  clearAllBucketVisuals: () => void;
}

export const useBucketDropStore = create<BucketDropState>((set, get) => ({
  seq: 0,
  queue: [],
  clearVisualSeq: 0,
  enqueue: (fish) =>
    set((s) => ({
      queue: [...s.queue, fish],
      seq: s.seq + 1,
    })),
  clearQueue: () => set((s) => ({ queue: [], seq: s.seq + 1 })),
  drainQueue: () => {
    const q = get().queue;
    set({ queue: [] });
    return q;
  },
  clearAllBucketVisuals: () => set((s) => ({ clearVisualSeq: s.clearVisualSeq + 1 })),
}));
