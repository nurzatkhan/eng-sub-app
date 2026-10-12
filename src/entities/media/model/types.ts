export type MediaSource =
  | { kind: "file"; file: File; url: string }
  | { kind: "youtube"; videoId: string; startAt: number };

/** Common surface over <video> and the YouTube IFrame player. */
export interface PlayerController {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  getCurrentTime(): number;
  isPaused(): boolean;
  setRate(rate: number): void;
}
