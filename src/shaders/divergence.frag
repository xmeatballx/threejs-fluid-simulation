precision highp float;
precision highp int;
varying vec3 vUv;
uniform sampler2D velocity;
uniform float rdx;
uniform float halfrdx;

void main(){

    vec4 L = texture2D(velocity, vUv.xy - vec2(rdx,0));
    vec4 R = texture2D(velocity, vUv.xy + vec2(rdx,0));
    vec4 T = texture2D(velocity, vUv.xy + vec2(0,rdx));
    vec4 B = texture2D(velocity, vUv.xy - vec2(0,rdx));

    float divergence = (R.x-L.x + T.y-B.y)*1.;

    gl_FragColor = vec4(divergence);
}