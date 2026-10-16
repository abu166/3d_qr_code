import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
export function AudioToggle() {
  const audio = useRef<AudioContext | null>(null),
    [enabled, setEnabled] = useState(false);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  async function toggle() {
    if (audio.current) {
      await audio.current.close();
      audio.current = null;
      setEnabled(false);
      return;
    }
    try {
      const ctx = new AudioContext(),
        buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate),
        data = buffer.getChannelData(0);
      let previous = 0;
      for (let i = 0; i < data.length; i++) {
        previous = (previous + Math.random() * 0.04 - 0.02) / 1.02;
        data[i] = previous * 3;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 420;
      const gain = ctx.createGain();
      gain.gain.value = 0.18;
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      audio.current = ctx;
      setEnabled(true);
    } catch {
      setEnabled(false);
    }
  }
  return (
    <button
      className={enabled ? "enabled" : ""}
      aria-label="Toggle ambient audio"
      aria-pressed={enabled}
      title="Ambient woodland hush"
      onClick={() => void toggle()}
    >
      {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  );
}
