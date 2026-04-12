import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useUIStore } from '../store/useUIStore.js';

/** `webglcontextlost`: toast + forsinket reload (termisk throttling, driver, tab-skift). */
export function WebGlContextLostHandler() {
  const gl = useThree((s) => s.gl);
  const setToastMessage = useUIStore((s) => s.setToastMessage);

  useEffect(() => {
    const el = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL context lost');
      setToastMessage('⚠️ Grafik-fejl — genindlæser...');
      window.setTimeout(() => {
        window.location.reload();
      }, 2000);
    };
    el.addEventListener('webglcontextlost', onLost);
    return () => el.removeEventListener('webglcontextlost', onLost);
  }, [gl, setToastMessage]);

  return null;
}
