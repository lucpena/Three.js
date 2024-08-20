import * as THREE from "three";
//import * as CANNON from "cannon";

import Stats from "statssrc";
import { GUI } from "guisrc";

import { cout, coutAssetLoading, cerr } from "./utils.js";
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

const crossFadeControls = [];

let camFOV = 60;


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

// sounds
const stepSoundsPaths = [
    "sounds/pl_tile1.wav",
    "sounds/pl_tile2.wav",
    "sounds/pl_tile3.wav",
    "sounds/pl_tile4.wav",
    "sounds/pl_tile5.wav"
];
let stepSounds = [];

const listener = new THREE.AudioListener();

/****************************
*  GUI Parameters
****************************/
let gui;

initThree();
createUI();
animate();

function initThree() 
{
     /****************************
    *  LOADING SCREEN
    ****************************/
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

    const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
    dirLight.position.set( 3, 10, 10 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = - 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 500;
    scene.add( dirLight );

    // ground
    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: true } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    // crating and setting the mais character
    reiCharacter = new CHAR.Character(scene, reiPath, reiAnimations, loadingManager);

    reiAnimations.forEach((element, i) => {
        reiStates[i] = element.state;
    });

    reiCharacter.FSM = new CHAR.FiniteStateMachine(reiStates);
    reiCharacter.CharacterControl = new CHAR.CharacterControl();
    reiCharacter.sounds = new CHAR.SoundEngine(stepSoundsPaths, stepSounds, listener);

    renderer.setAnimationLoop( animate );
}

function animate()
{
    updateAnimations();
    
    renderer.render( scene, camera );
    if( statsEnabled ) stats.update();
}

// for step sounds
let lastStepTime = 0; // Marca o tempo do último som de passo
let stepInterval = 0; // Intervalo mínimo entre sons de passos (em segundos)

// for camera shaking on run state
let bobbingAmplitude = 0.05; // Amplitude da oscilação
let bobbingFrequency = 4;   // Frequência da oscilação
function updateAnimations()
{
    delta = clock.getDelta();
    myElapsedTime = clock.getElapsedTime();
    timerSeconds = Math.floor(clock.getElapsedTime());

    coutAssetLoading(timerSeconds, "Seconds")

    if(reiCharacter.theMixer)
    {
        MixerReady = true;
        
        // uptades the camera 
        const cameraOffset = new THREE.Vector3(-0.25, 1.4, -1.5);
        const newPosition = cameraOffset.clone().applyQuaternion(reiCharacter._mesh.quaternion).add(reiCharacter._mesh.position);
       
        camera.lookAt(reiCharacter._position.x, reiCharacter._position.y + 1, reiCharacter._position.z - 0.1);
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
            // time = Math.floor(time)
            // console.log(time);
            coutAssetLoading(time.toPrecision(1), "time")
            time = time.toPrecision(1);

            const currentTime = reiCharacter.theMixer.time;
            const timeElapsed = currentTime - lastStepTime;

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
        
        // updates the delta (needs to be in the end)
        reiCharacter.update(delta);
        camera.updateProjectionMatrix();
    }

    // if( timerSeconds > 0 && playOnce)
    // {
    //     // reiCharacter.FSM.setActiveState("idle");
    //     playOnce = false;
    // }
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