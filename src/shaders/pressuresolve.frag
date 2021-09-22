precision highp float;
precision highp int;

varying vec3 vUv;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform float dx;
uniform float rdx;
uniform float dt;

void main() {
    float alpha = -1.0;
    float rBeta = 0.25;

    vec4 L = texture2D(pressure, vUv.xy - vec2(rdx,0));
    vec4 R = texture2D(pressure, vUv.xy + vec2(rdx,0));
    vec4 B = texture2D(pressure, vUv.xy - vec2(0,rdx));
    vec4 T = texture2D(pressure, vUv.xy + vec2(0,rdx));
    
    vec4 C = texture2D(divergence, vUv.xy);

    gl_FragColor = (L+R+B+T+alpha*C)*rBeta;
}