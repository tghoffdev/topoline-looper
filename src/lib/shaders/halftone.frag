precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uGridSize;
uniform float uDotSize;
uniform float uAnimSpeed;
uniform float uColorOffset;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uBackgroundColor;
uniform float uTransparent;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
    dot(x12.zw, x12.zw)), 0.0);
  m = m*m;
  m = m*m;
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
  vec2 cellId = floor(grid);
  vec2 cellUv = fract(grid) - 0.5;

  float dist = length(cellUv);

  // Modulate dot size based on pattern value
  float size = dotSize * pattern;

  // Anti-aliased dot
  float fw = fwidth(dist);
  float dot = 1.0 - smoothstep(size - fw, size + fw, dist);

  return dot;
}

void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5);

  float time = uTime * uAnimSpeed;

  // Distance from center
  float dist = length(uv - center);

  // Animated pattern using noise
  float noise1 = snoise((uv - center) * 3.0 + time * 0.5) * 0.5 + 0.5;
  float noise2 = snoise((uv - center) * 3.0 + time * 0.5 + 100.0) * 0.5 + 0.5;

  // Radial gradient combined with noise
  float pattern1 = 1.0 - dist * 1.5;
  pattern1 = pattern1 * noise1;
  pattern1 = clamp(pattern1, 0.0, 1.0);

  // Second pattern with offset for color separation
  vec2 offsetUv = uv + vec2(uColorOffset * 0.02);
  float dist2 = length(offsetUv - center);
  float pattern2 = 1.0 - dist2 * 1.5;
  pattern2 = pattern2 * noise2;
  pattern2 = clamp(pattern2, 0.0, 1.0);

  // Create halftone dots for each color channel
  float dots1 = halftonePattern(uv, uGridSize, uDotSize, pattern1);
  float dots2 = halftonePattern(uv + vec2(0.005), uGridSize, uDotSize, pattern2);

  // Fade out at edges
  float edgeFade = 1.0 - smoothstep(0.4, 0.55, dist);
  dots1 *= edgeFade;
  dots2 *= edgeFade;

  // Combine colors and alpha
  float totalDots = max(dots1, dots2 * 0.8);

  vec3 color = uBackgroundColor;
  color = mix(color, uColor1, dots1);
  color = mix(color, uColor2, dots2 * 0.8);

  // Alpha: fully opaque for dots, transparent for background if enabled
  float alpha = uTransparent > 0.5 ? totalDots : 1.0;

  gl_FragColor = vec4(color, alpha);
}
