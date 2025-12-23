import GUI from 'lil-gui';

export function setupGUI(renderer, exporter, snippetExporter) {
  const gui = new GUI({ title: 'Controls' });

  // Effect selector
  const settings = {
    effect: 'topographic'
  };

  gui.add(settings, 'effect', ['topographic', 'halftone'])
    .name('Effect')
    .onChange((value) => {
      renderer.setEffect(value);
      updateFolderVisibility(value);
    });

  // Topographic folder
  const topoFolder = gui.addFolder('Topographic');
  const topoParams = renderer.effects.topographic.params;
  const topoEffect = renderer.effects.topographic;

  topoFolder.add(topoParams, 'mode', ['amoeba', 'concentric'])
    .name('Mode')
    .onChange(() => topoEffect.updateParams());

  topoFolder.add(topoParams, 'lineCount', 5, 50, 1)
    .name('Line Count')
    .onChange(() => topoEffect.updateParams());

  topoFolder.add(topoParams, 'lineThickness', 0.01, 0.1, 0.005)
    .name('Line Thickness')
    .onChange(() => topoEffect.updateParams());

  topoFolder.add(topoParams, 'noiseScale', 0.5, 5, 0.1)
    .name('Noise Scale')
    .onChange(() => topoEffect.updateParams());

  topoFolder.add(topoParams, 'noiseSpeed', 0, 2, 0.1)
    .name('Animation Speed')
    .onChange(() => topoEffect.updateParams());

  topoFolder.add(topoParams, 'distortion', 0, 0.5, 0.01)
    .name('Distortion')
    .onChange(() => topoEffect.updateParams());

  topoFolder.addColor(topoParams, 'lineColor')
    .name('Line Color')
    .onChange(() => topoEffect.updateParams());

  topoFolder.addColor(topoParams, 'backgroundColor')
    .name('Background')
    .onChange(() => topoEffect.updateParams());

  topoFolder.add(topoParams, 'transparent')
    .name('Transparent BG')
    .onChange(() => topoEffect.updateParams());

  // Halftone folder
  const halfFolder = gui.addFolder('Halftone');
  const halfParams = renderer.effects.halftone.params;
  const halfEffect = renderer.effects.halftone;

  halfFolder.add(halfParams, 'gridSize', 5, 120, 1)
    .name('Grid Density')
    .onChange(() => halfEffect.updateParams());

  halfFolder.add(halfParams, 'dotSize', 0.1, 0.5, 0.01)
    .name('Dot Size')
    .onChange(() => halfEffect.updateParams());

  halfFolder.add(halfParams, 'animSpeed', 0, 2, 0.1)
    .name('Animation Speed')
    .onChange(() => halfEffect.updateParams());

  halfFolder.add(halfParams, 'colorOffset', 0, 3, 0.1)
    .name('Color Offset')
    .onChange(() => halfEffect.updateParams());

  halfFolder.add(halfParams, 'noiseAmount', 0, 1, 0.01)
    .name('Noise Amount')
    .onChange(() => halfEffect.updateParams());

  halfFolder.add(halfParams, 'edgeRoundness', 0, 1, 0.01)
    .name('Edge Roundness')
    .onChange(() => halfEffect.updateParams());

  halfFolder.addColor(halfParams, 'color1')
    .name('Color 1')
    .onChange(() => halfEffect.updateParams());

  halfFolder.addColor(halfParams, 'color2')
    .name('Color 2')
    .onChange(() => halfEffect.updateParams());

  halfFolder.addColor(halfParams, 'backgroundColor')
    .name('Background')
    .onChange(() => halfEffect.updateParams());

  halfFolder.add(halfParams, 'transparent')
    .name('Transparent BG')
    .onChange(() => halfEffect.updateParams());

  halfFolder.close();

  // Export folder
  const exportFolder = gui.addFolder('Export GIF');
  const exportParams = exporter.params;

  exportFolder.add(exportParams, 'duration', 1, 10, 0.5)
    .name('Duration (s)')
    .onChange((value) => {
      // Sync loop duration with GIF duration for perfect loops
      topoParams.loopDuration = value;
      halfParams.loopDuration = value;
      topoEffect.updateParams();
      halfEffect.updateParams();
    });

  const seamlessControl = { seamless: false };
  exportFolder.add(seamlessControl, 'seamless')
    .name('Seamless Loop')
    .onChange((value) => {
      topoParams.seamless = value;
      halfParams.seamless = value;
      topoEffect.updateParams();
      halfEffect.updateParams();
    });

  exportFolder.add(exportParams, 'fps', 10, 30, 1)
    .name('FPS');

  exportFolder.add(exportParams, 'quality', 1, 20, 1)
    .name('Quality');

  exportFolder.add(exportParams, 'size', [256, 400, 512, 800])
    .name('Size');

  const exportBtn = {
    exportGif: () => exporter.export(),
    exportJS: () => snippetExporter.export()
  };

  exportFolder.add(exportBtn, 'exportGif').name('Export GIF');
  exportFolder.add(exportBtn, 'exportJS').name('Export JS Snippet');

  function updateFolderVisibility(effect) {
    if (effect === 'topographic') {
      topoFolder.open();
      halfFolder.close();
    } else {
      topoFolder.close();
      halfFolder.open();
    }
  }

  return gui;
}
