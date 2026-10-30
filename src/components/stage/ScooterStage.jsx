import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { loadVespaScene } from '../../three/vespaModel';
import { ScooterStudio, StageMotion } from '../../three/stageEngine';
import { HEADING, HOW_SIZE, RIDE_IN_FROM_NX, RIDE_IN_HIT_AT, RIDE_IN_SECONDS, poseForScroll, posesFor } from '../../three/stagePoses';
import { groundAt, pointOnRoute, readHowRoute } from '../../three/howRoute';

const power4Out = (t) => 1 - Math.pow(1 - t, 5);

function StageRig({ rideIn, isMobile, reduced, onError }) {
  const { gl, scene, camera, invalidate } = useThree();
  const holderRef = useRef(null);
  const engine = useRef(null);
  const live = useRef({ rideIn });

  useEffect(() => {
    live.current.rideIn = rideIn;
  }, [rideIn]);

  useEffect(() => {
    const studio = new ScooterStudio({ gl, scene, camera });
    const motion = new StageMotion(studio);
    const poses = posesFor(window.innerWidth, window.innerHeight);
    const state = {
      studio,
      motion,
      poses,
      howSize: isMobile ? HOW_SIZE.mobile : HOW_SIZE.desktop,
      heroPose: { ...poses.hero, nx: reduced ? poses.hero.nx : RIDE_IN_FROM_NX },
      target: { ...poses.hero },
      shown: null,
      rideStart: null,
      hitDone: false,
      parallax: 0,
      parallaxTarget: 0,
    };
    holderRef.current.add(studio.group);
    engine.current = state;

    let cancelled = false;
    loadVespaScene()
      .then((s) => {
        if (cancelled) return;
        studio.setScene(s);
        invalidate(); // compile + draw once, even while paused behind the intro
      })
      .catch((err) => {
        console.warn('[Stage] scooter model failed to load', err);
        onError?.();
      });

    const onPointer = (e) => {
      state.parallaxTarget = (e.clientX / window.innerWidth - 0.5) * 0.18;
    };
    const fine = window.matchMedia('(pointer: fine)').matches && !reduced;
    if (fine) window.addEventListener('pointermove', onPointer);

    const holder = holderRef.current;
    return () => {
      cancelled = true;
      if (fine) window.removeEventListener('pointermove', onPointer);
      holder?.remove(studio.group);
      studio.dispose();
      engine.current = null;
    };
  }, [gl, scene, camera, invalidate, isMobile, reduced, onError]);

  useFrame((state, delta) => {
    const e = engine.current;
    if (!e || !e.studio.vespa) return;
    const now = performance.now() / 1000;
    e.studio.resize(state.size.width, state.size.height);

    // Hero ride-in from the right, with a landing bump (reference behaviour).
    if (live.current.rideIn && !reduced) {
      if (e.rideStart == null) e.rideStart = now;
      const u = Math.min(1, (now - e.rideStart) / RIDE_IN_SECONDS);
      e.heroPose.nx = RIDE_IN_FROM_NX + (e.poses.hero.nx - RIDE_IN_FROM_NX) * power4Out(u);
      if (!e.hitDone && now - e.rideStart >= RIDE_IN_HIT_AT) {
        e.hitDone = true;
        e.motion.hit(1);
      }
    }

    // Live "How it works" route, measured from the step circles on screen.
    let how = null;
    const route = readHowRoute();
    if (route && route.circles.length > 1) {
      const { width: w, height: h } = state.size;
      const halfLen = (e.howSize * w) / 2;
      const toPose = (pt, dir) => ({
        nx: (pt.x / w) * 2 - 1,
        ny: 1 - (2 * groundAt(route, pt.x, halfLen, pt.y)) / h, // tyres just above the line / step circle
        size: e.howSize,
        rotY: dir > 0 ? HEADING.right : HEADING.left,
      });
      const c = route.circles;
      const lastDir = c[c.length - 1].x >= c[c.length - 2].x ? 1 : -1;
      const at = pointOnRoute(c, route.p);
      how = {
        approach: route.approach,
        p: route.p,
        startPose: toPose(c[0], 1),
        endPose: toPose(c[c.length - 1], lastDir),
        routePose: toPose(at, at.dir),
        // lowest ny the scooter may have at screen x (its tyres stay above the line)
        floorNy: (x, size) => 1 - (2 * groundAt(route, x, (size * w) / 2)) / h,
      };
    }
    poseForScroll(e.target, e.poses, e.heroPose, state.size.height, how);
    if (!e.shown || reduced) e.shown = { ...e.target };
    else {
      // scrubbed feel: ease toward the scroll target (~0.8 s catch-up)
      const k = 1 - Math.exp(-delta * 5);
      for (const key of ['nx', 'ny', 'size', 'rotY']) e.shown[key] += (e.target[key] - e.shown[key]) * k;
      // the ride-in itself is not lagged
      if (window.scrollY < 4) e.shown.nx = e.target.nx;
      // parked on step 4 and scrolled away (or a menu jump past it): don't fly across the screen
      if (Math.abs(e.target.ny) > 1.3) e.shown = { ...e.target };
    }
    // Never below the "How it works" line, even mid-scroll while the eased pose catches up.
    if (how) {
      const floor = how.floorNy(((e.shown.nx + 1) / 2) * state.size.width, e.shown.size);
      if (e.shown.ny < floor) e.shown.ny = floor;
    }
    e.shown.spin = e.target.spin || 0;
    e.shown.air = e.target.air || 0;
    e.parallax += (e.parallaxTarget - e.parallax) * (1 - Math.exp(-delta * 4));
    e.motion.update(delta, now, e.shown, e.parallax);
  });

  return <group ref={holderRef} />;
}

/**
 * Fixed full-screen WebGL layer behind the homepage: the cream & gold
 * scooter that rides in on load and glides between sections as you scroll.
 */
export default function ScooterStage({ rideIn, paused = false, onError }) {
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches;
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Canvas
      className="stage"
      aria-hidden="true"
      // while the intro plays on top, render on demand only (no competing GPU work)
      frameloop={paused ? 'demand' : 'always'}
      dpr={[1, isMobile ? 1.75 : 2]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 28, position: [0, 0, 14] }}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100svh', zIndex: 0, pointerEvents: 'none' }}
      events={undefined}
    >
      <StageRig rideIn={rideIn} isMobile={isMobile} reduced={reduced} onError={onError} />
    </Canvas>
  );
}
