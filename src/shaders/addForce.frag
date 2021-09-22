precision highp float;
precision highp sampler2D;

varying vec3 vUv;

uniform sampler2D velocity;
uniform vec4 mouse;

vec2 getForce(vec4 inputVec) {
    float d = distance(vUv.xy, inputVec.xy) / .3;
    float strength = 1.0 / max(d * d, 0.01);
    strength *= clamp(dot(normalize(vUv.xy - inputVec.xy), normalize(inputVec.zw)), 0.0, 1.0);
    return strength * inputVec.zw * .3;
}

void main() {
    vec4 force;
    force.xy = getForce(mouse);
    gl_FragColor = texture2D(velocity,vUv.xy)+force;
    //gl_FragColor = vec4(1.);
}