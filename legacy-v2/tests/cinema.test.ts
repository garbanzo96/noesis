import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import type { WorldId } from '../src/domain/types';
import { Cinema } from '../src/components/scene/Cinema';

let root: Root;
let paused: WeakMap<HTMLMediaElement, boolean>;
let times: WeakMap<HTMLMediaElement, number>;
let durations: WeakMap<HTMLMediaElement, number>;
let playCount: number;
let rejectSeek: boolean;
let playPromise: (() => Promise<void>) | null;

const video = () => document.querySelector('video')!;
const caption = () => document.querySelector('.cinema-caption')!;
const button = (text: string) =>
  [...document.querySelectorAll('button')].find((item) => item.textContent === text)!;
const draw = (world: WorldId = 'foundations', reducedMotion = false) =>
  act(async () => {
    root.render(createElement(StrictMode, null, createElement(Cinema, { world, reducedMotion })));
  });
const click = (item: HTMLElement) =>
  act(async () => {
    item.click();
  });
const tick = (at: number) =>
  act(async () => {
    video().currentTime = at;
    video().dispatchEvent(new Event('timeupdate'));
  });
const metadata = (duration: number) =>
  act(async () => {
    durations.set(video(), duration);
    video().dispatchEvent(new Event('loadedmetadata'));
  });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // Media time is advanced explicitly, so the checks are deterministic.
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  paused = new WeakMap();
  times = new WeakMap();
  durations = new WeakMap();
  playCount = 0;
  rejectSeek = false;
  playPromise = null;
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    return paused.get(this) ?? true;
  });
  vi.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    return durations.get(this) ?? NaN;
  });
  vi.spyOn(HTMLMediaElement.prototype, 'currentTime', 'get').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    return times.get(this) ?? 0;
  });
  vi.spyOn(HTMLMediaElement.prototype, 'currentTime', 'set').mockImplementation(function (
    this: HTMLMediaElement,
    time: number,
  ) {
    if (rejectSeek) throw new DOMException('Metadata pending', 'InvalidStateError');
    times.set(this, time);
  });
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    times.set(this, 0);
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    playCount++;
    paused.set(this, false);
    this.dispatchEvent(new Event('play'));
    return playPromise?.() ?? Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    paused.set(this, true);
    this.dispatchEvent(new Event('pause'));
  });
  document.body.innerHTML = '<div id="cinema-root"></div>';
  root = createRoot(document.getElementById('cinema-root')!);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('Cinema guided playback', () => {
  it('starts with sets, reads for 3 seconds, then pauses each finished segment with its matching caption', async () => {
    await draw();
    expect(video().src).toContain('setsCartesian.mp4');
    expect(button('Pausar entre pasos').getAttribute('aria-pressed')).toBe('true');
    expect(playCount).toBe(0);
    expect(vi.getTimerCount()).toBe(1); // StrictMode cancels the first mount's timer.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2999);
    });
    expect(playCount).toBe(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(playCount).toBe(1);
    expect(video().muted).toBe(true);

    await tick(3.2);
    expect(video().paused).toBe(true);
    expect(video().currentTime).toBeCloseTo(3 - 1 / 30, 8);
    expect(caption().textContent).toContain('Dos conjuntos');
    await click(button('Continuar secuencia'));
    expect(video().currentTime).toBe(3);
    await tick(7.2);
    expect(video().paused).toBe(true);
    expect(caption().textContent).toContain('Todas las combinaciones');
    await click(button('Continuar secuencia'));
    expect(video().currentTime).toBe(7);
    await tick(12.2);
    expect(video().currentTime).toBe(12);
    expect(video().paused).toBe(true);
    expect(caption().textContent).toContain('Pares ordenados');
    expect(button('Secuencia completada').disabled).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(playCount).toBe(3); // There is no automatic loop or resumption.
  });

  it('can turn guided pauses off and on without restarting the video', async () => {
    await draw();
    await click(button('Continuar secuencia'));
    expect(vi.getTimerCount()).toBe(0); // Manual play cancels the intro delay.
    await click(button('Pausar entre pasos'));
    expect(button('Pausar entre pasos').getAttribute('aria-pressed')).toBe('false');
    await tick(4);
    expect(video().paused).toBe(false);
    expect(caption().textContent).toContain('Todas las combinaciones');
    await click(button('Pausar entre pasos'));
    await tick(7.1);
    expect(video().paused).toBe(true);
    expect(video().currentTime).toBeCloseTo(7 - 1 / 30, 8);
  });

  it('respects reduced motion while allowing explicit stage seeking, frame stepping and playback', async () => {
    await draw('foundations', true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(playCount).toBe(0);
    await click(document.querySelectorAll<HTMLButtonElement>('.cinema-timeline button')[1]);
    expect(video().currentTime).toBe(3);
    expect(caption().textContent).toContain('Todas las combinaciones');
    await click(document.querySelector<HTMLButtonElement>('[aria-label="Avanzar un fotograma"]')!);
    expect(video().currentTime).toBeCloseTo(3 + 1 / 30, 8);
    expect(video().paused).toBe(true);
    await click(button('Continuar secuencia'));
    expect(playCount).toBe(1);
  });

  it('unloads previous sources on selector/world changes and ignores stale play rejections', async () => {
    await draw('foundations', true);
    const sets = video();
    const select = document.querySelector<HTMLSelectElement>('.cinema-selector select')!;
    await act(async () => {
      select.value = 'functionComposition';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(sets.getAttribute('src')).toBeNull();
    expect(sets.paused).toBe(true);
    expect(video().src).toContain('functionComposition.mp4');
    let rejectPlay!: (reason: Error) => void;
    playPromise = () =>
      new Promise<void>((_resolve, reject) => {
        rejectPlay = reject;
      });
    await click(button('Continuar secuencia'));
    const composition = video();
    await draw('differential', true);
    expect(composition.getAttribute('src')).toBeNull();
    expect(composition.paused).toBe(true);
    expect(video().src).toContain('derivativeSecantToTangent.mp4');
    expect(caption().textContent).toContain('Una curva');
    await act(async () => {
      rejectPlay(new Error('Obsolete source request'));
    });
    expect(document.body.textContent).not.toContain('Presiona Reproducir');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retains a pending seek and uses only finite positive media durations', async () => {
    await draw('differential', true);
    expect(document.querySelector<HTMLInputElement>('input[type="range"]')!.max).toBe('13');
    rejectSeek = true;
    await click(document.querySelectorAll<HTMLButtonElement>('.cinema-timeline button')[3]);
    expect(caption().textContent).toContain('La pendiente local');
    expect(video().currentTime).toBe(0);
    rejectSeek = false;
    await metadata(10);
    expect(video().currentTime).toBe(7);
    expect(document.querySelector<HTMLInputElement>('input[type="range"]')!.max).toBe('10');
    for (const invalid of [Infinity, NaN, 0, -1]) {
      await metadata(invalid);
      expect(document.querySelector<HTMLInputElement>('input[type="range"]')!.max).toBe('10');
    }
    await act(async () => {
      document
        .querySelector('section')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    });
    expect(video().currentTime).toBe(10);
  });

  it('keeps captions and formulas visible on media errors and safely retries', async () => {
    await draw('differential', true);
    await act(async () => {
      video().dispatchEvent(new Event('error'));
    });
    expect(document.querySelector('[role="alert"]')!.textContent).toContain('No se pudo cargar');
    expect(caption().textContent).toContain('Una curva');
    expect(caption().querySelector('.math')).not.toBeNull();
    expect(caption().querySelector('.cinema-formula-text')!.textContent).toContain(
      'Fórmula en texto:',
    );
    await click(button('Reintentar'));
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(video().currentTime).toBe(0);
    expect(playCount).toBe(0);
  });
});
