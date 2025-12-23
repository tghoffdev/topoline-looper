import * as THREE from 'three';
import vertexShader from '../shaders/halftone.vert?raw';
import fragmentShader from '../shaders/halftone.frag?raw';

export class HalftoneEffect {
  constructor() {
    this.params = {
      gridSize: 60,
      dotSize: 0.35,
      animSpeed: 0.5,
      loopDuration: 3.0,
      seamless: false,
      colorOffset: 1.0,
      noiseAmount: 0.0,
      edgeRoundness: 1.0,
      color1: '#4169e1',
      color2: '#dc143c',
      backgroundColor: '#b8b8c8',
      transparent: false
    };

    this.uniforms = {
      uTime: { value: 0 },
      uGridSize: { value: this.params.gridSize },
      uDotSize: { value: this.params.dotSize },
      uAnimSpeed: { value: this.params.animSpeed },
      uLoopDuration: { value: this.params.loopDuration },
      uSeamless: { value: 0.0 },
      uColorOffset: { value: this.params.colorOffset },
      uNoiseAmount: { value: this.params.noiseAmount },
      uEdgeRoundness: { value: this.params.edgeRoundness },
      uColor1: { value: new THREE.Color(this.params.color1) },
      uColor2: { value: new THREE.Color(this.params.color2) },
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
    this.uniforms.uGridSize.value = this.params.gridSize;
    this.uniforms.uDotSize.value = this.params.dotSize;
    this.uniforms.uAnimSpeed.value = this.params.animSpeed;
    this.uniforms.uLoopDuration.value = this.params.loopDuration;
    this.uniforms.uSeamless.value = this.params.seamless ? 1.0 : 0.0;
    this.uniforms.uColorOffset.value = this.params.colorOffset;
    this.uniforms.uNoiseAmount.value = this.params.noiseAmount;
    this.uniforms.uEdgeRoundness.value = this.params.edgeRoundness;
    this.uniforms.uColor1.value.set(this.params.color1);
    this.uniforms.uColor2.value.set(this.params.color2);
    this.uniforms.uBackgroundColor.value.set(this.params.backgroundColor);
    this.uniforms.uTransparent.value = this.params.transparent ? 1.0 : 0.0;
  }

  dispose() {
    this.material.dispose();
  }
}
