import GIF from 'gif.js';

export class GifExporter {
  constructor(renderer) {
    this.renderer = renderer;
    this.params = {
      duration: 3,
      fps: 20,
      quality: 10,
      size: 512
    };
    this.isExporting = false;
  }

  async export() {
    if (this.isExporting) {
      console.warn('Export already in progress');
      return;
    }

    this.isExporting = true;
    const { duration, fps, quality, size } = this.params;
    const frameCount = Math.floor(duration * fps);
    const frameDelay = 1000 / fps;

    // Save current state
    const originalSize = this.renderer.size;

    // Resize for export
    this.renderer.setSize(size);

    // Check if current effect has transparency enabled
    const currentEffect = this.renderer.effects[this.renderer.currentEffect];
    const isTransparent = currentEffect.params.transparent;

    // Create GIF encoder
    const gifOptions = {
      workers: 2,
      quality: quality,
      width: size,
      height: size,
      workerScript: '/gif.worker.js'
    };

    // Add transparency support if enabled
    if (isTransparent) {
      gifOptions.transparent = 0x000000; // Black as transparent color
    }

    const gif = new GIF(gifOptions);

    // Show progress
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 30px 50px;
      border-radius: 10px;
      font-family: monospace;
      font-size: 16px;
      z-index: 10000;
      text-align: center;
    `;
    progressDiv.innerHTML = 'Capturing frames...<br><span id="export-progress">0%</span>';
    document.body.appendChild(progressDiv);

    const progressSpan = document.getElementById('export-progress');

    // Capture frames
    this.renderer.stop();

    for (let i = 0; i < frameCount; i++) {
      const time = (i / frameCount) * duration;
      this.renderer.renderAtTime(time);

      // Get canvas data
      const canvas = this.renderer.canvas;
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.width = size;
      ctx.canvas.height = size;
      ctx.drawImage(canvas, 0, 0);

      gif.addFrame(ctx, { delay: frameDelay, copy: true });

      progressSpan.textContent = `Capturing: ${Math.round((i / frameCount) * 100)}%`;

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    progressSpan.textContent = 'Encoding GIF...';

    // Handle GIF completion
    gif.on('finished', (blob) => {
      // Download the GIF
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.renderer.currentEffect}-${Date.now()}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Cleanup
      document.body.removeChild(progressDiv);
      this.renderer.setSize(originalSize);
      this.renderer.start();
      this.isExporting = false;
    });

    gif.on('progress', (p) => {
      progressSpan.textContent = `Encoding: ${Math.round(p * 100)}%`;
    });

    // Start rendering
    gif.render();
  }
}
