import * as THREE from "three";
import Stats from "statssrc";
import { GLTFLoader } from "gltfsrc";
//import { OrbitControls } from "orbitsrc";
import { FirstPersonControls } from "fpssrc";
import { RectAreaLightHelper } from 'RectAreaLightHelperSRC';


let scene, camera, renderer, canvas, controls, clock, model, stats, container;
let delta, deltaTime = 0;
let RandomIntensityTime = 0;
let StartAnimations = false;
let btnPressed = false;

let angle = 0;
let radius = 1.75;

const statsEnabled = false;

function init() {

    //LOADING SCREEN
    const loadingScreen = document.getElementById("loading-screen");     

    const loadingManager = new THREE.LoadingManager(() => {
        document.getElementById("startBtn").style.opacity = 1;
        document.getElementById("loader").remove();
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
        StartAnimations = !StartAnimations;
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
    console.log(`window.devicePixelRatio = ` + window.devicePixelRatio)
    renderer.setPixelRatio( 0.6 );

    renderer.setSize( window.innerWidth, window.innerHeight );   
    renderer.shadowMap.enabled = true;  
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
    const near   = 0.01;
    const far    = 500;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 2.5, 9);
    //camera.position.set(-2.5,1.5,4.2);  // ANA

    // CONTROLS
    controls = new FirstPersonControls( camera, renderer.domElement );
    controls.movementSpeed = 10;
    controls.lookSpeed = 0.25;

    // ----- LIGHTS
    // AMBIENT LIGHT
    const hemiLight = new THREE.HemisphereLight( 0xFF00FF, 0xFF00FF, 0.05 );
    hemiLight.color.setHSL( 1, 0, 1 );
    //hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    scene.add( hemiLight );

    // DIRECTIONAL LIGHT
    const colorLight = 0xff00ff;
    const intensity = 0.1;
    let light = new THREE.DirectionalLight(colorLight, intensity);
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

    // ANA TABLET LIGHT
    const tabletLight = new THREE.RectAreaLight(0X00FF33, 5, 0.3, 0.2);
    tabletLight.position.set(-2.45,1.165,3.2);
    tabletLight.lookAt(-2.5,15,-2);
    const tabletLightHelper = new RectAreaLightHelper( tabletLight );
    //tabletLight.add( tabletLightHelper );
    scene.add( tabletLight );



//  ======================================= SCENE =============================

    // FOR ANIMATIONS
    let MariMixer, ValkMixer, LealMixer, 
        HarryMixer, KonstriktorMixer, BluMixer,
        MasterBlackMixer, AnaMixer;

    let MixerReady = false;


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

    //const Analyser = new THREE.AudioAnalyser( sound, 32 );

    // GET AVERAGE FREQUENCY
    //const SoundData = Analyser.getAverageFrequency();

    // LOADING NIGHTCLUB
    const NightclubLoader = new GLTFLoader(loadingManager);
    NightclubLoader.load( './models/nightclub/scene.gltf',  result => {

        model = result.scene.children[0]; 
        model.position.set(0,0,0);
        model.traverse(n => { if ( n.isMesh ) {
          n.castShadow = true; 
          n.receiveShadow = true;
          n.material.transparent = false;
          if(n.material.map) n.material.map.anisotropy = 1; 
        }});

        scene.add(model);

    }, function ( xhr ) {

        //console.log('Loading Nightclub: ' + ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        if(xhr.loaded / xhr.total * 100 == 100)
        console.log("Nightclub Loaded.");
    },

    function( error ) { console.error( error ) });

    // LOADING VALK...
    const ValkLoader = new GLTFLoader(loadingManager);
    ValkLoader.load('./models/peps/OBJ/valk.glb', ( gltf ) => {

        const model = gltf.scene;
        ValkMixer = new THREE.AnimationMixer(gltf).scene;
        model.position.set(-0.85,0,5);


        model.traverse(n => { if ( n.isMesh ) {
            n.castShadow = true; 
            n.receiveShadow = true;
            n.material.transparent = false;
            n.frustumCulled = false;
            if(n.material.map) n.material.map.anisotropy = 1; 
            }});

        scene.add( model );

        const animations = gltf.animations;              
        ValkMixer = new THREE.AnimationMixer(model);
        ValkMixer.clipAction(animations[0]).play();
    },
    function ( xhr ) {

        if(xhr.loaded / xhr.total * 100 == 100)
        console.log("Valk Loaded.");

    },
    function ( error ) {

        console.error( 'An error happened loading Valk: ' + error );

    }
);

    // LOADING MARIARCHI...
    const MariLoader = new GLTFLoader(loadingManager);
    MariLoader.load('./models/peps/OBJ/mariarchi.glb', ( gltf ) => {

            const model = gltf.scene;
            MariMixer = new THREE.AnimationMixer(gltf).scene;
            model.position.set(0,0,5);
            model.scale.set(1.03,1.07,1);

            model.traverse(n => { if ( n.isMesh ) {
                n.castShadow = true; 
                n.receiveShadow = true;
                n.material.transparent = false;
                n.frustumCulled = false;
                if(n.material.map) n.material.map.anisotropy = 1; 
                }});

            scene.add( model );

            const animations = gltf.animations;              
            MariMixer = new THREE.AnimationMixer(model);
            MariMixer.clipAction(animations[0]).play();
        },
        function ( xhr ) {

            if(xhr.loaded / xhr.total * 100 == 100)
            console.log("Mariarchi Loaded.");                

        },
        function ( error ) {

            console.error( 'An error happened loading Mariarchi: ' + error);

        }
    );

    // LOADING LEAL...
    const LealLoader = new GLTFLoader(loadingManager);
    LealLoader.load('./models/peps/OBJ/leal.glb', ( gltf ) => {

            const model = gltf.scene;
            LealMixer = new THREE.AnimationMixer(gltf).scene;
            model.position.set(1.8,0,4.75);
            model.scale.set(1.025,1.05,1);

            model.traverse(n => { if ( n.isMesh ) {
                n.castShadow = true; 
                n.receiveShadow = true;
                n.material.transparent = false;
                n.frustumCulled = false;
                if(n.material.map) n.material.map.anisotropy = 1; 
                }});

            scene.add( model );

            const animations = gltf.animations;              
            LealMixer = new THREE.AnimationMixer(model);
            LealMixer.clipAction(animations[0]).play();
        },
        function ( xhr ) {

            if(xhr.loaded / xhr.total * 100 == 100)
            console.log("Leal Loaded.");

        },
        function ( error ) {

            console.error( 'An error happened loading Leal: ' + error );

        }
    );

    // LOADING HARRY...
    const HarryLoader = new GLTFLoader(loadingManager);
    HarryLoader.load('./models/peps/OBJ/harry.glb', ( gltf ) => {

            const model = gltf.scene;
            HarryMixer = new THREE.AnimationMixer(gltf).scene;
            model.position.set(-1.75,0,3);
            model.rotation.set(0,0.25,0);
            model.scale.set(1.1,1.05,1.05);

            model.traverse(n => { if ( n.isMesh ) {
                n.castShadow = true; 
                n.receiveShadow = true;
                n.material.transparent = false;
                n.frustumCulled = false;
                if(n.material.map) n.material.map.anisotropy = 1; 
                }});

            scene.add( model );

            const animations = gltf.animations;              
            HarryMixer = new THREE.AnimationMixer(model);
            HarryMixer.clipAction(animations[0]).play();
        },
        function ( xhr ) {

            if(xhr.loaded / xhr.total * 100 == 100)
            console.log("Harry Loaded.");

        },
        function ( error ) {

            console.error( 'An error happened loading Harry: ' + error );

        }
    );

    // LOADING ANA...
    const AnaLoader = new GLTFLoader(loadingManager);
    AnaLoader.load('./models/peps/OBJ/ana.glb', ( gltf ) => {

            const model = gltf.scene;
            AnaMixer = new THREE.AnimationMixer(gltf).scene;
            model.position.set(-2.5,0,3);
            model.rotation.set(0,0.25,0);
            model.scale.set(1,1,1);
            model.transparent = true;

            model.traverse(n => { if ( n.isMesh ) {
                n.castShadow = true; 
                n.receiveShadow = true;
                n.material.transparent = false;
                n.frustumCulled = false;
                if(n.material.map) n.material.map.anisotropy = 1; 
                }});

            scene.add( model );

            const animations = gltf.animations;              
            AnaMixer = new THREE.AnimationMixer(model);
            AnaMixer.clipAction(animations[0]).play();
        },
        function ( xhr ) {

            if(xhr.loaded / xhr.total * 100 == 100)
            console.log("Ana Loaded.");

        },
        function ( error ) {

            console.error( 'An error happened loading Ana: ' + error );

        }
    );

    // LOADING KONSTRIKTOR...
    const KonstriktorLoader = new GLTFLoader(loadingManager);
    KonstriktorLoader.load('./models/peps/OBJ/konstriktor.glb', ( gltf ) => {

            const model = gltf.scene;
            KonstriktorMixer = new THREE.AnimationMixer(gltf).scene;
            model.position.set(0.25,0,2.1);
            model.rotation.set(0,-0.25,0);
            model.scale.set(1.8,1.3,1.5);

            model.traverse(n => { if ( n.isMesh ) {
                n.castShadow = true; 
                n.receiveShadow = true;
                n.material.transparent = false;
                n.frustumCulled = false;
                if(n.material.map) n.material.map.anisotropy = 1; 
                }});

            scene.add( model );

            const animations = gltf.animations;              
            KonstriktorMixer = new THREE.AnimationMixer(model);
            KonstriktorMixer.clipAction(animations[0]).play();
        },
        function ( xhr ) {

            if(xhr.loaded / xhr.total * 100 == 100)
            console.log("Konstriktor Loaded.");

        },
        function ( error ) {

            console.error( 'An error happened loading Konstriktor: ' + error );

        }
    );
    
    // LOADING BLUE...
    const BluLoader = new GLTFLoader(loadingManager);
    BluLoader.load('./models/peps/OBJ/blu.glb', ( gltf ) => {

            const model = gltf.scene;
            BluMixer = new THREE.AnimationMixer(gltf).scene;
            model.position.set(-0.75,0,4);
            model.rotation.set(0,0,0);
            model.scale.set(1,1,1);

            model.traverse(n => { if ( n.isMesh ) {
                n.castShadow = true; 
                n.receiveShadow = true;
                n.material.transparent = false;
                n.frustumCulled = false;
                if(n.material.map) n.material.map.anisotropy = 1; 
                }});

            scene.add( model );

            const animations = gltf.animations;              
            BluMixer = new THREE.AnimationMixer(model);
            BluMixer.clipAction(animations[0]).play();
        },
        function ( xhr ) {

            if(xhr.loaded / xhr.total * 100 == 100)
            console.log("Blu Loaded.");

        },
        function ( error ) {

            console.error( 'An error happened loading Blu: ' + error );

        }
    );

    // LOADING MASTER BLACK...
    const MasterBlackLoader = new GLTFLoader(loadingManager);
    MasterBlackLoader.load('./models/peps/OBJ/preto.glb', ( gltf ) => {

            const model = gltf.scene;
            MasterBlackMixer = new THREE.AnimationMixer(gltf).scene;
            model.position.set(-3,0,4);
            model.rotation.set(0,1,0);
            model.scale.set(1,1,1);

            model.traverse(n => { if ( n.isMesh ) {
                n.castShadow = true; 
                n.receiveShadow = true;
                n.material.transparent = false;
                n.frustumCulled = false;
                if(n.material.map) n.material.map.anisotropy = 1; 
                }});

            scene.add( model );

            const animations = gltf.animations;              
            MasterBlackMixer = new THREE.AnimationMixer(model);
            MasterBlackMixer.clipAction(animations[0]).play();
        },
        function ( xhr ) {

            if(xhr.loaded / xhr.total * 100 == 100)
            console.log("Master Black Loaded.");

        },
        function ( error ) {

            console.error( 'An error happened loading Mister Black: ' + error );

        }
    );
        

    // RENDERING THE SCENE
    function render(time) {

        requestAnimationFrame( render );

        delta = clock.getDelta();
        deltaTime = clock.elapsedTime;
        RandomIntensityTime += 0.001;

        if( MariMixer && ValkMixer && LealMixer && HarryMixer && KonstriktorMixer && BluMixer && MasterBlackMixer && AnaMixer ) {
            MixerReady = true;
        }

        // WAIT ANIMATIONS TO BE ALL READY AND USER START
        if (StartAnimations && MixerReady){
            MariMixer.update(delta);
            ValkMixer.update(delta);
            LealMixer.update(delta);
            HarryMixer.update(delta);
            KonstriktorMixer.update(delta);
            BluMixer.update(delta);
            MasterBlackMixer.update(delta);
            AnaMixer.update(delta);            
        }                

        light.intensity = Math.abs( Math.sin(clock.elapsedTime * 7) ) * 1.2;
        hemiLight.intensity = 0.05 * light.intensity;

        camera.fov = 50 - light.intensity;
        camera.updateProjectionMatrix();  // Need this after changing camera.fov

        // RANDOM NIGHCLUB LIGHTS
        if ( light.intensity <= 0.1 ) {
            light.color.setHSL(Math.random() % 255, Math.random() % 255, Math.random() % 255);
        }

        // GIVE RANDOM LIGHT AND INTENSITY TO ANA'S TABLET
        if(RandomIntensityTime >= Math.random() % 10 ){
            tabletLight.intensity =  2.5 + Math.abs( Math.random() % 5 );
            tabletLight.color.setHSL(Math.random() % 200, Math.random() % 200, Math.random() % 200);
            RandomIntensityTime = 0;
        }

        // UPDATING THE CAMERA CONTROLS
        //controls.update( delta );    
        //camera.rotation.y += delta/2;

        angle += 0.005;

        //camera.position.x = (-0.5) + (radius * Math.cos(angle)) / 1.1;
        //camera.position.z =      4 + radius * Math.sin(angle);
        
        camera.position.x = radius * Math.cos(angle * 1.7);
        camera.lookAt(camera.position.x * 1.15,1,4);

        if( statsEnabled ) stats.update();

        // RENDERING FUNCTION LOOP
        renderer.render( scene, camera );         // NORMAL RENDERING

    }       
    
    // CHECK FOR CHANGES ON WINDOW SIZE
    window.onresize = function () {

        const width = window.innerWidth;
        const height = window.innerHeight;
    
        camera.aspect = width / height;
        camera.updateProjectionMatrix();    
        renderer.setSize( width, height );
    
        render();
        
    };
    
    render();

}

init();
