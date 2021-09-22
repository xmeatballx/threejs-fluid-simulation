precision highp float;
precision highp int;
varying vec3 vUv;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform float dx;
uniform float rdx;

void main() {
    float L = texture2D(pressure, vUv.xy - vec2(rdx,0)).x;
    float R = texture2D(pressure, vUv.xy + vec2(rdx,0)).x;
    float B = texture2D(pressure, vUv.xy - vec2(0,rdx)).x;
    float T = texture2D(pressure, vUv.xy + vec2(0,rdx)).x;
    
    vec2 v = texture2D(velocity,vUv.xy).xy;
    v.xy -= .6 * vec2(R-L,T-B);

    gl_FragColor = vec4( v,0.,1.);
}