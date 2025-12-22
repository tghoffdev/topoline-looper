precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uLineCount;
uniform float uLineThickness;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uDistortion;
uniform vec3 uLineColor;
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

// Fractional Brownian Motion
float fbm(vec2 p, float time) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency + time * 0.1 * float(i + 1));
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

  // Create animated noise-based displacement
  float time = uTime * uNoiseSpeed;
  vec2 noiseCoord = (uv - center) * uNoiseScale;

  // Multiple noise layers for organic feel
  float noise1 = fbm(noiseCoord, time);
  float noise2 = fbm(noiseCoord * 1.5 + 100.0, time * 0.7);

  // Combine distance with noise for height field
  float height = dist * 2.0 + noise1 * uDistortion + noise2 * uDistortion * 0.5;

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
