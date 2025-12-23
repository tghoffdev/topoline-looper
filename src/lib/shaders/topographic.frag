precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uMode;
uniform float uLineCount;
uniform float uLineThickness;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uLoopDuration;
uniform float uSeamless;
uniform float uDistortion;
uniform vec3 uLineColor;
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

// Looping FBM using the looping noise
float loopingFbm(vec2 p, float progress) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 4; i++) {
    value += amplitude * loopingNoise(p * frequency, progress, 1.0 + float(i) * 0.5);
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

// Regular FBM (for non-seamless mode)
float fbm(vec2 p, float time) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise2(p * frequency + time * 0.1 * float(i + 1));
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5);

  // Distance from center for radial effect
  float dist = length(uv - center);

  float time = uTime * uNoiseSpeed;
  vec2 noiseCoord = (uv - center) * uNoiseScale;

  float height;
  float noise1, noise2;

  if (uSeamless > 0.5) {
    // Seamless looping mode
    float progress = fract(uTime / uLoopDuration);
    // Noise needs FULL integer cycles to loop (sin+cos circle)
    float noiseCycles = max(1.0, floor(uNoiseSpeed * 2.0 + 0.5));
    float noiseProgress = fract(progress * noiseCycles);

    noise1 = loopingFbm(noiseCoord, noiseProgress);
    noise2 = loopingFbm(noiseCoord * 1.5 + vec2(10.0), noiseProgress);

    if (uMode < 0.5) {
      // Amoeba mode
      height = dist * 2.0 + noise1 * uDistortion + noise2 * uDistortion * 0.5;
    } else {
      // Concentric mode - rings move by integer amount for seamless loop
      // Very gentle speed scaling: 1, 2, 3... rings per loop
      float ringSpeed = max(1.0, floor(uNoiseSpeed * 1.5 + 0.5));
      // Reduce noise impact in seamless concentric mode to keep rings clean
      float reducedDistortion = uDistortion * 0.25;
      height = dist * 2.0 - progress * ringSpeed / uLineCount + noise1 * reducedDistortion + noise2 * reducedDistortion * 0.3;
    }
  } else {
    // Free-flowing mode (original, smoother animation)
    noise1 = fbm(noiseCoord, time);
    noise2 = fbm(noiseCoord * 1.5 + 100.0, time * 0.7);

    if (uMode < 0.5) {
      // Amoeba mode
      height = dist * 2.0 + noise1 * uDistortion + noise2 * uDistortion * 0.5;
    } else {
      // Concentric mode - gentler speed
      height = dist * 2.0 - time * 0.15 + noise1 * uDistortion + noise2 * uDistortion * 0.3;
    }
  }

  // Create contour lines
  float contours = fract(height * uLineCount);

  // Anti-aliased line using smoothstep and fwidth
  float fw = fwidth(height * uLineCount) * 1.5;
  float lineWidth = uLineThickness;

  float line = smoothstep(lineWidth - fw, lineWidth, contours) *
               smoothstep(lineWidth + fw + lineWidth, lineWidth + fw, contours);

  // Fade out at edges for organic boundary
  float edgeFade = 1.0 - smoothstep(0.35, 0.5, dist);
  line *= edgeFade;

  // Mix colors
  vec3 color = mix(uBackgroundColor, uLineColor, line);

  // Alpha: fully opaque for lines, transparent for background if enabled
  float alpha = uTransparent > 0.5 ? line : 1.0;

  gl_FragColor = vec4(color, alpha);
}
