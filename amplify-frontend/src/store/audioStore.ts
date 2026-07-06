import { create } from 'zustand';
import type { Track } from '@/types';

interface AudioState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  play: (track: Track) => void;
  pause: () => void;
  stop: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
}

export const useAudioStore = create<AudioState>()((set) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 30,
  play: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ currentTrack: null, isPlaying: false, progress: 0 }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
}));
