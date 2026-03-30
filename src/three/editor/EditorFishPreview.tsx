import { useEffect } from 'react';
import { OrbitControls, Grid } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEditorStore } from '../../store/useEditorStore.js';
import { CuteFishModel } from '../models/CuteFishModel.js';

export function EditorFishPreview() {
  const isOpen = useEditorStore((s) => s.isOpen);
  const selectedFishId = useEditorStore((s) => s.selectedFishId);
  const config = useEditorStore((s) => s.configOverride);
  const mode = useEditorStore((s) => s.mode);
  const selectedPart = useEditorStore((s) => s.selectedPart);
  const selectPart = useEditorStore((s) => s.selectPart);
  const editorSwimAnimation = useEditorStore((s) => s.editorPreviewSwimAnimation);

  const { camera } = useThree();

  useEffect(() => {
    if (isOpen) {
      camera.position.set(0, 1.5, 4);
      camera.lookAt(0, 0, 0);
    }
  }, [isOpen, camera]);

  if (!isOpen || !config) return null;
  if (mode === 'edit' && !selectedFishId) return null;

  const fishId = mode === 'edit' ? selectedFishId! : 'editor-new-fish';

  return (
    <>
      <OrbitControls makeDefault enablePan enableZoom enableRotate target={[0, 0, 0]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow={false} />
      <directionalLight position={[-3, 4, -5]} intensity={0.4} />

      <Grid
        args={[10, 10]}
        position={[0, -1.5, 0]}
        cellSize={0.5}
        cellColor="#6e6e6e"
        sectionSize={2}
        sectionColor="#9e9e9e"
        fadeDistance={12}
        infiniteGrid
      />

      <color attach="background" args={['#1a1a2e']} />

      <group
        position={[0, 0, 0]}
        onClick={(e) => {
          if (e.object.userData?.editorPartName == null) selectPart(null);
        }}
      >
        <CuteFishModel
          config={config}
          fishModelId={fishId}
          instanceId="editor-preview"
          rollColor={config.color ?? 0x888888}
          bucketIdle={false}
          editorMode
          editorSwimAnimation={editorSwimAnimation}
          selectedPart={selectedPart}
          onPartClick={(name) => selectPart(name)}
        />
      </group>
    </>
  );
}
