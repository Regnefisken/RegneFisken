import { Color } from 'three';

/** Shader-objekt fra `Material.onBeforeCompile` (three eksporterer ikke en navngiven `Shader`-type). */
export type OnBeforeCompileShader = {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
};

/**
 * Injicerer bug/ryg-toning efter fladenormal i objekt-rum (Y+ ≈ ryg, Y− ≈ bug på standard krop).
 * Køres fra MeshPhysicalMaterial.onBeforeCompile; sæt defines.USE_BODY_HEMISPHERE_TINT.
 */
export function injectBodyHemisphereTintShader(shader: OnBeforeCompileShader): void {
  if (!shader.vertexShader.includes('vObjectNormal')) {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
varying vec3 vObjectNormal;`,
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <normal_vertex>',
      `#include <normal_vertex>
\tvObjectNormal = normalize( objectNormal );`,
    );
  }

  if (!shader.fragmentShader.includes('uBodyHemiVentral')) {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
varying vec3 vObjectNormal;
uniform vec3 uBodyHemiVentral;
uniform vec3 uBodyHemiDorsal;
uniform float uBodyHemiSoft;`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
#ifdef USE_BODY_HEMISPHERE_TINT
\tfloat bodyHemiW = smoothstep( -uBodyHemiSoft, uBodyHemiSoft, vObjectNormal.y );
\tvec3 bodyHemiTint = mix( uBodyHemiVentral, uBodyHemiDorsal, bodyHemiW );
\tdiffuseColor.rgb *= bodyHemiTint;
#endif`,
    );
  }

  shader.uniforms.uBodyHemiVentral = { value: new Color(0xffffff) };
  shader.uniforms.uBodyHemiDorsal = { value: new Color(0xffffff) };
  shader.uniforms.uBodyHemiSoft = { value: 0.18 };
}

export function syncBodyHemisphereTintUniforms(
  shader: OnBeforeCompileShader,
  ventral: number,
  dorsal: number,
  softness: number
): void {
  (shader.uniforms.uBodyHemiVentral!.value as Color).setHex(ventral);
  (shader.uniforms.uBodyHemiDorsal!.value as Color).setHex(dorsal);
  shader.uniforms.uBodyHemiSoft!.value = softness;
}
