import * as THREE from "three";
import Stats from "statssrc";
import { GLTFLoader } from "gltfsrc";
//import { OrbitControls } from "orbitsrc";
import { FirstPersonControls } from "fpssrc";
import { RectAreaLightHelper } from 'RectAreaLightHelperSRC';


let scene, camera, renderer, canvas, controls, model, stats, container;
let delta = 0;
let RandomIntensityTime = 0;
let StartAnimations = false;
let btnPressed = false;
let hue, saturation, lightness = 0;
let cameraFOV = 50;
let initializated = false;
let touched = false;

// ANGLE STUFF
let angle = 0;
let radius = 1.4;

const statsEnabled = true;
const clock = new THREE.Clock();

// ANIMATIONS
let MariMixer, ValkMixer, LealMixer, 
    HarryMixer, KonstriktorMixer, BluMixer,
    MasterBlackMixer, AnaMixer, SmasherMixer;
let MixerReady = false;

// SMOKE PARTICLES
let smokeParticles = [];

// LIGHTS
let light, hemiLight, spotLight, spotLight2, tabletLight;

// FOR CAMERA MOVEMENT WITH MOUSE
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {

    //LOADING SCREEN
    const loadingScreen = document.getElementById("loading-screen");     
    const controlsHUD = document.getElementById("controls");

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
            initializated = !initializated;
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
        document.getElementById("controls").style.opacity = 0;
    }
    
    container = document.createElement('div');
    document.body.appendChild( container );

    // GETTING MOUSE MOVEMENT
    document.addEventListener( 'mousemove', onDocumentMouseMove );
    
    window.addEventListener('touchstart', touchHandler, false);
    window.addEventListener('touchmove', touchHandler, false);
    window.addEventListener('touchend', touchHandler, false);

    // CANVAS
    canvas = document.querySelector("#canvas");

    // RENDERER
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    //renderer.setPixelRatio( window.devicePixelRatio ); // GOOD RESOLUTION BUT BAD IN PHONES !!! NOT RECOMMENDED 
    renderer.setPixelRatio( 0.5 );
    renderer.setSize( window.innerWidth, window.innerHeight );   
    renderer.shadowMap.enabled = true;  
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2;    
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.useLegacyLights = true;

    container.appendChild( renderer.domElement );

    // SCENE
    scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xAA00CC);
    scene.fog = new THREE.Fog( scene.background, 1, 25 );

    // CAMERA
    const aspect = window.innerWidth / window.innerHeight;
    const near   = 0.01;
    const far    = 500;
    camera = new THREE.PerspectiveCamera(cameraFOV, aspect, near, far);
    camera.position.set(0, 2.5, 9);
    //camera.position.set(-1,2,4.2);  // ANA
    //camera.lookAt(-2.5,1,2);

    // CONTROLS
    controls = new FirstPersonControls( camera, renderer.domElement );
    controls.movementSpeed = 10;
    controls.lookSpeed = 0.25;

    // ----- LIGHTS
    // AMBIENT LIGHT
    hemiLight = new THREE.HemisphereLight( 0xFF00FF, 0x000000, 0.01 );
    scene.add( hemiLight );

    // DIRECTIONAL LIGHT
    const colorLight = 0xff00ff;
    const intensity = 0.2;
    light = new THREE.DirectionalLight(colorLight, intensity);
    light.position.y = 4;
    scene.add( light );

    // LIGHT SHADOWS
    light.castShadow = true;
    const d = 10;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;
    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 50;    camera.position.x
    light.shadow.mapSize.width =  1024;
    light.shadow.mapSize.height = 1024;

    // SPOT LIGHT 1
    let spotLightColor = 0xFFFF00;
    let spotLightIntensity = 0.9;
    let spotLightDistance = 25;
    let spotLightAngle = Math.PI/19;
    let spotLightPenumbra = 0.1;
    let spotLightDecay = 0;
    spotLight = new THREE.SpotLight(spotLightColor,spotLightIntensity, spotLightDistance, spotLightAngle, spotLightPenumbra, spotLightDecay);
    spotLight.position.set(-4, 3.5, 11);
    spotLight.lookAt(0, 0, 0);
    spotLight.castShadow = true;

    // SPOT LIGHT SHADOWS
    spotLight.shadow.mapSize.width = 512;
    spotLight.shadow.mapSize.height = 512;
    spotLight.shadow.camera.near = 0.1;
    spotLight.shadow.camera.far = 100;
    spotLight.shadow.camera.fov = 30;

    scene.add( spotLight );
    scene.add( spotLight.target );

    // SPOT LIGHT 2
    spotLightColor = 0x0077FF;
    spotLightIntensity = 1;
    spotLightDistance = 25;
    spotLightAngle = Math.PI/19;
    spotLightPenumbra = 0.1;
    spotLightDecay = 0;
    spotLight2 = new THREE.SpotLight(spotLightColor,spotLightIntensity, spotLightDistance, spotLightAngle, spotLightPenumbra, spotLightDecay);
    spotLight2.position.set(4, 3.5, 11);
    spotLight2.lookAt(0, 0, 0);
    spotLight2.castShadow = true;

    // SPOT LIGHT 2 SHADOWS
    spotLight2.shadow.mapSize.width = 512;
    spotLight2.shadow.mapSize.height = 512;
    spotLight2.shadow.camera.near = 0.1;
    spotLight2.shadow.camera.far = 100;
    spotLight2.shadow.camera.fov = 30;

    scene.add( spotLight2 );
    scene.add( spotLight2.target );    

    // ANA TABLET LIGHT
    tabletLight = new THREE.RectAreaLight(0X00FF33, 5, 0.3, 0.2);
    tabletLight.position.set(-2.45,1.165,3.2);
    tabletLight.lookAt(-2.5,15,-2);
    const tabletLightHelper = new RectAreaLightHelper( tabletLight );
    //tabletLight.add( tabletLightHelper );
    scene.add( tabletLight );

