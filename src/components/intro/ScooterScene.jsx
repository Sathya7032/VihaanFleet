import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { loadVespaScene } from '../../three/vespaModel';
import { IntroEngine } from './introEngine';

/**
 * Bridges React and the imperative IntroEngine: creates it on mount, feeds
 * it the model, ticks it each frame, and disposes everything on unmount.
 */
function IntroRig({ startTime, isMobile, vRectRef, reportRef, onReady, onError }) {
  const { gl, scene, camera } = useThree();
  const groupRef = useRef(null);
  const engineRef = useRef(null);
  const live = useRef({ startTime, onReady, onError });

  useEffect(() => {
    live.current = { startTime, onReady, onError };
  });

  useEffect(() => {
    const engine = new IntroEngine({ gl, scene, camera, isMobile });
    const holder = groupRef.current;
    holder.add(engine.group);
    engineRef.current = engine;
    let cancelled = false;
    loadVespaScene()
      .then((s) => !cancelled && engine.setScene(s))
      .catch((err) => {
        console.warn('[VihaanIntro] scooter model failed to load; skipping intro.', err);
        live.current.onError?.();
      });
    return () => {
      cancelled = true;
      holder.remove(engine.group);
      engine.dispose();
      engineRef.current = null;
    };
  }, [gl, scene, camera, isMobile]);

  useFrame((state) => {
    const engine = engineRef.current;
    if (!engine) return;
    const becameReady = engine.frame({
      width: state.size.width,
      height: state.size.height,
      dpr: state.viewport.dpr,
      startTime: live.current.startTime,
      vRect: vRectRef.current,
      report: reportRef,
    });
    if (becameReady) live.current.onReady?.();
  });

  return <group ref={groupRef} />;
}

/**
 * The intro's WebGL layer (transparent, over the overlay's backdrop).
 * Lazy-loaded so three.js never blocks the homepage bundle; unmounting the
 * Canvas releases the WebGL context.
 */
export default function ScooterScene({ startTime, isMobile, vRectRef, reportRef, onReady, onError, active = true }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, isMobile ? 1.75 : 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 28, near: 0.1, far: 100, position: [0, 0, 14] }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <IntroRig
        startTime={startTime}
        isMobile={isMobile}
        vRectRef={vRectRef}
        reportRef={reportRef}
        onReady={onReady}
        onError={onError}
      />
    </Canvas>
  );
}
