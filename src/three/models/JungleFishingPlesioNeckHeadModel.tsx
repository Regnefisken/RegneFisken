/**
 * Kun hals + hoved + øjne — løs kopi af proportioner fra `PlesiosaurusCatchModel`
 * (`bossCatchMiniModels.tsx`), så du kan tweake den uden at røre fangst-/NPC-modellen.
 */
export function JungleFishingPlesioNeckHeadModel() {
  const mat = { color: '#2e8b57', roughness: 0.5, metalness: 0.1 } as const;

  return (
    <group>
      <mesh castShadow position={[3.5, 3, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.4, 0.8, 4, 14]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh castShadow position={[5.2, 4.5, 0]} scale={[1.2, 0.8, 0.8]}>
        <sphereGeometry args={[0.8, 14, 12]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <group position={[5.5, 4.7, 0.55]}>
        <mesh>
          <sphereGeometry args={[0.22, 12, 10]} />
          <meshStandardMaterial color="#fff" roughness={0.5} />
        </mesh>
        <mesh position={[0.12, 0, 0.12]}>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshStandardMaterial color="#111" roughness={0.2} />
        </mesh>
      </group>
      <group position={[5.5, 4.7, -0.55]}>
        <mesh>
          <sphereGeometry args={[0.22, 12, 10]} />
          <meshStandardMaterial color="#fff" roughness={0.5} />
        </mesh>
        <mesh position={[0.12, 0, -0.12]}>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshStandardMaterial color="#111" roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}
