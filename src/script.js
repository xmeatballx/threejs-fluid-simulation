import './style.css'
import * as THREE from 'three'
// import { WEBGL } from './three/examples/jsm/WebGL.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import sprite from "./spite2.jpg"
import velocity from "./initvelocity.png"
import vertex from "./shaders/vertex.glsl"
import advect from "./shaders/advect.glsl"
import div from "./shaders/divergence.frag"
import pressure from "./shaders/pressuresolve.frag"
import pGradSub from "./shaders/pgradsub.frag"
import addForce from "./shaders/addForce.frag"
import dye from "./shaders/dye.glsl"
import boundary from "./shaders/boundary.frag"
import colorAdvect from "./shaders/advectColor.frag"
import { HalfFloatType, Material, RGBAFormat, RGBFormat, ShaderMaterial } from 'three'
import glsl from 'glslify';
import Stats from 'stats.js';

// Debug
//const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Sizes
 const sizes = {
    width: window.innerHeight,
    height: window.innerHeight
}

// Load textures and pass them to main program
const spriteTex = new THREE.TextureLoader().load(sprite, (s) => {
    const velTex = new THREE.TextureLoader().load(velocity, (v) => {
        run(s, v);
    })
})

function run(s, v) {
    const pointer = new THREE.Vector2();
    document.addEventListener( 'pointermove', (e) => {
        pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
    });

    // Scene
    const advectScene = new THREE.Scene();
    const divergenceScene = new THREE.Scene();
    const pressureSolveScene = new THREE.Scene();
    const pGradSubtractScene = new THREE.Scene();
    const dyeScene = new THREE.Scene();
    const colorScene = new THREE.Scene();
    const addForceScene = new THREE.Scene();
    const boundaryScene = new THREE.Scene();

    // Objects
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array( [
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
    
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0, -1.0,  1.0
    ] );
    
    // itemSize = 3 because there are 3 values (components) per vertex
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    const rtOpts = {
        format: RGBAFormat,
        type: HalfFloatType 
    }
    let velocityRenderTarget = new THREE.WebGLRenderTarget(sizes.width,sizes.height, rtOpts);
    let colorRenderTarget = new THREE.WebGLRenderTarget(sizes.width,sizes.height, rtOpts)
    let colorFbRenderTarget = new THREE.WebGLRenderTarget(sizes.width,sizes.height, rtOpts)

    let pressureRenderTarget = new THREE.WebGLRenderTarget(sizes.width,sizes.height, rtOpts)
    let pressureFbRenderTarget = new THREE.WebGLRenderTarget(sizes.width,sizes.height, rtOpts)
    let pGradSubRenderTarget = new THREE.WebGLRenderTarget(sizes.width,sizes.height,rtOpts)
    const addForceRenderTarget = new THREE.WebGLRenderTarget(sizes.width,sizes.height,rtOpts)
    const divergenceRenderTarget = new THREE.WebGLRenderTarget(sizes.width,sizes.height,rtOpts)
    const dyeRenderTarget = new THREE.WebGLRenderTarget(sizes.width,sizes.height, rtOpts)
    const boundaryRenderTarget = new THREE.WebGLRenderTarget(sizes.width,sizes.height, rtOpts)
    
    let gridScale = 500;
    let rdx = 1/gridScale;
    let dt = 1/15;
    const advectMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0},
            dt: { value: dt },
            rdx: { value: rdx },
            density: { value: v},
            velocity: { value: v},
            mouse: { value: new THREE.Vector2(0,0)},
            dissipation: { value: null}
    
        },
        vertexShader: glsl(vertex),
    
        fragmentShader: glsl(advect),
        depthTest: false,
        depthWrite: false 
    })

    const colorMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0},
            dt: { value: dt },
            rdx: { value: rdx },
            density: { value: null},
            velocity: { value: v},
            mouse: { value: new THREE.Vector2(0,0)},
            dissipation: { value: null}
    
        },
        vertexShader: glsl(vertex),
    
        fragmentShader: glsl(colorAdvect),
        depthTest: false,
        depthWrite: false 
    })

    const divergenceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            rdx: { value: rdx },
            halfrdx: { value: rdx/2 },
            velocity: { value: null },
        },
        vertexShader: glsl(vertex),
        fragmentShader: glsl(div),
        depthTest: false,
        depthWrite: false
    })

    const pressureMaterial = new THREE.ShaderMaterial({
        uniforms: {
            rdx: { value: rdx },
            dx: { value: gridScale },
            dt: { value: dt},
            pressure: { value: null},
            divergence: { value: null},
        },
        vertexShader: glsl(vertex),
        fragmentShader: glsl(pressure),
        depthTest: false,
        depthWrite: false
    })

    const pGradSubMaterial = new ShaderMaterial({
        uniforms: {
            rdx: { value: rdx },
            pressure: { value: null },
            velocity: { value: null }
        },
        vertexShader: glsl(vertex),
        fragmentShader: glsl(pGradSub),
        depthTest: false,
        depthWrite: false
    })

    const dyeMaterial = new THREE.ShaderMaterial({
        uniforms: {
    
            prev: {value: null},
            mouse: {value: null}
    
        },
        vertexShader: glsl(vertex),
    
        fragmentShader: glsl(dye),
        depthTest: false,
        depthWrite: false 
    })

    const addForceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            velocity: { value: v },
            mouse: { value: null}
        },
        vertexShader: glsl(vertex),
        fragmentShader: glsl(addForce)
    })

    const boundaryMaterial = new THREE.ShaderMaterial({
        uniforms: {
            velocity: { value: v },
            rdx: rdx
        },
        vertexShader: glsl(vertex),
        fragmentShader: glsl(boundary)
    })
    
    // Mesh
    const advectQuad = new THREE.Mesh( geometry, advectMaterial );
    advectScene.add(advectQuad);

    const divergenceQuad = new THREE.Mesh( geometry, divergenceMaterial );
    divergenceScene.add(divergenceQuad);

    const pressureQuad = new THREE.Mesh( geometry, pressureMaterial )
    pressureSolveScene.add(pressureQuad)

    const pGradQuad = new THREE.Mesh( geometry, pGradSubMaterial)
    pGradSubtractScene.add(pGradQuad)

    const dyeQuad = new THREE.Mesh( geometry, dyeMaterial)
    dyeScene.add(dyeQuad)

    const colorQuad = new THREE.Mesh( geometry, colorMaterial)
    colorScene.add(colorQuad)

    const addForceQuad = new THREE.Mesh( geometry, addForceMaterial )
    addForceScene.add(addForceQuad)

    const boundaryQuad = new THREE.Mesh( geometry, boundaryMaterial)
    boundaryScene.add(boundaryQuad)
    /**
     * Camera
     */
    // Base camera
    const advectCamera = new THREE.OrthographicCamera(-sizes.width / 2, sizes.width / 2, sizes.height / 2, sizes.height / 2, 2, 1, 10)
    advectCamera.position.x = 0
    advectCamera.position.y = 0
    advectCamera.position.z = 1
    advectScene.add(advectCamera)
    const colorCamera = advectCamera.clone();
    colorScene.add(colorCamera)
    const divergenceCamera = advectCamera.clone()
    divergenceScene.add(divergenceCamera)
    const pressureCamera = advectCamera.clone()
    pressureSolveScene.add(pressureCamera)
    const pGradSubCamera = advectCamera.clone()
    pGradSubtractScene.add(pGradSubCamera)
    const dyeCamera = advectCamera.clone()
    dyeScene.add(dyeCamera)
    const addForceCamera = advectCamera.clone()
    addForceScene.add(addForceCamera)
    const boundaryCamera = advectCamera.clone();
    boundaryScene.add(boundaryCamera);

    /**
     * Renderer
     */
     const renderer = new THREE.WebGLRenderer({
        canvas: canvas
    })

    renderer.setSize(sizes.height, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    /**
     * Animate
     */
    
    const clock = new THREE.Clock()

    let mouse = new THREE.Vector4(0.5,0.5,0.5,0.5);

    let inputTouches = [];
    canvas.addEventListener("mousedown", (event) => {
    if (event.button === 0) {
        const x = (event.clientX / canvas.clientWidth)-.5;
        const y = 1.0 - (event.clientY + window.scrollY) / canvas.clientHeight;
        inputTouches.push({
        id: "mouse",
        input: new THREE.Vector4(x, y, 0, 0)
        });
    }
    });

    document.addEventListener('mousemove', (event) => {
        if (inputTouches.length > 0) {
            const x = (event.clientX / canvas.clientWidth)-.5;
            const y = 1.0 - (event.clientY + window.scrollY) / canvas.clientHeight;
            inputTouches[0].input
              .setZ(x - inputTouches[0].input.x)
              .setW(y - inputTouches[0].input.y);
            inputTouches[0].input.setX(x).setY(y);
            mouse = inputTouches[0].input;
          }
    }, false);

    canvas.addEventListener("mouseup", (event) => {
        if (event.button === 0) {
          inputTouches.pop();
        }
      });

    const stats = new Stats();
    stats.showPanel( 0 );
    document.body.appendChild( stats.dom ) 
    

    let c, p;
    const tick = () =>
    {
        stats.begin();
        const elapsedTime = clock.getElapsedTime()
        // dt += 10000;
        
        // Render
        // console.log(inputTouches.length);
        // advectMaterial.uniforms.time.value = elapsedTime*2.;
        advectMaterial.uniforms.dissipation.value = .99;
        advectMaterial.uniforms.dt.value = dt;
        advectMaterial.uniforms.mouse.value = mouse;
        renderer.setRenderTarget(velocityRenderTarget);
        renderer.render(advectScene, advectCamera);
        v = velocityRenderTarget.texture;

        if (inputTouches.length>0){
            addForceMaterial.uniforms.velocity.value = v;
            addForceMaterial.uniforms.mouse.value = mouse;
            renderer.setRenderTarget(addForceRenderTarget)
            renderer.render(addForceScene, addForceCamera)

            v = addForceRenderTarget.texture;

        dyeMaterial.uniforms.prev.value = c;
        dyeMaterial.uniforms.mouse.value = mouse;
        renderer.setRenderTarget(dyeRenderTarget);
        renderer.render(dyeScene, dyeCamera);
        c = dyeRenderTarget.texture;
        }

        boundaryMaterial.uniforms.velocity.value = v;
        renderer.setRenderTarget(boundaryRenderTarget);
        renderer.render(boundaryScene,boundaryCamera)
        v = boundaryRenderTarget.texture

        divergenceMaterial.uniforms.velocity.value = v;
        renderer.setRenderTarget(divergenceRenderTarget);
        renderer.render(divergenceScene, divergenceCamera);

        pressureMaterial.uniforms.dt.value = dt;
        pressureMaterial.uniforms.divergence.value = divergenceRenderTarget.texture;
        for (let i=0; i<40;++i){
            p = pressureRenderTarget.texture;
            renderer.setRenderTarget(pressureRenderTarget)
            renderer.render(pressureSolveScene, pressureCamera)
            pressureMaterial.uniforms.pressure.value = p
            
            let temp = pressureRenderTarget;
            pressureRenderTarget = pressureFbRenderTarget;
            pressureFbRenderTarget = temp;
        }

        pGradSubMaterial.uniforms.pressure.value = p
        pGradSubMaterial.uniforms.velocity.value = v
        renderer.setRenderTarget(pGradSubRenderTarget);
        renderer.render(pGradSubtractScene, pGradSubCamera);

        v = pGradSubRenderTarget.texture;

        colorMaterial.uniforms.dissipation.value = .99;
        colorMaterial.uniforms.velocity.value = v;
        colorMaterial.uniforms.density.value = c;
        renderer.setRenderTarget(colorRenderTarget);
        renderer.render(colorScene,colorCamera);
        c = colorRenderTarget.texture;
        

        let temp = colorRenderTarget;
        colorRenderTarget = colorFbRenderTarget;
        colorFbRenderTarget = temp;

        // colorMaterial.uniforms.density.value = c;

        advectMaterial.uniforms.velocity.value = v
        advectMaterial.uniforms.density.value = v;

        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(colorScene, colorCamera)

        stats.end();
        // finalRt = colorFbRenderTarget.texture;

        // renderer.setRenderTarget(null);
        // renderer.clear();


        // v = pGradSubRenderTarget.texture;

        // Call tick again on the next frame
        window.requestAnimationFrame(tick)
    }
    
    tick()

    window.addEventListener('resize', () =>
    {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        // Update camera
        // camera.aspect = sizes.width / sizes.height
        // camera.updateProjectionMatrix()

        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })
}