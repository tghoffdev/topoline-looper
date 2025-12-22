<script>
  import { onMount, onDestroy } from 'svelte';
  import { createRenderer } from './lib/renderer.js';
  import { setupGUI } from './lib/gui.js';
  import { GifExporter } from './lib/gifExporter.js';

  let container;
  let renderer = null;
  let gui = null;
  let exporter = null;

  onMount(() => {
    renderer = createRenderer(container);
    exporter = new GifExporter(renderer);
    gui = setupGUI(renderer, exporter);
    renderer.start();
  });

  onDestroy(() => {
    if (gui) gui.destroy();
    if (renderer) renderer.dispose();
  });
</script>

<div class="app">
  <div class="canvas-container" bind:this={container}></div>
  <div class="info">
    <span class="title">Topographic GIF Generator</span>
  </div>
</div>

<style>
  .app {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    position: relative;
  }

  .canvas-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .canvas-container :global(canvas) {
    max-width: 90vmin;
    max-height: 90vmin;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    /* Checkerboard pattern for transparency preview */
    background-image:
      linear-gradient(45deg, #333 25%, transparent 25%),
      linear-gradient(-45deg, #333 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #333 75%),
      linear-gradient(-45deg, transparent 75%, #333 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    background-color: #222;
  }

  .info {
    position: fixed;
    bottom: 20px;
    left: 20px;
    color: #666;
    font-family: monospace;
    font-size: 12px;
  }

  .title {
    opacity: 0.5;
  }
</style>
