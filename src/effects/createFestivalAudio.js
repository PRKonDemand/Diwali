export function createFestivalAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let noiseBuffer = null;

  function unlock() {
    if (!AudioContextClass) return;
    if (!context) {
      context = new AudioContextClass();
      const length = Math.floor(context.sampleRate * 0.45);
      noiseBuffer = context.createBuffer(1, length, context.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    }
    if (context.state === "suspended") context.resume().catch(() => {});
  }

  function playBurst() {
    if (!context || context.state !== "running" || !noiseBuffer) return;
    const now = context.currentTime;
    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3200 + Math.random() * 1800, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + 0.32);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    noise.connect(filter).connect(gain).connect(context.destination);
    noise.start(now);
    noise.stop(now + 0.36);

    const pop = context.createOscillator();
    const popGain = context.createGain();
    pop.type = "sine";
    pop.frequency.setValueAtTime(115 + Math.random() * 65, now);
    pop.frequency.exponentialRampToValueAtTime(42, now + 0.11);
    popGain.gain.setValueAtTime(0.0001, now);
    popGain.gain.exponentialRampToValueAtTime(0.2, now + 0.006);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    pop.connect(popGain).connect(context.destination);
    pop.start(now);
    pop.stop(now + 0.14);
  }

  return { unlock, playBurst };
}
