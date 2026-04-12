/**
 * Shared touch/joystick input for jungle FP — updated by DOM overlays, read in `JunglePlayerController` useFrame.
 * Not in Zustand to avoid re-renders on every touch frame.
 */
export const jungleTouchInput = {
  /** Strafe (x) og frem/tilbage (y), ca. -1..1 fra virtual joystick. */
  move: { x: 0, y: 0 },
  /** Akkumulerede look-deltaer (radian-lignende skalering sker i controller). */
  look: { dx: 0, dy: 0 },
};

export function resetJungleTouchInput(): void {
  jungleTouchInput.move.x = 0;
  jungleTouchInput.move.y = 0;
  jungleTouchInput.look.dx = 0;
  jungleTouchInput.look.dy = 0;
}
