import * as THREE from "three";
//import * as CANNON from "cannon";

import Stats from "statssrc";
import { FBXLoader } from "fbxsrc";
import { GUI } from "guisrc";
import { GLTFLoader } from "gltfsrc";

let canvas, camera, scene, renderer, container;
let ok = true;

const clock         = new THREE.Clock();
let delta           = 0;
let animationTimer  = 0;

let btnPressed = true;
let statsEnabled = true;
let stats;

const crossFadeControls = [];

/****************************
*  Rei Parameters
****************************/
let ReiMixer, ReiModel, ReiSkeleton;
let temp;

let currentBaseAction = 'idle';
let allActions = [];
const baseActions = {
    idle: { weight: 1 },
    walk: { weight: 0 },
    run: { weight: 0 },
};
const additiveActions = {
    
};
let panelSettings, numAnimations;

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

    const loadingManager = new THREE.LoadingManager(() => {
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
    // scene.fog = new THREE.Fog(scene.background, 200, 1000);
    scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );

    // camera
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.01;
    const far = 500;
    const camFOV = 60;
    
    camera = new THREE.PerspectiveCamera( camFOV, aspect, near, far );
    camera.position.set(-2.5, 1.5, 0.0);
    camera.lookAt(0.0, 1.2, 0.0);

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
    dirLight.shadow.camera.far = 40;
    scene.add( dirLight );

    // ground
    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    // loading models
    const loader = new FBXLoader( loadingManager );
    ReiMixer = new THREE.AnimationMixer;
    loader.load('chars/rei_base.fbx', ( character ) => 
    {
        character.scale.set(1.0, 1.0, 1.0);
        character.rotation.set(0, -Math.PI/2, 0);
    
        // shadows
        character.traverse(( object ) => {
            if ( object.isMesh ) object.castShadow = true;
        });

        ReiSkeleton = new THREE.SkeletonHelper( character );
        // ReiSkeleton.visible = false;
        scene.add( ReiSkeleton );
    
        ReiMixer = new THREE.AnimationMixer( character );

        // base character
        allActions[0] = ReiMixer.clipAction(character.animations[0]);
        
        // idle
        loader.load('chars/rei_idle.fbx', (character) =>
        {
            allActions[1] = ReiMixer.clipAction(character.animations[0]);
        })
        
        console.log(allActions);

        ReiModel = character;
        scene.add(character);
    }, 
    (xhr) => 
    {
        // console.log((xhr.loaded / xhr.total) * 100 + '%loaded')
        let loadMsg = (xhr.loaded / xhr.total).toPrecision(4) * 100 + '% loaded.';
        coutAssetLoading(loadMsg, "Rei Base")
    },
    (error) =>
    {
        cerr(error);
    });

    renderer.setAnimationLoop( animate );
}

function animate()
{
    updateAnimations();    

    
    renderer.render( scene, camera );
    if( statsEnabled ) stats.update();
}

function updateAnimations()
{
    delta = clock.getDelta();
    animationTimer = clock.getElapsedTime();

    if( ReiMixer )
    {
        ReiMixer.update(delta);
    }
}

// Create UI
function createUI()
{
    gui = new GUI({ width: 350 });
    gui.close();
    // const cubeFolder = gui.addFolder('Console')
}

// Console 

// prints a message on the screen console
function cout(message) 
{
    const consoleMessages = document.getElementById("console-messages");
    const theMessage = document.createElement("li");
    theMessage.appendChild(document.createTextNode(message));
    consoleMessages.appendChild(theMessage);

    // auto scroll to bottom
    const console = document.getElementById("console")
    console.scrollTo(0, console.scrollHeight);

}

// prints a message on the screen console for loading assets
function coutAssetLoading(message, assetName) 
{
    const consoleMessages = document.getElementById("console-messages");

    const messageOnList = document.getElementById(assetName);
    if(messageOnList)
    {
        consoleMessages.removeChild(messageOnList);
    }

    const theMessage = document.createElement("li");
    theMessage.id = assetName;
    theMessage.appendChild(document.createTextNode(assetName + ": " + message));
    consoleMessages.appendChild(theMessage);

    // auto scroll to bottom
    const console = document.getElementById("console")
    console.scrollTo(0, console.scrollHeight);
}

// displays an error on the screen console
function cerr(message) 
{
    const consoleMessages = document.getElementById("console-messages");
    const theMessage = document.createElement("li");
    theMessage.style.color = "tomato";
    theMessage.style.fontWeight = "bolder";
    theMessage.appendChild(document.createTextNode(message));
    consoleMessages.appendChild(theMessage);

    // auto scroll to bottom
    const console = document.getElementById("console")
    console.scrollTo(0, console.scrollHeight);

    ok = false;
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