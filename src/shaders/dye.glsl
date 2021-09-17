precision highp float;
precision highp sampler2D;

varying vec3 vUv;
varying vec2 tUv;

uniform sampler2D prev;
uniform vec4 mouse;
uniform float dt;
uniform float rdx;
uniform float time;

vec2 getColor(vec4 inputVec) {
          float d = distance(vUv.xy, inputVec.xy) / .3;
          float strength = 1.0 / max(d * d, 0.01);
          strength *= clamp(dot(normalize(vUv.xy - inputVec.xy), normalize(inputVec.zw)), 0.0, 1.0);
          return strength * abs(inputVec.zw) * .3;
}

void main() {
    //float pct = smoothstep(distance(vUv.xy,vec2(mouse)),2.,.1)*20.;
    //vec4 mouse = vec4(pct,0,pct,1.);
    vec4 color;
    color.xy = getColor(mouse);

    gl_FragColor = color+texture2D(prev,vUv.xy);
}