//  ======================================= SCENE =============================

    let smokeTexture = new THREE.TextureLoader().load('./tex/smoke/whitePuff22.png');
    let smokeGeometry = new THREE.PlaneGeometry(5, 5);
    let smokeMaterial = new THREE.MeshLambertMaterial({map: smokeTexture, opacity: 0.25, transparent: true});

    for( let i = 0; i < 15; i++ ){
        let smokeElement = new THREE.Mesh(smokeGeometry, smokeMaterial);
        //smokeElement.scale.set(2, 2, 2);
        smokeElement.position.set(-3.5 + Math.random() * 7, 0.5, -4 + Math.random() * 12);
        smokeElement.rotation.z = Math.random() * 360;
        smokeElement.rotation.x = -Math.PI/2.5; 
        //smokeElement.lookAt(camera.position);

        scene.add(smokeElement);
        smokeParticles.push(smokeElement);
    }

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
    MariLoader.load('./models/peps/OBJ/mariarchi2.glb', ( gltf ) => {

            const model = gltf.scene;
            MariMixer = new THREE.AnimationMixer(gltf).scene;
            model.position.set(0.18,0,5);
            model.rotation.set(0,-0.5,0);
            model.scale.set(0.28, 0.32, 0.28);

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
                n.material.transparent = true;
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

    // LOADING ADAM SMASHER...
    const SmasherLoader = new GLTFLoader(loadingManager);
    SmasherLoader.load('./models/peps/OBJ/adam.glb', ( gltf ) => {

            const model = gltf.scene;
            SmasherMixer = new THREE.AnimationMixer(gltf).scene;
            model.position.set(0.8, 0, -3);
            model.rotation.set(0,0,0);
            model.scale.set(1.3,1.35,1.3);

            model.traverse(n => { if ( n.isMesh ) {
                n.castShadow = true; 
                n.receiveShadow = true;
                //n.material.transparent = false;
                n.frustumCulled = false;
                if(n.material.map) n.material.map.anisotropy = 1; 
                }});

            scene.add( model );

            const animations = gltf.animations;              
            SmasherMixer = new THREE.AnimationMixer(model);
            SmasherMixer.clipAction(animations[0]).play();
        },
        function ( xhr ) {

            if(xhr.loaded / xhr.total * 100 == 100)
            console.log("Adam Smasher Loaded.");

        },
        function ( error ) {
            
            console.error( 'An error happened loading Mister Black: ' + error );
            
        }
    );  
        
        
    
    // CHECK FOR CHANGES ON WINDOW SIZE
    window.onresize = function () {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();    
        renderer.setSize( width, height );
    
    };
}


function onDocumentMouseMove( event ) {

    mouseX = ( event.clientX - windowHalfX ) / 2;
    mouseY = ( event.clientY - windowHalfY ) / 2;

}

function touchHandler(event) {
    if(initializated) {
        touched = true;
        event.preventDefault();

        if (event.touches && event.touches[0]) {
        mouseX = event.touches[0].clientX - windowHalfX / 2;
        mouseY = event.touches[0].clientY;
        camera.fov = camera.fov - 10;
        camera.updateProjectionMatrix();
        } else if (event.originalEvent && event.originalEvent.changedTouches[0]) {
            mouseX = event.originalEvent.changedTouches[0].clientX - windowHalfX / 2;
            mouseY = event.originalEvent.changedTouches[0].clientY;
            camera.fov = camera.fov - 10;
            camera.updateProjectionMatrix();
        } else if (event.clientX && event.clientY) {
            mouseX = event.clientX - windowHalfX / 2;
            mouseY = event.clientY;
            camera.fov = camera.fov - 10;
            camera.updateProjectionMatrix();
        }

        touched = false;
    }
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

// RENDERING THE SCENE
function render() {   

    delta = clock.getDelta();
    angle += 0.008;
    RandomIntensityTime += 0.001;

    if(angle > Math.PI * 2) angle = 0;
    
    if( MariMixer && ValkMixer && LealMixer && HarryMixer && KonstriktorMixer && BluMixer && MasterBlackMixer && AnaMixer && SmasherMixer ) {
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
        SmasherMixer.update(delta);            
    }                

    // SMOKE PARTICLES
    for( let i = 0; i < smokeParticles.length; i++) {
        smokeParticles[i].lookAt = camera.position.x;
        smokeParticles[i].rotation.z += 0.0025;
        smokeParticles[i].position.z += (smokeParticles[i].position.z >= 8 ? -11 : 0.008);
    }

    
    // LIGHTS ANIMATION
    light.intensity = Math.abs( Math.sin(clock.elapsedTime * 7) * 0.45 );
    hemiLight.intensity = light.intensity / 4;
    

    hue = Math.random();
    saturation = 0.75;
    lightness = 0.5;
    // RANDOM NIGHCLUB LIGHTS
    if ( light.intensity <= 0.1 ) {
        light.color.setHSL(hue, saturation, lightness);
        hemiLight.color.setHSL(hue, saturation, lightness);
    }
    
    // GIVE RANDOM LIGHT AND INTENSITY TO ANA'S TABLET
    if(RandomIntensityTime >= Math.random() % 10 ){
        tabletLight.intensity =  4 + Math.abs( Math.random() % 5 );
        tabletLight.color.setHSL(Math.random(), 0.75, 0.6);
        RandomIntensityTime = 0;
    }

    // SPOT LIGHT MOVEMENT
    spotLight.target.position.set( Math.sin(angle * 6) * 4,  Math.cos(angle * 2) * 4, Math.cos(angle * 2));
    spotLight2.target.position.set( Math.cos(angle * 6) * 4,  Math.sin(angle * 2) * 4, Math.cos(angle * 2));

    // CAMERA ANIMATIONS

    // document.addEventListener("click", event => {    
    //     //console.log(event);
    //     event.preventDefault();

    //     mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    //     mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    //     raycaster.setFromCamera( mouse, camera );
    
    //     var intersects = raycaster.intersectObjects( scene.children, true );
    
    //     if ( intersects.length > 0 ) {
    //         let object = intersects[0].object;
    //         console.log( 'Intersection:', intersects[ 0 ] );
    //     }
    // });

    if(!touched) camera.fov = 45 - light.intensity;
    camera.updateProjectionMatrix();  // Need this after changing            

    
    // UPDATING THE CAMERA CONTROLS
    camera.position.x = radius * Math.cos(angle);
    camera.lookAt((camera.position.x / 4) + (mouseX / 200 ), 1.1 + (-mouseY / 220 ), 4);


    if( statsEnabled ) stats.update();

    // RENDERING FUNCTION LOOP
    renderer.render( scene, camera );         // NORMAL RENDERING

}
