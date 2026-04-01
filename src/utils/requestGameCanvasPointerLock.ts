/**
 * Genaktiverer pointer lock på WebGL-canvas (FPS / admin free-roam).
 * Skal kaldes i forlængelse af en brugerhandling (fx klik på "luk" i modal).
 */
export function requestGameCanvasPointerLock(): void {
  const el = document.querySelector('.game-root canvas') as HTMLCanvasElement | null;
  if (el) void el.requestPointerLock();
}
