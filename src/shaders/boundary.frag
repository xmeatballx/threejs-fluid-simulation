precision highp float;
precision highp int;
varying vec3 vUv;
uniform sampler2D velocity;
uniform float rdx;
void main() {
    float leftEdgeMask = ceil(rdx - vUv.x);
    float bottomEdgeMask = ceil(rdx - vUv.y);
    float rightEdgeMask = ceil(vUv.x - (1. - rdx));
    float topEdgeMask = ceil(vUv.y - (1. - rdx));
    float mask = clamp(leftEdgeMask + bottomEdgeMask + rightEdgeMask + topEdgeMask, 0.0, 1.0);
    float direction = mix(1.0, -1.0, mask);
    
    gl_FragColor = texture2D(velocity, vUv.xy) * direction;
}