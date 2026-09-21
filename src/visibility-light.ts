import * as THREE from 'three';

// The fully visible core is preserved. Only the additional world-space band
// fades out, so its width scales with the terrain when zooming.
const edgeGLSL = `
  float radialDistance = length(vVisibilityPosition.xz - visibilityFocus);
  float edge = clamp((radialDistance - visibilityRadius) / visibilityFeatherWidth, 0.0, 1.0);
`;

export class VisibilityLight {
  uniforms = {
    visibilityFocus: { value: new THREE.Vector2() },
    visibilityRadius: { value: 48 },
    visibilityFeatherWidth: { value: 1 },
    visibilityBackground: { value: new THREE.Color('#dfecc2') },
  };

  apply(material: THREE.MeshLambertMaterial) {
    // Keep depth testing/writes and opaque rendering: alpha blending individual
    // voxel faces exposes the hidden faces behind them and creates dark grids.
    material.transparent = false;
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = `varying vec3 vVisibilityPosition;\n${shader.vertexShader}`.replace(
        '#include <project_vertex>', `
        vec4 visibilityPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          visibilityPosition = instanceMatrix * visibilityPosition;
        #endif
        vVisibilityPosition = (modelMatrix * visibilityPosition).xyz;
        #include <project_vertex>`);
      shader.fragmentShader = `
        varying vec3 vVisibilityPosition;
        uniform vec2 visibilityFocus;
        uniform float visibilityRadius;
        uniform float visibilityFeatherWidth;
        uniform vec3 visibilityBackground;
        ${shader.fragmentShader}`.replace('#include <opaque_fragment>', `
        ${edgeGLSL}
        float fade = smoothstep(0.0, 1.0, edge);
        if (edge >= 1.0) discard;
        outgoingLight = mix(outgoingLight * (1.0 - 0.12 * fade), visibilityBackground, fade);
        #include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => 'visibility-light-v3';
  }

}
