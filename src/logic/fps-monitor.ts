/** Ring-buffer af frame-tider (ms) — ingen allokering i sample() (hot path). */
const CAP = 180;

class FpsMonitor {
  private readonly buf = new Float32Array(CAP);
  private write = 0;
  private filled = 0;

  sample(deltaMs: number): void {
    this.buf[this.write] = deltaMs;
    this.write = (this.write + 1) % CAP;
    if (this.filled < CAP) this.filled += 1;
  }

  private meanDeltaMs(): number {
    if (this.filled === 0) return 1000 / 60;
    let sum = 0;
    if (this.filled < CAP) {
      for (let i = 0; i < this.filled; i++) sum += this.buf[i]!;
      return sum / this.filled;
    }
    for (let i = 0; i < CAP; i++) sum += this.buf[i]!;
    return sum / CAP;
  }

  /** Glidende gennemsnitlig FPS ud fra bufferen. */
  getAverageFps(): number {
    const md = this.meanDeltaMs();
    if (md <= 0) return 0;
    return 1000 / md;
  }

  /** True når gennemsnitlig FPS < 24 over hele bufferen (3 s ved ~60 Hz). */
  isUnderPerforming(): boolean {
    if (this.filled < CAP) return false;
    return this.getAverageFps() < 24;
  }
}

export const fpsMon = new FpsMonitor();
