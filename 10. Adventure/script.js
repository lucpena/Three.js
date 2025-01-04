import * as THREE from "three";

import Stats from "statssrc";
import { GUI } from "guisrc";
import { PositionalAudioHelper } from "posaudiohelpersrc";

import { cout, cerr, coutWarning } from "./utils.js";
import * as UTILS from "./utils.js";
import * as CHAR from "./character.js";

let canvas, camera, scene, renderer, container;

const cameraTargetPosition = new THREE.Vector3(); // Posição alvo da câmera
const cameraTargetQuaternion = new THREE.Quaternion(); // Rotação alvo da câmera

const clock         = new THREE.Clock();
let delta           = 0;
let timerSeconds    = 0;
let myElapsedTime   = null;
let loadingManager  = null;

let btnPressed = false;
let statsEnabled = true;
let stats;

let camFOV = 60;

// lights
let dirLight;

// textures
const textureLoader = new THREE.TextureLoader();
let pavementTextures = {
    colorTexture: textureLoader.load("textures/Pavement_COLOR.png"),
    displacementTexture: textureLoader.load("textures/Pavement_DISP.png"),
    normalTexture: textureLoader.load("textures/Pavement_NRM.png"),
    aoTexture: textureLoader.load("textures/Pavement_OCC.png"),
    specularTexture: textureLoader.load("textures/Pavement_SPEC.png"),
};
const pavementScale = 100; // scales all textures
Object.values(pavementTextures).forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(pavementScale, pavementScale);
});
const pavementMaterial = new THREE.MeshStandardMaterial({
    map: pavementTextures.colorTexture,                // Textura de cor
    displacementMap: pavementTextures.displacementTexture, // Textura de deslocamento
    displacementScale: 0.1,                            // Ajuste do deslocamento
    normalMap: pavementTextures.normalTexture,         // Textura normal
    aoMap: pavementTextures.aoTexture,                 // Textura de oclusão ambiental
    specularMap: pavementTextures.specularTexture,     // Textura especular
});

// characters
let reiCharacter = null;
const reiPath = "chars/rei_base.fbx";
let reiStates = [];
const reiAnimations = [
    {id: 1, path:"chars/rei_idle.fbx", state:"idle"},
    {id: 2, path:"chars/rei_walk.fbx", state:"walk"},
    {id: 3, path:"chars/rei_backwalk.fbx", state:"backwalk"},
    {id: 4, path:"chars/rei_walk_turn_right.fbx", state:"turn_right"},
    {id: 5, path:"chars/rei_walk_turn_left.fbx", state:"turn_left"},
    {id: 6, path:"chars/rei_run.fbx", state:"run"}
];

let MixerReady = false;

// other models
let portalRadio = null;
const portalRadioPath = "props/radio.glb";

// sounds
const stepSoundsPaths = [
    "sounds/pl_step1.wav",
    "sounds/pl_step2.wav",
    "sounds/pl_step3.wav",
    "sounds/pl_step4.wav"
];
let stepSounds = [];
let radioSongElement;
const radioMaxVolume = 0.7;

// const radioMusicsPaths = [
//     "music/portal.mp3"
// ];
// let radioMusic = [];

const listener = new THREE.AudioListener();
let radioPositionalAudio;
let positionalAudioHelper;

// setting AMMO Physics Engine
const gravityConstant = - 9.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let softBodySolver;
let physicsWorld;

const rigidBodies = [];
const margin = 0.05;
let hinge;
let rope;
let transformAux1;
let armMovement = 0;

// GUI Parameters
let gui;

// Initiating
window.addEventListener('DOMContentLoaded', async() =>
{    
    cout("loaded.", "DOM");
    cout("loading...", "Three.js");
    initThree();
    cout("loading", "AMMO.js (Physics)");
    //initPhysics();
    createUI();
    animate();
});


