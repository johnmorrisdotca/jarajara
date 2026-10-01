import { describe, expect, it } from "vitest";

import { TILE_SOUND_DATA } from "../sounds.ts";
import { TILE_SOUND_KINDS, MOST_SOUNDS_AT_ONCE, createTileSounds, soundTimes, type TileSoundData } from "./tileSounds.ts";

/** Enough of the Web Audio API to see what a table asks of it. */
function fakeAudio(options: { state?: string; decodeFails?: boolean; resumeFails?: boolean } = {}) {
  const log = { contexts: 0, decoded: 0, started: [] as { at: number; seconds: number }[], filters: 0, closed: 0, gain: [] as number[] };
  class FakeContext {
    state = options.state ?? "running";
    currentTime = 10;
    sampleRate = 44100;
    destination = {};
    constructor() {
      log.contexts += 1;
    }
    createGain() {
      const node = { gain: { value: 1 }, connect() {} };
      log.gain.push(0);
      return node;
    }
    createBiquadFilter() {
      log.filters += 1;
      return { type: "", frequency: { value: 0 }, Q: { value: 0 }, connect() {} };
    }
    createBuffer(_channels: number, length: number, rate: number) {
      return { duration: length / rate, getChannelData: () => new Float32Array(length) };
    }
    createBufferSource() {
      const source = {
        buffer: null as { duration: number } | null,
        playbackRate: { value: 1 },
        connect() {},
        start(at: number) {
          log.started.push({ at, seconds: source.buffer?.duration ?? 0 });
        },
      };
      return source;
    }
    decodeAudioData(data: ArrayBuffer) {
      log.decoded += 1;
      return options.decodeFails ? Promise.reject(new Error("cannot decode")) : Promise.resolve({ duration: data.byteLength / 10000 });
    }
    resume() {
      if (options.resumeFails) return Promise.reject(new Error("not allowed"));
      this.state = "running";
      return Promise.resolve();
    }
    close() {
      log.closed += 1;
      return Promise.resolve();
    }
  }
  return { log, window: { AudioContext: FakeContext as unknown as typeof AudioContext, atob } };
}

const settle = () => new Promise((done) => setTimeout(done, 5));
const recordings = async () => ({ TILE_SOUND_DATA: TILE_SOUND_DATA as TileSoundData });

