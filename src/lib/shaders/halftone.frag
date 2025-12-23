precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uGridSize;
uniform float uDotSize;
uniform float uAnimSpeed;
uniform float uLoopDuration;
uniform float uSeamless;
uniform float uColorOffset;
uniform float uNoiseAmount;
uniform float uEdgeRoundness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uBackgroundColor;
uniform float uTransparent;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// 3D Simplex noise for looping
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise3(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// 2D simplex noise (for non-seamless mode)
vec3 permute3(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise2(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0))
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

// Looping noise - samples in a circle through 3D noise space
float loopingNoise(vec2 coord, float progress, float radius) {
  float angle = progress * TWO_PI;
  vec3 pos = vec3(coord, 0.0);
  pos.z = sin(angle) * radius;
  float w = cos(angle) * radius;
  return snoise3(pos + vec3(w, 0.0, 0.0));
}

float halftonePattern(vec2 uv, float gridSize, float dotSize, float pattern) {
  vec2 grid = uv * gridSize;
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

  // Distance from center - blend between circular and square
  vec2 fromCenter = abs(uv - center);
  float circularDist = length(fromCenter);
  float squareDist = max(fromCenter.x, fromCenter.y);
  float dist = mix(squareDist, circularDist, uEdgeRoundness);

  float pulse, pulse2;
  float noise1 = 0.0;
  float noise2 = 0.0;

  if (uSeamless > 0.5) {
    // Seamless looping mode
    float progress = fract(uTime / uLoopDuration);
    // Pulse can use half-cycles (sin(0) = sin(π) = 0)
    float pulseCycles = max(0.5, floor(uAnimSpeed * 2.0 + 0.5) * 0.5);
    float pulseProgress = progress * pulseCycles;

    // Geometric pulsing animation - uses sin for perfect loop
    // Phase offset must be multiple of PI for half-cycle compatibility
    pulse = sin(pulseProgress * TWO_PI) * 0.3 + 0.7;
    pulse2 = sin(pulseProgress * TWO_PI + PI) * 0.3 + 0.7;

    // Optional looping noise layer - needs FULL integer cycles
    if (uNoiseAmount > 0.0) {
      float noiseCycles = max(1.0, floor(uAnimSpeed * 2.0 + 0.5));
      float noiseProgress = fract(progress * noiseCycles);
      noise1 = loopingNoise((uv - center) * 4.0, noiseProgress, 1.0) * 0.5 + 0.5;
      noise2 = loopingNoise((uv - center) * 4.0 + vec2(10.0), noiseProgress, 1.0) * 0.5 + 0.5;
    }
  } else {
    // Free-flowing mode (original, smoother animation)
    float time = uTime * uAnimSpeed;

    pulse = sin(time * 2.0) * 0.3 + 0.7;
    pulse2 = sin(time * 2.0 + 0.5) * 0.3 + 0.7;

    // Optional noise layer
    if (uNoiseAmount > 0.0) {
      noise1 = snoise2((uv - center) * 4.0 + time * 0.3) * 0.5 + 0.5;
      noise2 = snoise2((uv - center) * 4.0 + time * 0.3 + vec2(100.0)) * 0.5 + 0.5;
    }
  }

  // Base geometric pattern - radial gradient with pulse
  float pattern1 = 1.0 - dist * 1.2;
  pattern1 *= pulse;

  // Apply noise if enabled
  if (uNoiseAmount > 0.0) {
    pattern1 = mix(pattern1, pattern1 * noise1, uNoiseAmount);
  }

  pattern1 = clamp(pattern1, 0.0, 1.0);

  // Second pattern with offset for color separation
  vec2 offsetUv = uv + vec2(uColorOffset * 0.02);
  vec2 fromCenter2 = abs(offsetUv - center);
  float circularDist2 = length(fromCenter2);
  float squareDist2 = max(fromCenter2.x, fromCenter2.y);
  float dist2 = mix(squareDist2, circularDist2, uEdgeRoundness);

  float pattern2 = 1.0 - dist2 * 1.2;
  pattern2 *= pulse2;

  // Apply noise if enabled
  if (uNoiseAmount > 0.0) {
    pattern2 = mix(pattern2, pattern2 * noise2, uNoiseAmount);
  }

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