function initThree() 
{
    // loading screen
    const loadingScreen = document.getElementById("loading-screen");

    loadingManager = new THREE.LoadingManager(() => {
        document.getElementById("startBtn").style.opacity = 1;
        document.getElementById("loader").remove();
        WaitButton();
    });

    function WaitButton()
    {
        if ( !btnPressed && !MixerReady ) {
            setTimeout(WaitButton, 2500);
            console.log("Pls press button...")
        } else {
            loadingScreen.classList.add( "fade-out" );
            loadingScreen.addEventListener( "transitionend", onTransitionEnd );
        }
    }

    document.getElementById("startBtn").onclick = function () { btnClicked() };

    function btnClicked()
    {
        btnPressed = !btnPressed;
        document.getElementById("startBtn").remove();
    }

    function onTransitionEnd(event)
    {
        event.target.remove();
    }

    container = document.createElement('div');
    document.body.appendChild(container);

    /****************************
    *  THREE.JS Setup
    ****************************/
    canvas = document.querySelector("#canvas");

    // renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(2);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    container.appendChild(renderer.domElement);

    // stats    
    stats = new Stats();
    container.appendChild( stats.dom );

    // scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );

    // camera
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.01;
    const far = 5000;
    
    camera = new THREE.PerspectiveCamera( camFOV, aspect, near, far );
    camera.position.set(2.5, 1.5, 0.0);
    camera.lookAt(0.0, 1.2, 0.0);

    camera.add(listener);

    // lights
    const hemiLight = new THREE.HemisphereLight(0xFFEEB1, 0x202020, 1.2);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 20, 0);
    scene.add( hemiLight );

    dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
    dirLight.position.set( 3, 10, 10 );
    dirLight.castShadow = true;

    // Ajuste dos limites da shadow camera
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;

    // Aumente a resolução do shadow map
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    // Ajuste o bias da sombra
    dirLight.shadow.bias = -0.0005;

    scene.add( dirLight );

    // ground
    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), pavementMaterial );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.position.set(0, -0.05, 0);
    scene.add( mesh );

    // crating and setting the main character
    reiCharacter = new CHAR.Character(scene, reiPath, reiAnimations, loadingManager);

    reiAnimations.forEach((element, i) => {
        reiStates[i] = element.state;
    });

    reiCharacter.FSM = new CHAR.FiniteStateMachine(reiStates);
    reiCharacter.CharacterControl = new CHAR.CharacterControl();
    reiCharacter.sounds = new CHAR.StepSounds(stepSoundsPaths, stepSounds, listener, 0.5);

    // placing other objects
    portalRadio = new UTILS._glTFLoader(scene, portalRadioPath, 1.0, loadingManager);

    // setting sounds
    const audioContext = listener.context;

    radioPositionalAudio = new THREE.PositionalAudio(listener);
    radioSongElement = document.getElementById("music-better-off-alone");
    // radioSongElement = document.getElementById("music-portal");
    radioPositionalAudio.setMediaElementSource(radioSongElement);
    radioPositionalAudio.setRefDistance(1);
    radioPositionalAudio.setMaxDistance(5);
    radioPositionalAudio.setDirectionalCone( 180, 230, 0.3 );
    
    const highPassFilter = audioContext.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.value = 500; // Ajuste a frequência conforme necessário

    // Filtro Low-Pass
    const lowPassFilter = audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 5000; // Ajuste a frequência conforme necessário

    // Conectando os filtros ao áudio
    highPassFilter.connect(lowPassFilter);
    radioPositionalAudio.setFilter(highPassFilter);

    lowPassFilter.connect(radioPositionalAudio.getOutput());
    radioPositionalAudio.setFilter(highPassFilter);

    renderer.setAnimationLoop( animate );
}

function initPhysics()
{
    Ammo().then( function ( AmmoLib ) {
        Ammo = AmmoLib;
    } );

    collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    softBodySolver = new Ammo.btDefaultSoftBodySolver();
    physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver );
    physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
    physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );

    transformAux1 = new Ammo.btTransform();
}

function animate()
{
    updateAnimations();
    // updatePhysics();
    
    renderer.render( scene, camera );
    if( statsEnabled ) stats.update();
}

// for step sounds
let lastStepTime = 0; // Marca o tempo do último som de passo
let stepInterval = 0; // Intervalo mínimo entre sons de passos (em segundos)

// for camera shaking on run state
let bobbingAmplitude = 0.05; // Amplitude da oscilação
let bobbingFrequency = 4;   // Frequência da oscilação

