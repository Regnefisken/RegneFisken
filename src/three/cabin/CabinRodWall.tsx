import { useMemo } from 'react';
import { DoubleSide } from 'three';

const S = 1 / 3;

const THEMES = [
  { rodColor: 0x8b6540, gripColor: 0x6b4a2e, seatColor: 0xcccccc, reelBase: 0x8b5a2b, spoolColor: 0xff8c00, metalness: 0.1 },
  { rodColor: 0x243e60, gripColor: 0x1b2d47, seatColor: 0xdddddd, reelBase: 0x188a85, spoolColor: 0x3ac2bd, metalness: 0.2 },
  { rodColor: 0xe0c08b, gripColor: 0xceab70, seatColor: 0xffffff, reelBase: 0xdeaa73, spoolColor: 0xf26666, metalness: 0.1 },
  { rodColor: 0x6b2b2b, gripColor: 0x4a1818, seatColor: 0xc87d4a, reelBase: 0x5a3e2b, spoolColor: 0x4a9e5b, metalness: 0.3 },
] as const;

function SingleRod({
  theme,
}: {
  theme: (typeof THEMES)[number];
}) {
  const seg = 16;
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[1.0 * S, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1 * S, 0.1 * S, 0.9 * S, 10]} />
        <meshStandardMaterial color={theme.gripColor} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[1.45 * S, 0, 0]} castShadow>
        <sphereGeometry args={[0.1 * S, 10, 8]} />
        <meshStandardMaterial color={theme.seatColor} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.2 * S, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09 * S, 0.09 * S, 0.7 * S, seg]} />
        <meshStandardMaterial color={theme.seatColor} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.35 * S, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1 * S, 0.1 * S, 0.4 * S, 10]} />
        <meshStandardMaterial color={theme.gripColor} roughness={0.9} flatShading />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.55 * S - (3.5 * S) / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015 * S, 0.07 * S, 3.5 * S, seg]} />
        <meshStandardMaterial color={theme.rodColor} roughness={0.8} metalness={theme.metalness} />
      </mesh>
      <group position={[0.2 * S, -0.12 * S, 0]}>
        <mesh position={[0, -0.1 * S, 0]} castShadow>
          <boxGeometry args={[0.08 * S, 0.18 * S, 0.05 * S]} />
          <meshStandardMaterial color={theme.reelBase} roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.05 * S, -0.22 * S, 0]} castShadow>
          <cylinderGeometry args={[0.12 * S, 0.12 * S, 0.22 * S, seg]} />
          <meshStandardMaterial color={theme.reelBase} roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.18 * S, -0.22 * S, 0]} castShadow>
          <cylinderGeometry args={[0.1 * S, 0.1 * S, 0.14 * S, seg]} />
          <meshStandardMaterial color={theme.spoolColor} roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.05 * S, -0.22 * S, 0.18 * S]} castShadow>
          <cylinderGeometry args={[0.015 * S, 0.015 * S, 0.15 * S, 8]} />
          <meshStandardMaterial color={theme.seatColor} roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
      {[-1.0 * S, -2.1 * S, -3.3 * S].map((xPos, i) => {
        const r = 0.065 - i * 0.015;
        return (
          <mesh key={i} rotation={[0, Math.PI / 2, 0]} position={[xPos, 0, 0]} castShadow>
            <torusGeometry args={[r + 0.008, 0.01, 6, seg]} />
            <meshStandardMaterial color={theme.seatColor} roughness={0.3} metalness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Legacy `buildRodWall` — rack + fire stænger + usynlig hitbox. */
export function CabinRodWall() {
  const layout = useMemo(() => {
    const spacingY = 1.2 * S;
    const startY = ((THEMES.length - 1) * spacingY) / 2;
    return THEMES.map((theme, idx) => ({
      theme,
      y: startY - idx * spacingY,
    }));
  }, []);

  return (
    <group>
      <mesh position={[-1.8 * S, 0, 0]} castShadow>
        <boxGeometry args={[0.18 * S, 5.5 * S, 0.1 * S]} />
        <meshStandardMaterial color={0x3d2314} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[1.8 * S, 0, 0]} castShadow>
        <boxGeometry args={[0.18 * S, 5.5 * S, 0.1 * S]} />
        <meshStandardMaterial color={0x3d2314} roughness={0.9} flatShading />
      </mesh>
      {layout.map(({ theme, y }) => (
        <group key={theme.rodColor} position={[0, y, 0.05 * S]} rotation={[0.35, 0, 0]}>
          <SingleRod theme={theme} />
          {[-1.8 * S, 1.8 * S].map((xOff) => (
            <mesh
              key={xOff}
              rotation={[Math.PI / 2, 0, 0]}
              position={[xOff, -0.05 * S, 0.08 * S]}
              castShadow
            >
              <cylinderGeometry args={[0.04 * S, 0.04 * S, 0.4 * S, 8]} />
              <meshStandardMaterial color={0x5c3a21} roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh>
        <boxGeometry args={[1.8 * S * 2 + 0.3 * S, 5.5 * S, 0.6 * S]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={DoubleSide} />
      </mesh>
    </group>
  );
}
