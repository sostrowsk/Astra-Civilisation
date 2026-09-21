import * as THREE from 'three';

export const VISIBILITY_FEATHER_PX = 3;

// Derivatives measure radial distance per framebuffer pixel, independent of zoom
// and camera angle. Scale by DPR so the feather is always three CSS pixels.
const edgeGLSL = `
  float radialDistance = length(vVisibilityPosition.xz - visibilityFocus);
  float worldPerPixel = max(length(vec2(dFdx(radialDistance), dFdy(radialDistance))), 0.00001);
  float edge = clamp((radialDistance - visibilityRadius) / (worldPerPixel * visibilityPixels), 0.0, 1.0);
`;

export class VisibilityLight {
  uniforms = {
    visibilityFocus: { value: new THREE.Vector2() },
    visibilityRadius: { value: 48 },
    visibilityPixels: { value: VISIBILITY_FEATHER_PX },
  };

  apply(material: THREE.MeshLambertMaterial) {
    material.transparent = true;
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
        uniform float visibilityPixels;
        ${shader.fragmentShader}`.replace('#include <opaque_fragment>', `
        ${edgeGLSL}
        float visibility = 1.0 - smoothstep(0.0, 1.0, edge);
        if (visibility <= 0.0) discard;
        outgoingLight *= 1.0 - 0.65 * edge;
        diffuseColor.a *= visibility;
        #include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => 'visibility-light-v1';
  }

  createHalo() {
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true, depthWrite: false,
      vertexShader: `
        varying vec3 vVisibilityPosition;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vVisibilityPosition = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }`,
      fragmentShader: `
        varying vec3 vVisibilityPosition;
        uniform vec2 visibilityFocus;
        uniform float visibilityRadius;
        uniform float visibilityPixels;
        void main() {
          ${edgeGLSL}
          if (radialDistance < visibilityRadius || edge >= 1.0) discard;
          gl_FragColor = vec4(1.0, 0.94, 0.7, 0.2 * (1.0 - smoothstep(0.0, 1.0, edge)));
          #include <colorspace_fragment>
        }`,
    });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), material);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -.54;
    return halo;
  }
}
