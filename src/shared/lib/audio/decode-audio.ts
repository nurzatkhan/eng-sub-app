export const SPEECH_SAMPLE_RATE = 16_000;

export class AudioDecodeError extends Error {
  constructor(readonly code: "no-audio" | "unsupported") {
    super(
      code === "no-audio"
        ? "В файле нет звуковой дорожки — только картинка. Скачайте вариант видео со звуком."
        : "Браузер не смог прочитать звук из этого файла. Попробуйте .mp4 или .webm.",
    );
  }
}

/**
 * Whether a media file has an audio track. Downloaders often save high-quality video without sound,
 * and decodeAudioData then fails with an unhelpful "Unable to decode audio data".
 */
async function hasAudioTrack(file: File): Promise<boolean | null> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  try {
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("load failed"));
    });
    const capture = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream;
    return capture ? capture.call(video).getAudioTracks().length > 0 : null;
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    URL.revokeObjectURL(url);
  }
}

/** Decodes the audio track of a media file into 16 kHz mono PCM, as speech models expect. */
export async function decodeAudio(file: File): Promise<Float32Array> {
  const buffer = await file.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: SPEECH_SAMPLE_RATE });
  try {
    let audio: AudioBuffer;
    try {
      audio = await ctx.decodeAudioData(buffer);
    } catch {
      throw new AudioDecodeError((await hasAudioTrack(file)) === false ? "no-audio" : "unsupported");
    }
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
