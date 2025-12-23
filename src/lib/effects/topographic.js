import * as THREE from 'three';
import vertexShader from '../shaders/topographic.vert?raw';
import fragmentShader from '../shaders/topographic.frag?raw';

export class TopographicEffect {
  constructor() {
    this.params = {
      mode: 'amoeba',
      lineCount: 20,
      lineThickness: 0.03,
      noiseScale: 2.0,
      noiseSpeed: 0.3,
      loopDuration: 3.0,
      seamless: false,
      distortion: 0.4,
      lineColor: '#5c5ccd',
      backgroundColor: '#f5d6c6',
      transparent: false
    };

    this.uniforms = {
      uTime: { value: 0 },
      uMode: { value: 0.0 },
      uLineCount: { value: this.params.lineCount },
      uLineThickness: { value: this.params.lineThickness },
      uNoiseScale: { value: this.params.noiseScale },
      uNoiseSpeed: { value: this.params.noiseSpeed },
      uLoopDuration: { value: this.params.loopDuration },
      uSeamless: { value: 0.0 },
      uDistortion: { value: this.params.distortion },
      uLineColor: { value: new THREE.Color(this.params.lineColor) },
      uBackgroundColor: { value: new THREE.Color(this.params.backgroundColor) },
      uTransparent: { value: 0.0 }
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true
    });
  }

  update(time) {
    this.uniforms.uTime.value = time;
  }

  updateParams() {
    this.uniforms.uMode.value = this.params.mode === 'concentric' ? 1.0 : 0.0;
    this.uniforms.uLineCount.value = this.params.lineCount;
    this.uniforms.uLineThickness.value = this.params.lineThickness;
    this.uniforms.uNoiseScale.value = this.params.noiseScale;
    this.uniforms.uNoiseSpeed.value = this.params.noiseSpeed;
    this.uniforms.uLoopDuration.value = this.params.loopDuration;
    this.uniforms.uSeamless.value = this.params.seamless ? 1.0 : 0.0;
    this.uniforms.uDistortion.value = this.params.distortion;
    this.uniforms.uLineColor.value.set(this.params.lineColor);
    this.uniforms.uBackgroundColor.value.set(this.params.backgroundColor);
    this.uniforms.uTransparent.value = this.params.transparent ? 1.0 : 0.0;
  }

  dispose() {
    this.material.dispose();
  }
}
