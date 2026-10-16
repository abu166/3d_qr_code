import type { IUniform, WebGLProgramParametersWithUniforms } from "three";
// Bound outgoing linear light before tone mapping; geometry and shadow detail remain physical.
// This keeps seasonal pigments from becoming scanner-bright under a studio key light.
export function shadeMosaic(
  shader: WebGLProgramParametersWithUniforms,
  morph: IUniform<number>,
) {
  shader.uniforms.uQrMorph = morph;
  shader.fragmentShader = "uniform float uQrMorph;\n" + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <opaque_fragment>",
    "float qrLuma = dot(outgoingLight, vec3(0.2126,0.7152,0.0722)); outgoingLight *= mix(1.0, min(1.0, 0.060 / max(qrLuma, 0.001)), uQrMorph);\n#include <opaque_fragment>",
  );
}
export function shadeStone(
  shader: WebGLProgramParametersWithUniforms,
  morph: IUniform<number>,
) {
  shader.uniforms.uQrMorph = morph;
  shader.fragmentShader = "uniform float uQrMorph;\n" + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <opaque_fragment>",
    "outgoingLight = mix(outgoingLight, max(outgoingLight, vec3(1.65, 1.62, 1.57)), uQrMorph);\n#include <opaque_fragment>",
  );
}
