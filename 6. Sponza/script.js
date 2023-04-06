import * as THREE from "three";
import Stats from "statssrc";
import { GLTFLoader } from "gltfsrc";
//import { OrbitControls } from "orbitsrc";
import { FirstPersonControls } from "fpssrc";
import { EffectComposer } from "fxcompsrc";
import { RenderPass } from "renderpasssrc";
import { SSAOPass  } from "ssaopasssrc";

let scene, camera, renderer, canvas, controls, clock, model, stats, container;
let composer, renderPass;
const statsEnabled = true;

function init() {

    //LOADING SCREEN
    const loadingManager = new THREE.LoadingManager(() => {
        const loadingScreen = document.getElementById("loading-screen");
        loadingScreen.classList.add("fade-out");
        loadingScreen.addEventListener("transitionend", onTransitionEnd);
    });

    function onTransitionEnd(event) {
        event.target.remove();
    }

    container = document.createElement('div');
    document.body.appendChild( container );

    // CLOCK 
    const clock = new THREE.Clock();

    // CANVAS
    canvas = document.querySelector("#canvas");

    // RENDERER
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio ); // GOOD RESOLUTION BUT BAD IN PHONES !!! NOT RECOMMENDED
    renderer.setSize( window.innerWidth, window.innerHeight );   
    renderer.shadowMap.enabled = true;  
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;        
    renderer.outputEncoding = THREE.sRGBEncoding;

    container.appendChild( renderer.domElement );

    // SCENE
    scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xdddddd);
    scene.fog = new THREE.Fog( scene.background, 1, 5000 );

    // CAMERA
    const fov    = 50;
    const aspect = window.innerWidth / window.innerHeight;
    const near   = 0.1;
    const far    = 5000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(7, 3, 0);
    controls = new FirstPersonControls( camera, renderer.domElement );
    controls.movementSpeed = 10;
    controls.lookSpeed = 0.25;

    // AMBIENT LIGHT
    const hemiLight = new THREE.HemisphereLight( 0xffeeb1, 0x080820, 0.8 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 50, 0 );
    scene.add( hemiLight );

    // DIRECTIONAL LIGHT
    const colorLight = 0xffffff;
    const intensity = 2;
    const light = new THREE.DirectionalLight(colorLight, intensity);

    // LIGHT SHADOWS
    light.castShadow = true;
    const d = 15;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;
    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 200    
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;

    // LIGHT POST PROCESSING
    light.color.setHSL( 0.1, 1, 0.95 );
    light.position.set( - 1, 1.75, 1 );
    light.position.multiplyScalar( 30 );
    light.position.set(0, 25, 0);
    scene.add(light);
    light.target.name = 'light.target';
    light.target.position.set( 0, 0, 0);

    // SKYBOX    
    const vertexShader = document.getElementById( 'vertexShader' ).textContent;
    const fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
    const uniforms = {
        'topColor': { value: new THREE.Color( 0x0077ff ) },
        'bottomColor': { value: new THREE.Color( 0xffffff ) },
        'offset': { value: 33 },
        'exponent': { value: 0.6 }
    };
    uniforms[ 'topColor' ].value.copy( hemiLight.color );

    scene.fog.color.copy( uniforms[ 'bottomColor' ].value );

    const skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
    const skyMat = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    } );

    const sky = new THREE.Mesh( skyGeo, skyMat );
    scene.add( sky );

    // POST PROCESSING
    composer = new EffectComposer( renderer );
    const ssaoPass = new SSAOPass( scene, camera, window.innerWidth, window.innerHeight );
    ssaoPass.kernelRadius = 16;
    composer.addPass( ssaoPass );
    ssaoPass.output = SSAOPass.OUTPUT.Default;

    // 'Default': SSAOPass.OUTPUT.Default,
    // 'SSAO Only': SSAOPass.OUTPUT.SSAO,
    // 'SSAO Only + Blur': SSAOPass.OUTPUT.Blur,
    // 'Beauty': SSAOPass.OUTPUT.Beauty,
    // 'Depth': SSAOPass.OUTPUT.Depth,
    // 'Normal': SSAOPass.OUTPUT.Normal

//  ======================================= SCENE =============================

    // DEFINING A CUBE
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
    const cube1 = new THREE.Mesh(boxGeometry, boxMaterial);
    cube1.position.y = 2.5
    cube1.castShadow = true;
    scene.add(cube1);

    // ADDING DEBUG PLANE 😱
    const mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0xCCCCCC, depthWrite: true } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const grid = new THREE.GridHelper( 100, 100, 0x000000, 0x000000 );
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scene.add(grid);


    // LOADING SPONZA
    const loader = new GLTFLoader(loadingManager);
    loader.load( './Sponza/glTF/Sponza.gltf',  result => {

        model = result.scene.children[0]; 
        model.position.set(-1,1,0.25);
        model.traverse(n => { if ( n.isMesh ) {
          n.castShadow = true; 
          n.receiveShadow = true;
          n.material.transparent = false;
          if(n.material.map) n.material.map.anisotropy = 1; 
        }});

        scene.add(model);


        }, undefined, 
    
        function( error ) { console.error( error ) });

    if( statsEnabled ) {

        stats = new Stats();
        container.appendChild( stats.dom );

    }

    // RENDERING THE SCENE
    function render(time) {

        requestAnimationFrame( render );

        // ROTATING THE CUBE
        cube1.rotation.x = time * 0.0008;
        cube1.rotation.y = time * 0.0008;

        // UPDATING THE CAMERA CONTROLS
        //controls.update( clock.getDelta() ); 
        camera.lookAt(0, 2, 0);

        if ( statsEnabled ) stats.update();

        // RENDERING FUNCTION LOOP
        //renderer.render( scene, camera );         // NORMAL RENDERING
        composer.render();                          // RENDERING WITH POST PROCESSING

    }       
    
    // CHECK FOR CHANGES ON WINDOW SIZE
    window.onresize = function () {

        const width = window.innerWidth;
        const height = window.innerHeight;
    
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    
        renderer.setSize( width, height );
        composer.setSize( width, height );
    
        // bloomComposer.setSize( width, height );
        // finalComposer.setSize( width, height );
    
        render();
    
    };
    
    render();

}

init();
