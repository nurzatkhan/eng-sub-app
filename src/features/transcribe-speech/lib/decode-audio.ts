export const WHISPER_SAMPLE_RATE = 16_000;

/** Decodes the audio track of a media file into 16 kHz mono PCM, as Whisper expects. */
export async function decodeAudio(file: File): Promise<Float32Array> {
  const buffer = await file.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE });
  try {
    const audio = await ctx.decodeAudioData(buffer);
    if (audio.numberOfChannels === 1) return audio.getChannelData(0);

    const left = audio.getChannelData(0);
    const right = audio.getChannelData(1);
    const mono = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) mono[i] = (left[i] + right[i]) / 2;
    return mono;
  } finally {
    void ctx.close();
  }
}
