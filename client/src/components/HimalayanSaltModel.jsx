import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// import modelGlbUrl from '../../../../day_257_himalayan_salt_lamp.glb?url';
const modelGlbUrl = '/himalayan_salt_lamp_v2.glb';

export function HimalayanSaltModel({ rotationDurationMs = 20000, onReady }){
  const rootRef = useRef(null);
  const mountRef = useRef(null);
  const frameRef = useRef(0);
  const [status, setStatus] = useState('initializing');
  const [loadProgress, setLoadProgress] = useState(0);
  const [activate3d, setActivate3d] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActivate3d(true);
          setStatus('loading');
          io.disconnect();
        }
      },
      { threshold: 0.02, rootMargin: '0px 0px 400px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!activate3d) return undefined;
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    // Start with a conservative camera position; we'll reframe after loading the model.
    camera.position.set(0, 1.2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xfff2df, 0xb6ffd7, 0.95);
    hemi.intensity = 1.25;
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff5e7, 1.25);
    key.intensity = 1.55;
    key.position.set(2.8, 3.8, 2.6);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xd9ffe9, 0.85);
    rim.intensity = 1.0;
    rim.position.set(-3.2, 2.3, -2.5);
    scene.add(rim);

    const fill = new THREE.PointLight(0xffb777, 1.05, 16);
    fill.intensity = 1.35;
    fill.position.set(0, 1.1, 1.8);
    scene.add(fill);

    // Subtle center glow light (simulating internal bulb)
    const centerLight = new THREE.PointLight(0xffffff, 1.5, 10);
    centerLight.position.set(0, 0, 0);
    scene.add(centerLight);

    // Particle effect - REMOVED

    // Help cube to verify rendering - REMOVED

    const loader = new GLTFLoader();

    let model = null;
    let disposed = false;
    let resizeObserver = null;

    const updateSize = () => {
      if (!mount) return;
      const rect = mount.getBoundingClientRect();
      const width = rect.width || mount.clientWidth || 1;
      const height = rect.height || mount.clientHeight || 1;
      if (width < 1 || height < 1) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    updateSize();
    resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(mount);

    loader.load(
      modelGlbUrl,
      (gltf) => {
        if (disposed) return;
        const obj = gltf.scene;
        
        // Use Original Model Textures/Materials
        obj.traverse((child) => {
          if (child.isMesh) {
            // If the model has textures, they will be used. 
            // We only ensure the material is physically correct and visible.
            if (child.material) {
              child.material.side = THREE.DoubleSide;
              child.material.transparent = false;
              child.material.opacity = 1;
            }
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Normalize scaling
        const bbox = new THREE.Box3().setFromObject(obj);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 3.6 / maxDim; // Balanced scale

        obj.position.sub(center);
        obj.scale.setScalar(scale);
        obj.rotation.y = Math.PI * 0.12;

        scene.add(obj);
        model = obj;

        // Reframe camera for a cinematic close-up
        camera.position.set(0, 1.2, 7.5);
        camera.lookAt(0, 0, 0);

        setStatus('ready');
        onReady?.();
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error('Error loading model:', err);
        if (!disposed) setStatus('error');
      }
    );

    const clock = new THREE.Clock();

    const render = () => {
      frameRef.current = requestAnimationFrame(render);
      const t = clock.getElapsedTime();
      if (model) {
        // Deterministic rotation for syncing UI timing.
        const rotationSeconds = Math.max(3, rotationDurationMs / 1000);
        model.rotation.y = (t / rotationSeconds) * Math.PI * 2;
        model.rotation.x = Math.sin(t * 0.55) * 0.045;
        model.position.y = Math.sin(t * 0.7) * 0.06;
      }
      
      // Animate particles - REMOVED
      
      camera.position.x = Math.sin(t * 0.25) * 0.2;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    render();

    return () => {
      disposed = true;
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose?.();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m?.dispose?.());
          else obj.material?.dispose?.();
        }
      });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [activate3d, rotationDurationMs, onReady]);

  return (
    <div
      ref={rootRef}
      className="salt-model reveal-visible"
      aria-label="3D Himalayan salt showcase"
      style={{ opacity: activate3d ? 1 : 0, transition: 'opacity 1s ease' }}
    >
      <div className="salt-model__glow" aria-hidden="true" />
      <div ref={mountRef} className="salt-model__canvas" />
      {(!activate3d || status !== 'ready') && (
        <div className="salt-model__status">
          {status === 'error'
            ? '3D model unavailable. Please refresh.'
            : status === 'loading'
              ? `Loading 3D model... ${loadProgress}%`
              : activate3d
                ? 'Preparing 3D showcase...'
                : '3D showcase ready below'}
        </div>
      )}
      {/* status === 'ready' && activate3d && (
        <div className="salt-model__status" style={{ background: 'rgba(0, 255, 0, 0.1)' }}>
          Model Loaded & Ready
        </div>
      ) */}
    </div>
  );
}

