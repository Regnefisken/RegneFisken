import { DoubleSide } from 'three';
import { useAudio } from '../../audio/useAudio.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useUIStore } from '../../store/useUIStore.js';

/** Måge-fjer på mole — samme verdensplacering som legacy `sgFeather.position.set(0.4, 0.55, 0.5)` (gul cirkel på reference). */
export function SeagullFeather() {
  const { play } = useAudio();
  const featherSources = usePlayerStore((s) => s.featherSources);
  const setToastMessage = useUIStore((s) => s.setToastMessage);

  if (featherSources.includes('seagull')) return null;

  const shaftMat = { color: 0xd0d0d0, roughness: 0.5, flatShading: true as const };
  const bardMat = {
    color: 0xe8e8e0,
    roughness: 0.45,
    flatShading: true as const,
    transparent: true,
    opacity: 0.85,
    side: DoubleSide,
  };

  function onPick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    const p = usePlayerStore.getState();
    if (p.featherSources.includes('seagull')) {
      setToastMessage('🪶 Du har allerede samlet måge-fjeren!');
      play('error');
      return;
    }
    p.setFeatherSources([...p.featherSources, 'seagull']);
    setToastMessage('🪶 Du samlede en smuk måge-fjer op fra broen!');
    play('ui');
  }

  // Forælder er `PierMoleInteractives` [0, 0.1, 0] som broen — lokal pos = legacy world − (0, 0.1, 0).
  return (
    <group
      position={[0.4, 0.45, 0.5]}
      scale={1.6}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={onPick}
    >
      <mesh>
        <boxGeometry args={[0.5, 0.12, 0.35]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[0.03, -0.12 + i * 0.08, 0]} rotation={[0, 0, -0.25]}>
          <planeGeometry args={[0.1 - i * 0.012, 0.06]} />
          <meshStandardMaterial {...bardMat} />
        </mesh>
      ))}
      <mesh rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.35, 4]} />
        <meshStandardMaterial {...shaftMat} />
      </mesh>
    </group>
  );
}
