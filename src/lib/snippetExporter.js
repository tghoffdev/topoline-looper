export class SnippetExporter {
  constructor(renderer) {
    this.renderer = renderer;
  }

  generateSnippet() {
    const effectName = this.renderer.currentEffect;
    const effect = this.renderer.effects[effectName];
    const params = { ...effect.params };

    if (effectName === 'topographic') {
      return this.generateTopographicSnippet(params);
    } else {
      return this.generateHalftoneSnippet(params);
    }
  }

  generateTopographicSnippet(params) {
    const modeValue = params.mode === 'concentric' ? 1.0 : 0.0;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Topographic Animation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a1a; }
    #container { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
    canvas { max-width: 100%; max-height: 100%; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script type="importmap">
    { "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }
  </script>
  <script type="module">
    import * as THREE from 'three';

    const vertexShader = \`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    \`;

    const fragmentShader = \`
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;

      #define PI 3.14159265359
      #define TWO_PI 6.28318530718
      #define MODE ${modeValue.toFixed(1)}
      #define LINE_COUNT ${params.lineCount.toFixed(1)}
      #define LINE_THICKNESS ${params.lineThickness.toFixed(4)}
      #define NOISE_SCALE ${params.noiseScale.toFixed(2)}
      #define NOISE_SPEED ${params.noiseSpeed.toFixed(2)}
      #define DISTORTION ${params.distortion.toFixed(3)}
      #define LINE_COLOR vec3(${this.hexToVec3(params.lineColor)})
      #define BG_COLOR vec3(${this.hexToVec3(params.backgroundColor)})

      vec3 permute3(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise2(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 p, float time) {
        float value = 0.0, amplitude = 0.5, frequency = 1.0;
        for (int i = 0; i < 4; i++) {
          value += amplitude * snoise2(p * frequency + time * 0.1 * float(i + 1));
          amplitude *= 0.5; frequency *= 2.0;
        }
        return value;
      }

      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5);
        float dist = length(uv - center);
        float time = uTime * NOISE_SPEED;
        vec2 noiseCoord = (uv - center) * NOISE_SCALE;

        float noise1 = fbm(noiseCoord, time);
        float noise2 = fbm(noiseCoord * 1.5 + 100.0, time * 0.7);

        float height;
        if (MODE < 0.5) {
          height = dist * 2.0 + noise1 * DISTORTION + noise2 * DISTORTION * 0.5;
        } else {
          height = dist * 2.0 - time * 0.15 + noise1 * DISTORTION + noise2 * DISTORTION * 0.3;
        }

        float contours = fract(height * LINE_COUNT);
        float fw = fwidth(height * LINE_COUNT) * 1.5;
        float line = smoothstep(LINE_THICKNESS - fw, LINE_THICKNESS, contours) *
                     smoothstep(LINE_THICKNESS + fw + LINE_THICKNESS, LINE_THICKNESS + fw, contours);

        float edgeFade = 1.0 - smoothstep(0.35, 0.5, dist);
        line *= edgeFade;

        vec3 color = mix(BG_COLOR, LINE_COLOR, line);
        gl_FragColor = vec4(color, 1.0);
      }
    \`;

    // Setup
    const container = document.getElementById('container');
    const size = Math.min(window.innerWidth, window.innerHeight);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(size, size);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const uniforms = { uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const startTime = Date.now();
    function animate() {
      uniforms.uTime.value = (Date.now() - startTime) / 1000;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
      const size = Math.min(window.innerWidth, window.innerHeight);
      renderer.setSize(size, size);
    });
  </script>
</body>
</html>`;
  }

  generateHalftoneSnippet(params) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Halftone Animation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a1a; }
    #container { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
    canvas { max-width: 100%; max-height: 100%; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script type="importmap">
    { "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }
  </script>
  <script type="module">
    import * as THREE from 'three';

    const vertexShader = \`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    \`;

    const fragmentShader = \`
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;

      #define PI 3.14159265359
      #define TWO_PI 6.28318530718
      #define GRID_SIZE ${params.gridSize.toFixed(1)}
      #define DOT_SIZE ${params.dotSize.toFixed(3)}
      #define ANIM_SPEED ${params.animSpeed.toFixed(2)}
      #define COLOR_OFFSET ${params.colorOffset.toFixed(2)}
      #define NOISE_AMOUNT ${params.noiseAmount.toFixed(2)}
      #define EDGE_ROUNDNESS ${params.edgeRoundness.toFixed(2)}
      #define COLOR1 vec3(${this.hexToVec3(params.color1)})
      #define COLOR2 vec3(${this.hexToVec3(params.color2)})
      #define BG_COLOR vec3(${this.hexToVec3(params.backgroundColor)})

      vec3 permute3(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise2(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float halftonePattern(vec2 uv, float gridSize, float dotSize, float pattern) {
        vec2 grid = uv * gridSize;
        vec2 cellUv = fract(grid) - 0.5;
        float dist = length(cellUv);
        float size = dotSize * pattern;
        float fw = fwidth(dist);
        return 1.0 - smoothstep(size - fw, size + fw, dist);
      }

      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5);
        float time = uTime * ANIM_SPEED;

        vec2 fromCenter = abs(uv - center);
        float circularDist = length(fromCenter);
        float squareDist = max(fromCenter.x, fromCenter.y);
        float dist = mix(squareDist, circularDist, EDGE_ROUNDNESS);

        float pulse = sin(time * 2.0) * 0.3 + 0.7;
        float pulse2 = sin(time * 2.0 + 0.5) * 0.3 + 0.7;

        float pattern1 = (1.0 - dist * 1.2) * pulse;
        float pattern2 = (1.0 - length(abs(uv + vec2(COLOR_OFFSET * 0.02) - center)) * 1.2) * pulse2;

        if (NOISE_AMOUNT > 0.0) {
          float noise1 = snoise2((uv - center) * 4.0 + time * 0.3) * 0.5 + 0.5;
          float noise2 = snoise2((uv - center) * 4.0 + time * 0.3 + vec2(100.0)) * 0.5 + 0.5;
          pattern1 = mix(pattern1, pattern1 * noise1, NOISE_AMOUNT);
          pattern2 = mix(pattern2, pattern2 * noise2, NOISE_AMOUNT);
        }

        pattern1 = clamp(pattern1, 0.0, 1.0);
        pattern2 = clamp(pattern2, 0.0, 1.0);

        float dots1 = halftonePattern(uv, GRID_SIZE, DOT_SIZE, pattern1);
        float dots2 = halftonePattern(uv + vec2(0.005), GRID_SIZE, DOT_SIZE, pattern2);

        float edgeFade = 1.0 - smoothstep(0.4, 0.55, dist);
        dots1 *= edgeFade;
        dots2 *= edgeFade;

        vec3 color = BG_COLOR;
        color = mix(color, COLOR1, dots1);
        color = mix(color, COLOR2, dots2 * 0.8);

        gl_FragColor = vec4(color, 1.0);
      }
    \`;

    // Setup
    const container = document.getElementById('container');
    const size = Math.min(window.innerWidth, window.innerHeight);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(size, size);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const uniforms = { uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const startTime = Date.now();
    function animate() {
      uniforms.uTime.value = (Date.now() - startTime) / 1000;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
      const size = Math.min(window.innerWidth, window.innerHeight);
      renderer.setSize(size, size);
    });
  </script>
</body>
</html>`;
  }

  hexToVec3(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return `${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}`;
  }

  export() {
    const snippet = this.generateSnippet();

    // Copy to clipboard
    navigator.clipboard.writeText(snippet).then(() => {
      this.showNotification('HTML snippet copied to clipboard!');
    }).catch(() => {
      // Fallback: download as file
      this.downloadSnippet(snippet);
    });
  }

  downloadSnippet(snippet) {
    const blob = new Blob([snippet], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.renderer.currentEffect}-animation.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showNotification('HTML file downloaded!');
  }

  showNotification(message) {
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px 30px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      z-index: 10000;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }
}
