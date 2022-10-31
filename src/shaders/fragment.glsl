# version 300 es
precision highp float;

uniform float u_Width;
uniform float u_Height;
uniform int u_PointCount;
uniform vec2 u_Points[3];
uniform vec3 u_Colors[3];

out vec4 o_FragColor;

uint hash(uint ste);
float random(uint seed);
vec2 complexAdd(vec2 z1, vec2 z2);
vec2 complexMult(vec2 z1, vec2 z2);
vec2 complexMultScalar(vec2 z1, float x);
vec2 complexDiv(vec2 z1, vec2 z2);
float module(vec2 z);

void main() {
  vec2 z = vec2(3.0 * gl_FragCoord.x / u_Width - 1.5, 3.0 * gl_FragCoord.y / u_Height - 1.5);
  for(int i = 0; i < u_PointCount; i++) {
    float d = distance(z, u_Points[i]);
    if (d < 0.015 && d > 0.01) {
      o_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      return;
    }
  }
  vec3 color = vec3(0.0, 0.0, 0.0);
  float iterations[3] = float[3](0.0, 0.0, 0.0);
  for(int i = 0; i < 50; i++) {
    for(int j = 0; j < u_PointCount; j++) {
      iterations[j] += 0.3 * pow(module(z - u_Points[j]) * 0.1, 0.05) ;
      if (z == u_Points[j]) { //distance(z, u_Points[j]) < 0.01//
        color = u_Colors[j] / iterations[j] + 0.1; // iterations[j]
        o_FragColor = vec4(color, 1.0);
        return;
      }
    }
    vec2 zsq = complexMult(z, z);
    vec2 zcu = complexMult(zsq, z);
    vec2 z1 = u_Points[0];
    vec2 z2 = u_Points[1];
    vec2 z3 = u_Points[2];
    vec2 pp = 3.0 * zsq - 2.0 * complexMult(z, (z1 + z2 + z3)) + complexMult(z1, z2) + complexMult(z1, z3) + complexMult(z3, z2);
    vec2 p = complexMult(z - z1, complexMult(z - z2, z - z3));
    z = z - complexDiv(p, pp);
  }
  o_FragColor = vec4(color, 1.0);
}

vec2 complexAdd(vec2 z1, vec2 z2) {
  return vec2(z1.x + z2.x, z1.y + z2.y);
}

vec2 complexMult(vec2 z1, vec2 z2) {
  return vec2(z1.x * z2.x - z1.y * z2.y, z2.x * z1.y + z1.x * z2.y);
}

vec2 complexDiv(vec2 z1, vec2 z2) {
  float z2n = module(z2);
  return vec2((z1.x * z2.x + z1.y * z2.y) / z2n, (z2.x * z1.y - z1.x * z2.y) / z2n);
}

float module(vec2 z) {
  return z.x * z.x + z.y * z.y;
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