let setOnceRadio = true;
let jumpFirstStep = true;
const radioRotation = new THREE.Euler(0, - Math.PI / 2, 0, 'XYZ');
function updateAnimations()
{
    delta = clock.getDelta();
    myElapsedTime = clock.getElapsedTime();
    timerSeconds = Math.floor(clock.getElapsedTime());

    cout(timerSeconds, "Seconds");

    // updating the radio
    if(portalRadio && timerSeconds > 1 && setOnceRadio)
    {
        portalRadio.scale = 0.015;
        portalRadio.rotation = radioRotation;
        portalRadio.position = new THREE.Vector3(-3, 1, 0);
        portalRadio._add(radioPositionalAudio);       
        radioSongElement.play();

        setOnceRadio = false;
    }

    if(portalRadio && timerSeconds > 1)
    {
        portalRadio._mesh.rotation.y += delta;
        portalRadio._mesh.position.y = 1 + Math.sin(myElapsedTime) / 25;
        
        // the sound gets lower if the camera/main character is further from the radio source
        const ReiRadioXdistance = Math.abs(portalRadio._mesh.position.x - reiCharacter._mesh.position.x);
        const ReiRadioZdistance = Math.abs(portalRadio._mesh.position.z - reiCharacter._mesh.position.z);

        if(ReiRadioXdistance > 1 || ReiRadioZdistance > 1)
        {
            radioSongElement.volume = Math.max(0, (radioMaxVolume - (ReiRadioXdistance + ReiRadioZdistance) * 4 / 100));
            cout(radioSongElement.volume, "Radio Volume")
        } else {
            radioSongElement.volume = radioMaxVolume;
            cout(radioSongElement.volume, "Radio Volume")
        }
    }

    // updating main character
    if(reiCharacter.theMixer)
    {
        MixerReady = true;
        
        // uptades the camera 
        const cameraOffset = new THREE.Vector3(-0.25, 1.4, -1.5);
        const newPosition = cameraOffset.clone().applyQuaternion(reiCharacter._mesh.quaternion).add(reiCharacter._mesh.position);
       
        camera.lookAt(reiCharacter._position.x, reiCharacter._position.y + 1, reiCharacter._position.z);
        camera.fov = 60;

        // smoothing camera 
        cameraTargetPosition.copy(newPosition);
        camera.position.lerp(cameraTargetPosition, 0.1);     
        
        cameraTargetQuaternion.copy(camera.quaternion);
        camera.quaternion.slerp(cameraTargetQuaternion, 0.1);
        
        // updates the character controls
        reiCharacter.CharacterControl.Update(reiCharacter, delta);
        
        // uptades the FSM
        reiCharacter.FSM.Update(reiCharacter);
        
        // play step sound        
        if(reiCharacter._activeAction)
        {
            let time = reiCharacter.theMixer.time % reiCharacter._activeAction._clip.duration;
            cout(time.toPrecision(1), "time")
            time = time.toPrecision(1);

            const currentTime = reiCharacter.theMixer.time;
            const timeElapsed = currentTime - lastStepTime;

            cout(jumpFirstStep, "jumpFirstStep")
            if(!jumpFirstStep)
            {
                if( reiCharacter.FSM.getActiveState() == "walk" || reiCharacter.FSM.getActiveState() == "backwalk" )
                {
                    stepInterval = 0.5;
                    if( timeElapsed > stepInterval )
                    {
                        reiCharacter.sounds.playStep();
                        lastStepTime = currentTime;
                    }
                }

                if( reiCharacter.FSM.getActiveState() == "run" )
                {
                    const bobbingY = Math.sin(myElapsedTime * bobbingFrequency) * bobbingAmplitude;    // Oscilação vertical
                    const bobbingX = Math.sin(myElapsedTime * bobbingFrequency * 0.5) * bobbingAmplitude * 0.5; // Oscilação horizontal

                    stepInterval = 0.34;
                    if( timeElapsed > stepInterval )
                    {
                        reiCharacter.sounds.playStep();
                        lastStepTime = currentTime;
                    }

                    // following camera
                    camera.position.set(newPosition.x + bobbingX, newPosition.y + bobbingY, newPosition.z);
                    camera.lookAt(reiCharacter._position.x, reiCharacter._position.y + 1, reiCharacter._position.z - 0.1);
                    camera.fov = 65;
                }

                if( reiCharacter.FSM.getActiveState() == "turn_left" || reiCharacter.FSM.getActiveState() == "turn_right" )
                {
                    stepInterval = 0.6;
                    if( timeElapsed > stepInterval )
                    {
                        reiCharacter.sounds.playStep();
                        lastStepTime = currentTime;
                    }
                }                
            }
            else if( reiCharacter.FSM.getActiveState() != "idle" ) {
                jumpFirstStep = false;
            }     

        }        
        
        // updates the delta (needs to be in the end)
        reiCharacter.update(delta);
        camera.updateProjectionMatrix();
    }

}

function updatePhysics()
{

}


// Create UI
function createUI()
{
    gui = new GUI({ width: 350 });
    gui.close();
    // const cubeFolder = gui.addFolder('Console')
}

// Resize the window on size change
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize () 
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

window.onerror = function(message, source, lineno, colno, error) {
    const errorMsg = `Erro: ${message} em ${source} na linha ${lineno}`;
    cerr(errorMsg); // Chama a função cerr para exibir o erro
    console.log(errorMsg);
    return true; // Previne que o erro continue no console
};