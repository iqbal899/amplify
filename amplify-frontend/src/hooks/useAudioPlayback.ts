import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '@/store/audioStore';
import type { Track } from '@/types';
import { createAudioPlayer } from 'expo-audio';

export function useAudioPlayback() {
  const { currentTrack, isPlaying, progress, duration, play, pause, stop, setProgress, setDuration } = useAudioStore();
  const soundRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);

  const stopTrack = useCallback(() => {
    if (soundRef.current) {
      try {
        soundRef.current.pause();
        soundRef.current.release();
      } catch (e) {
        console.error('Error stopping track:', e);
      }
      soundRef.current = null;
    }
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.remove();
      } catch (e) {
        console.error('Error removing subscription:', e);
      }
      subscriptionRef.current = null;
    }
    stop();
  }, [stop]);

  const playTrack = useCallback(async (track: Track) => {
    // Stop any currently playing track
    if (soundRef.current) {
      try {
        soundRef.current.pause();
        soundRef.current.release();
      } catch (e) {
        console.error('Error cleaning up previous track:', e);
      }
      soundRef.current = null;
    }
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.remove();
      } catch (e) {
        console.error('Error removing previous subscription:', e);
      }
      subscriptionRef.current = null;
    }

    if (!track.previewUrl) {
      play(track);
      return;
    }

    try {
      const player = createAudioPlayer(track.previewUrl);
      soundRef.current = player;
      play(track);

      // Subscribe to playback status updates
      subscriptionRef.current = player.addListener('playbackStatusUpdate', (status) => {
        if (status.duration) {
          setDuration(status.duration);
        }
        if (status.currentTime && status.duration) {
          setProgress(status.currentTime / status.duration);
        }
        if (status.didJustFinish) {
          stopTrack();
        }
      });

      player.play();
    } catch (error) {
      console.error('Error playing track with expo-audio:', error);
      play(track);
    }
  }, [play, stopTrack, setProgress, setDuration]);

  const pauseTrack = useCallback(() => {
    if (soundRef.current) {
      try {
        soundRef.current.pause();
      } catch (e) {
        console.error('Error pausing track:', e);
      }
    }
    pause();
  }, [pause]);

  const resumeTrack = useCallback(() => {
    if (soundRef.current && currentTrack) {
      try {
        soundRef.current.play();
      } catch (e) {
        console.error('Error resuming track:', e);
      }
      play(currentTrack);
    }
  }, [currentTrack, play]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        try {
          soundRef.current.pause();
          soundRef.current.release();
        } catch {
          // Ignore errors during unmount cleanup
        }
        soundRef.current = null;
      }
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.remove();
        } catch {
          // Ignore errors during unmount cleanup
        }
        subscriptionRef.current = null;
      }
    };
  }, []);

  return {
    currentTrack,
    isPlaying,
    progress,
    duration,
    playTrack,
    pauseTrack,
    stopTrack,
    resumeTrack,
  };
}
