import * as THREE from "three";
import Stats from "statssrc";
import { GLTFLoader } from "gltfsrc";
//import { OrbitControls } from "orbitsrc";
import { FirstPersonControls } from "fpssrc";
import { EffectComposer } from "fxcompsrc";
import { RenderPass } from "renderpasssrc";
import { SSAOPass  } from "ssaopasssrc";
import { FBXLoader } from "fbxsrc";

let scene, camera, renderer, canvas, controls, clock, model, stats, container;
let composer, renderPass;
let delta = 0;

let angle = 0;
let radius = 1.5;

const statsEnabled = false;
let btnPressed = false;

function init() {

    //LOADING SCREEN
    const loadingScreen = document.getElementById("loading-screen");        
    const loadingManager = new THREE.LoadingManager(() => {
        document.getElementById("startBtn").style.opacity = 1;
        WaitButton();
    });

    function WaitButton() {

        if (!btnPressed ) {
            setTimeout(WaitButton,2500);
            console.log("Pls press button...")
        } else {
            loadingScreen.classList.add("fade-out");
            loadingScreen.addEventListener("transitionend", onTransitionEnd);
            StartMusic();   
        }
        
    }

    document.getElementById("startBtn").onclick = function() {btnClicked()};
    function btnClicked() {
        btnPressed = !btnPressed;
        console.log( btnPressed );
        document.getElementById("startBtn").remove();
    }

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
    //renderer.setPixelRatio( window.devicePixelRatio ); // GOOD RESOLUTION BUT BAD IN PHONES !!! NOT RECOMMENDED
    renderer.setPixelRatio( window.devicePixelRatio * 0.5 );
    renderer.setSize( window.innerWidth, window.innerHeight );   
    renderer.shadowMap.enabled = true;  
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;        
    renderer.outputEncoding = THREE.sRGBEncoding;

    container.appendChild( renderer.domElement );

    // SCENE
    scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xAA00CC);
    scene.fog = new THREE.Fog( scene.background, 1, 25 );

    // CAMERA
    const fov    = 50;
    const aspect = window.innerWidth / window.innerHeight;
    const near   = 0.1;
    const far    = 5000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 2.5, 8.5);
    controls = new FirstPersonControls( camera, renderer.domElement );
    controls.movementSpeed = 10;
    controls.lookSpeed = 0.25;

    // AMBIENT LIGHT
    const hemiLight = new THREE.HemisphereLight( 0xFF00FF, 0xFF00FF, 0.05 );
    hemiLight.color.setHSL( 1, 0, 1 );
    //hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    scene.add( hemiLight );

    // DIRECTIONAL LIGHT
    let intensityModifier;
    const colorLight = 0xff00ff;
    const intensity = 0.1;
    let light = new THREE.DirectionalLight(colorLight, intensity * intensityModifier);
    scene.add( light );

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

    // FOR ANIMATIONS
    let MariMixer, ValkMixer, LealMixer, 
        HarryMixer, KonstriktorMixer, BluMixer,
        MasterBlackMixer;


    if( statsEnabled ) {

        stats = new Stats();
        container.appendChild( stats.dom );

    }

    // AUDIO HANDLER
    const Listener = new THREE.AudioListener();
    camera.add( Listener );

    const sound = new THREE.Audio( Listener );

    const AudioLoader = new THREE.AudioLoader();
    AudioLoader.load('media/better_off_alone_128.mp3', buffer => {

    sound.setBuffer( buffer );
    sound.setLoop(true);
    sound.setVolume(0.4);

    });

    function StartMusic(){ sound.play() }

    const Analyser = new THREE.AudioAnalyser( sound, 32 );

    // GET AVERAGE FREQUENCY
    const SoundData = Analyser.getAverageFrequency();

    // LOADING NIGHTCLUB
    const NightclubLoader = new GLTFLoader(loadingManager);
    NightclubLoader.load( './nightclub/scene.gltf',  result => {

        model = result.scene.children[0]; 
        model.position.set(0,0,0);
        model.traverse(n => { if ( n.isMesh ) {
          n.castShadow = true; 
          n.receiveShadow = true;
          n.material.transparent = false;
          if(n.material.map) n.material.map.anisotropy = 1; 
        }});

        scene.add(model);

    }, undefined, 

    function( error ) { console.error( error ) });

    // LOADING VALK...
    const ValkLoader = new GLTFLoader(loadingManager);
    ValkLoader.load('peps/OBJ/valk.glb', ( gltf ) => {

            const model = gltf.scene;
            ValkMixer = new THREE.AnimationMixer(gltf).scene;
            model.position.set(-0.85,0,5);


            model.traverse(n => { if ( n.isMesh ) {
                n.castShadow = true; 
                n.receiveShadow = true;
                n.material.transparent = false;
                if(n.material.map) n.material.map.anisotropy = 1; 
              }});

            scene.add( model );

            const animations = gltf.animations;              
            ValkMixer = new THREE.AnimationMixer(model);
            ValkMixer.clipAction(animations[0]).play();
        },
        function ( xhr ) {

            //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        function ( error ) {

            console.log( 'An error happened' );

        }
    );

        // LOADING MARIARCHI...
        const MariLoader = new GLTFLoader(loadingManager);
        MariLoader.load('peps/OBJ/mariarchi.glb', ( gltf ) => {
    
                const model = gltf.scene;
                MariMixer = new THREE.AnimationMixer(gltf).scene;
                model.position.set(0,0,5);
                model.scale.set(1.03,1.07,1);
    
                model.traverse(n => { if ( n.isMesh ) {
                    n.castShadow = true; 
                    n.receiveShadow = true;
                    n.material.transparent = false;
                    if(n.material.map) n.material.map.anisotropy = 1; 
                  }});
    
                scene.add( model );
    
                const animations = gltf.animations;              
                MariMixer = new THREE.AnimationMixer(model);
                MariMixer.clipAction(animations[0]).play();
            },
            function ( xhr ) {
    
                //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
            },
            function ( error ) {
    
                console.log( 'An error happened' );
    
            }
        );

        // LOADING LEAL...
        const LealLoader = new GLTFLoader(loadingManager);
        LealLoader.load('peps/OBJ/leal.glb', ( gltf ) => {
    
                const model = gltf.scene;
                LealMixer = new THREE.AnimationMixer(gltf).scene;
                model.position.set(1.65,0,4.75);
                model.scale.set(1.025,1.05,1);
    
                model.traverse(n => { if ( n.isMesh ) {
                    n.castShadow = true; 
                    n.receiveShadow = true;
                    n.material.transparent = false;
                    if(n.material.map) n.material.map.anisotropy = 1; 
                    }});
    
                scene.add( model );
    
                const animations = gltf.animations;              
                LealMixer = new THREE.AnimationMixer(model);
                LealMixer.clipAction(animations[0]).play();
            },
            function ( xhr ) {
    
               // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
            },
            function ( error ) {
    
                console.log( 'An error happened' );
    
            }
        );

        // LOADING HARRY...
        const HarryLoader = new GLTFLoader(loadingManager);
        HarryLoader.load('peps/OBJ/harry.glb', ( gltf ) => {
    
                const model = gltf.scene;
                HarryMixer = new THREE.AnimationMixer(gltf).scene;
                model.position.set(-1.75,0,3);
                model.rotation.set(0,0.25,0);
                model.scale.set(1.1,1.05,1.05);
    
                model.traverse(n => { if ( n.isMesh ) {
                    n.castShadow = true; 
                    n.receiveShadow = true;
                    n.material.transparent = false;
                    if(n.material.map) n.material.map.anisotropy = 1; 
                    }});
    
                scene.add( model );
    
                const animations = gltf.animations;              
                HarryMixer = new THREE.AnimationMixer(model);
                HarryMixer.clipAction(animations[0]).play();
            },
            function ( xhr ) {
    
                //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
            },
            function ( error ) {
    
                console.log( 'An error happened' );
    
            }
        );

        // LOADING KONSTRIKTOR...
        const KonstriktorLoader = new GLTFLoader(loadingManager);
        KonstriktorLoader.load('peps/OBJ/konstriktor.glb', ( gltf ) => {
    
                const model = gltf.scene;
                KonstriktorMixer = new THREE.AnimationMixer(gltf).scene;
                model.position.set(0.65,0,2.4);
                model.rotation.set(0,-0.25,0);
                model.scale.set(1.8,1.3,1.5);
    
                model.traverse(n => { if ( n.isMesh ) {
                    n.castShadow = true; 
                    n.receiveShadow = true;
                    n.material.transparent = false;
                    if(n.material.map) n.material.map.anisotropy = 1; 
                    }});
    
                scene.add( model );
    
                const animations = gltf.animations;              
                KonstriktorMixer = new THREE.AnimationMixer(model);
                KonstriktorMixer.clipAction(animations[0]).play();
            },
            function ( xhr ) {
    
                //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
            },
            function ( error ) {
    
                console.log( 'An error happened' );
    
            }
        );
        
        // LOADING BLUE...
        const BluLoader = new GLTFLoader(loadingManager);
        BluLoader.load('peps/OBJ/blu.glb', ( gltf ) => {
    
                const model = gltf.scene;
                BluMixer = new THREE.AnimationMixer(gltf).scene;
                model.position.set(-0.75,0,4);
                model.rotation.set(0,0,0);
                model.scale.set(1,1,1);
    
                model.traverse(n => { if ( n.isMesh ) {
                    n.castShadow = true; 
                    n.receiveShadow = true;
                    n.material.transparent = false;
                    if(n.material.map) n.material.map.anisotropy = 1; 
                    }});
    
                scene.add( model );
    
                const animations = gltf.animations;              
                BluMixer = new THREE.AnimationMixer(model);
                BluMixer.clipAction(animations[0]).play();
            },
            function ( xhr ) {
    
                //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
            },
            function ( error ) {
    
                console.log( 'An error happened' );
    
            }
        );

        // LOADING MASTER BLACK...
        const MasterBlackLoader = new GLTFLoader(loadingManager);
        MasterBlackLoader.load('peps/OBJ/preto.glb', ( gltf ) => {
    
                const model = gltf.scene;
                MasterBlackMixer = new THREE.AnimationMixer(gltf).scene;
                model.position.set(-3,0,4);
                model.rotation.set(0,1,0);
                model.scale.set(1,1,1);
    
                model.traverse(n => { if ( n.isMesh ) {
                    n.castShadow = true; 
                    n.receiveShadow = true;
                    n.material.transparent = false;
                    if(n.material.map) n.material.map.anisotropy = 1; 
                    }});
    
                scene.add( model );
    
                const animations = gltf.animations;              
                MasterBlackMixer = new THREE.AnimationMixer(model);
                MasterBlackMixer.clipAction(animations[0]).play();
            },
            function ( xhr ) {
    
                //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
            },
            function ( error ) {
    
                console.log( 'An error happened' );
    
            }
        );
        
        

    // RENDERING THE SCENE
    function render(time) {

        requestAnimationFrame( render );

        delta = clock.getDelta();
        // WAIT ANIMATIONS TO BE ALL READY
        if (MariMixer && ValkMixer && LealMixer && HarryMixer && KonstriktorMixer && BluMixer && MasterBlackMixer ) {
            MariMixer.update(delta);
            ValkMixer.update(delta);
            LealMixer.update(delta);
            HarryMixer.update(delta);
            KonstriktorMixer.update(delta);
            BluMixer.update(delta);
            MasterBlackMixer.update(delta);
        }

                

        light.intensity = Math.abs( Math.sin(clock.elapsedTime * 7) );
        camera.fov = 50 - light.intensity;
        camera.updateProjectionMatrix();
        if ( light.intensity <= 0.1 ) light.color.setHSL(Math.random() % 255, Math.random() % 255, Math.random() % 255);

        // UPDATING THE CAMERA CONTROLS
        //controls.update( delta ); 
        //camera.lookAt(lookAtObj);        
        //camera.rotation.y += delta/2;

        angle += 0.005;
        camera.position.x = radius * Math.cos(angle);
        camera.lookAt(radius * Math.cos(angle) / 10,-1,0);

        if( statsEnabled ) stats.update();

        // RENDERING FUNCTION LOOP
        renderer.render( scene, camera );         // NORMAL RENDERING
        //acomposer.render();                          // RENDERING WITH POST PROCESSING

    }       
    
    // CHECK FOR CHANGES ON WINDOW SIZE
    window.onresize = function () {

        const width = window.innerWidth;
        const height = window.innerHeight;
    
        camera.aspect = width / height;
        camera.updateProjectionMatrix();    
        renderer.setSize( width, height );
        composer.setSize( width, height );
    
        //bloomComposer.setSize( width, height );
        //finalComposer.setSize( width, height );
    
        render();
        
    };
    
    render();

}

init();