describe("the tile sounds", () => {
  it("are silence, and no error, where there is no audio at all", async () => {
    expect(() => createTileSounds({ window: null }).play("place")).not.toThrow();
    expect(() => createTileSounds({ window: {} }).play("shuffle")).not.toThrow();
    expect(await createTileSounds({ window: null }).load()).toBe(false);
    expect(() => createTileSounds({ window: null }).close()).not.toThrow();
  });

  it("are silence, and no error, where a context cannot be made", () => {
    class Refuses {
      constructor() {
        throw new Error("no audio device");
      }
    }
    expect(() => createTileSounds({ window: { AudioContext: Refuses as unknown as typeof AudioContext } }).play("pick")).not.toThrow();
  });

  it("play one recording of the kind asked for", async () => {
    const { log, window } = fakeAudio();
    createTileSounds({ window, load: recordings }).play("pick");
    await settle();
    expect(log.decoded).toBe(Object.keys(TILE_SOUND_DATA).length);
    expect(log.started).toHaveLength(1);
    expect(log.started[0]?.at).toBe(10);
    expect(log.filters).toBe(0);
  });

  it("set thirteen tiles down as eight clicks, one after another, from the delay asked for", async () => {
    const { log, window } = fakeAudio();
    createTileSounds({ window, load: recordings }).play("place", { count: 13, gap: 100, delay: 500 });
    await settle();
    expect(log.started).toHaveLength(MOST_SOUNDS_AT_ONCE);
    expect(log.started.map((s) => Number(s.at.toFixed(3)))).toEqual(soundTimes(13, 100).map((ms) => 10.5 + ms / 1000));
  });

  it("space the sounds evenly, at most eight, over the time the tiles take", () => {
    expect(soundTimes(1)).toEqual([0]);
    expect(soundTimes(0)).toEqual([0]);
    expect(soundTimes(3, 100)).toEqual([0, 100, 200]);
    expect(soundTimes(8, 50)).toEqual([0, 50, 100, 150, 200, 250, 300, 350]);
    const thirteen = soundTimes(13, 100);
    expect(thirteen).toHaveLength(8);
    expect(thirteen[0]).toBe(0);
    expect(thirteen[7]).toBe(1200);
    expect(soundTimes(Number.NaN)).toEqual([0]);
  });

  it("have a recording for every kind, and nothing else", () => {
    const kinds = new Set(Object.keys(TILE_SOUND_DATA).map((name) => name.replace(/-\d+$/, "")));
    expect([...kinds].sort()).toEqual([...TILE_SOUND_KINDS].sort());
  });

  it("fetch nothing and make no context until the first sound, and fetch once", async () => {
    let loads = 0;
    const { log, window } = fakeAudio();
    const sounds = createTileSounds({
      window,
      load: async () => {
        loads += 1;
        return { TILE_SOUND_DATA };
      },
    });
    expect([loads, log.contexts]).toEqual([0, 0]);
    sounds.play("flip");
    sounds.play("flip");
    await settle();
    expect([loads, log.contexts]).toEqual([1, 1]);
    expect(log.started).toHaveLength(2);
  });

  it("make no sound while muted, and fetch nothing for it", async () => {
    let loads = 0;
    const { log, window } = fakeAudio();
    const sounds = createTileSounds({
      window,
      muted: true,
      load: async () => {
        loads += 1;
        return { TILE_SOUND_DATA };
      },
    });
    expect(sounds.muted).toBe(true);
    sounds.play("pair");
    await settle();
    expect([loads, log.contexts, log.started.length]).toEqual([0, 0, 0]);
    sounds.setMuted(false);
    sounds.play("pair");
    await settle();
    expect(log.started).toHaveLength(1);
  });

  it("load ahead of time when asked, and say whether they could", async () => {
    const { log, window } = fakeAudio();
    expect(await createTileSounds({ window, load: recordings }).load()).toBe(true);
    expect(log.decoded).toBe(Object.keys(TILE_SOUND_DATA).length);
    expect(await createTileSounds({ window: fakeAudio({ decodeFails: true }).window, load: recordings }).load()).toBe(false);
  });

  it.each([
    ["the recordings cannot be fetched", {}, () => Promise.reject(new Error("offline"))],
    ["the recordings cannot be decoded", { decodeFails: true }, recordings],
    ["the recordings are not audio", {}, async () => ({ TILE_SOUND_DATA: { "pick-1": "%%%" } as TileSoundData })],
  ])("fall back to a sound made in the browser when %s", async (_why, audio, load) => {
    const { log, window } = fakeAudio(audio);
    createTileSounds({ window, load }).play("place", { count: 2 });
    await settle();
    expect(log.started).toHaveLength(2);
    expect(log.filters).toBe(2);
  });

  it("play a shuffle as a wash of clicks and a win as a clatter that climbs", async () => {
    const shuffle = fakeAudio();
    createTileSounds({ window: shuffle.window, load: recordings }).play("shuffle");
    await settle();
    expect(shuffle.log.started.length).toBeGreaterThan(5);
    const win = fakeAudio();
    createTileSounds({ window: win.window, load: recordings }).play("win");
    await settle();
    expect(win.log.started).toHaveLength(6);
  });

  it("keep a volume from 0 to 1", () => {
    const sounds = createTileSounds({ window: null, volume: 3 });
    expect(sounds.volume).toBe(1);
    sounds.volume = -1;
    expect(sounds.volume).toBe(0);
    sounds.volume = 0.25;
    expect(sounds.volume).toBe(0.25);
    expect(createTileSounds({ window: null }).volume).toBe(0.6);
  });

  it("stay silent while the browser holds the context still, and play once it lets go", async () => {
    const held = fakeAudio({ state: "suspended", resumeFails: true });
    createTileSounds({ window: held.window, load: recordings }).play("pick");
    await settle();
    expect(held.log.started).toHaveLength(0);
    const freed = fakeAudio({ state: "suspended" });
    createTileSounds({ window: freed.window, load: recordings }).play("pick");
    await settle();
    expect(freed.log.started).toHaveLength(1);
  });

  it("are quiet after they are closed, and ignore a kind they do not know", async () => {
    const { log, window } = fakeAudio();
    const sounds = createTileSounds({ window, load: recordings });
    sounds.play("pick");
    sounds.play("whistle" as never);
    await settle();
    sounds.close();
    sounds.play("pick");
    await settle();
    expect(log.closed).toBe(1);
    expect(log.started).toHaveLength(1);
  });
});
