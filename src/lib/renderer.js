import * as THREE from 'three';
import { TopographicEffect } from './effects/topographic.js';
import { HalftoneEffect } from './effects/halftone.js';

export function createRenderer(container) {
  const size = 800;

  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true, // Required for GIF capture
    alpha: true // Support transparent background
  });
  renderer.setClearColor(0x000000, 0); // Transparent clear
  renderer.setSize(size, size);
  renderer.setPixelRatio(1); // Keep 1:1 for GIF export
  container.appendChild(renderer.domElement);

  // Fullscreen quad geometry
  const geometry = new THREE.PlaneGeometry(2, 2);

  // Effects
  const effects = {
    topographic: new TopographicEffect(),
    halftone: new HalftoneEffect()
  };

  let currentEffect = 'topographic';
  let mesh = new THREE.Mesh(geometry, effects[currentEffect].material);
  scene.add(mesh);

  // Animation state
  let animationId = null;
  let startTime = Date.now();
  let isRunning = false;

  function render() {
    const elapsed = (Date.now() - startTime) / 1000;
    effects[currentEffect].update(elapsed);
    renderer.render(scene, camera);
  }

  function animate() {
    if (!isRunning) return;
    render();
    animationId = requestAnimationFrame(animate);
  }

  return {
    renderer,
    scene,
    camera,

    get canvas() {
      return renderer.domElement;
    },

    get size() {
      return size;
    },

    get currentEffect() {
      return currentEffect;
    },

    get effects() {
      return effects;
    },

    setEffect(name) {
      if (!effects[name]) return;
      currentEffect = name;
      mesh.material = effects[name].material;
    },

    setSize(newSize) {
      renderer.setSize(newSize, newSize);
    },

    start() {
      isRunning = true;
      startTime = Date.now();
      animate();
    },

    stop() {
      isRunning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },

    render,

    renderAtTime(time) {
      effects[currentEffect].update(time);
      renderer.render(scene, camera);
    },

    dispose() {
      this.stop();
      geometry.dispose();
      Object.values(effects).forEach(e => e.dispose());
      renderer.dispose();
      container.removeChild(renderer.domElement);
    }
  };
}
