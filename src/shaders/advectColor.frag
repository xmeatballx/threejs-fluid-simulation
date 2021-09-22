precision highp float;
precision highp sampler2D;

varying vec3 vUv;

uniform sampler2D velocity;
uniform sampler2D density;
uniform vec4 mouse;
uniform float dt;
uniform float rdx;
uniform float time;
uniform float dissipation;

vec2 bilerp(sampler2D tex, vec2 uv) {

    float i = fract(uv.x);
    float j = fract(uv.y);

    vec2 bl = texture2D(tex,vUv.xy - vec2(rdx,0)).xy;
    vec2 br = texture2D(tex,vUv.xy + vec2(rdx,0)).xy;
    vec2 tl = texture2D(tex,vUv.xy + vec2(0,rdx)).xy;
    vec2 tr = texture2D(tex,vUv.xy - vec2(0,rdx)).xy;

    vec2 z1 = mix(bl,br,i);
    vec2 z2 = mix(tl,tr,i);
    return mix(z1,z2,j);
}

void main() {
    vec2 pos = (vUv.xy - dt) * texture2D(velocity, vUv.xy).xy;

    gl_FragColor = vec4(bilerp(density,pos),0.,1.)*dissipation;
    //gl_FragColor = texture2D(velocity, vUv.xy);
    //gl_FragColor = vec4(pos,0.,1.);

    vec2 prevUV = fract(vUv.xy - dt * texture2D(velocity, vUv.xy).xy);
    vec4 c = texture2D(density, prevUV) * dissipation;
    c = vec4(vec3((c.x+c.y+c.z)/3.),1.);
    gl_FragColor = c;
}