'use client';
import { useCallback } from 'react';

export function useSound() {
  const getCtx = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      return new AudioContext();
    } catch {
      return null;
    }
  };

  const playTone = (ctx: AudioContext, type: OscillatorType, freq: number, startTime: number, duration: number, vol: number = 0.1, freqEnd?: number) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
    }
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(vol, startTime + (duration * 0.1));
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const playPop = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 'sine', 400, ctx.currentTime, 0.1, 0.2, 800);
  }, []);

  const playClick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 'square', 150, ctx.currentTime, 0.05, 0.1, 40);
  }, []);

  const playSuccess = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 'sine', 523.25, ctx.currentTime, 0.15, 0.2); // C5
    playTone(ctx, 'sine', 659.25, ctx.currentTime + 0.1, 0.4, 0.2); // E5
  }, []);

  const playTick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 'triangle', 800, ctx.currentTime, 0.03, 0.05, 200);
  }, []);

  const playFanfare = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 'square', 440, ctx.currentTime, 0.1, 0.1); // A4
    playTone(ctx, 'square', 554.37, ctx.currentTime + 0.1, 0.1, 0.1); // C#5
    playTone(ctx, 'square', 659.25, ctx.currentTime + 0.2, 0.1, 0.1); // E5
    playTone(ctx, 'square', 880, ctx.currentTime + 0.3, 0.4, 0.1); // A5
  }, []);

  const playNavClick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 'sine', 300, ctx.currentTime, 0.04, 0.05, 200);
  }, []);

  const playPowerUp = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 'square', 300, ctx.currentTime, 0.1, 0.1, 600);
    playTone(ctx, 'square', 400, ctx.currentTime + 0.1, 0.1, 0.1, 800);
    playTone(ctx, 'square', 500, ctx.currentTime + 0.2, 0.4, 0.1, 1000);
  }, []);

  const playTap = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 'sine', 600, ctx.currentTime, 0.02, 0.05, 400);
  }, []);

  const playBlip = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 'sine', 1000, ctx.currentTime, 0.1, 0.1, 1200);
  }, []);

  return { 
    playPop, 
    playClick, 
    playSuccess, 
    playTick, 
    playFanfare, 
    playNavClick, 
    playPowerUp, 
    playTap, 
    playBlip 
  };
}
