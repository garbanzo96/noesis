let audio: AudioContext | undefined;
export function rewardSound() {
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const now = audio.currentTime;
    [523.25, 783.99, 1046.5].forEach((frequency, i) => {
      const oscillator = audio!.createOscillator(),
        gain = audio!.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + i * 0.065);
      gain.gain.linearRampToValueAtTime(0.04, now + i * 0.065 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.16);
      oscillator.connect(gain);
      gain.connect(audio!.destination);
      oscillator.start(now + i * 0.065);
      oscillator.stop(now + i * 0.065 + 0.18);
    });
  } catch {
    /* The game remains usable without browser audio. */
  }
}
