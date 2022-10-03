# version 300 es
precision highp float;

uniform float u_Width;
uniform float u_Height;

out vec4 o_FragColor;

uint hash(uint ste);
float random(uint seed);

void main() {
  uint seed = uint(3.0 * (gl_FragCoord.x + gl_FragCoord.y * u_Width));
  o_FragColor =  vec4(random(seed + uint(1)), random(seed + uint(2)), random(seed + uint(3)), 1.0);
}

uint hash(uint ste) {
  ste ^= 2747636419u;
  ste *= 2654435769u;
  ste ^= ste >> 16;
  ste *= 2654435769u;
  ste ^= ste >> 16;
  ste *= 2654435769u;
  return ste;
}

float random(uint seed) {
  return float(hash(seed)) / 4294967295.0;
}
