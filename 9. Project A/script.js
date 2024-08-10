import * as THREE from "three";
//import * as CANNON from "cannon";

import Stats from "statssrc";
import { FBXLoader } from "fbxsrc";
import { GUI } from "guisrc";
import { GLTFLoader } from "gltfsrc";

let camera, scene, renderer, clock, canvas;
let model, animations;

const fov = 45;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 5000;

let angle, radius = 0;

InitThree();
animate();

function InitThree()
{
    /****************************
    *  LOADING SCREEN
    ****************************/
    // const loadingScreen = document.getElementById( "loading-screen" );

    // const loadingManager = new THREE.LoadingManager( () => {
    //     document.getElementById( "startBtn" ).style.opacity = 1;
    //     document.getElementById( "loader" ).remove();
    //     WaitButton();
    // } );

    // function WaitButton () {
    //     if ( !btnPressed && !MixerReady ) {
    //         setTimeout( WaitButton, 2500 );
    //         console.log( "Pls press button..." );
    //     } else {
    //         loadingScreen.classList.add( "fade-out" );
    //         loadingScreen.addEventListener( "transitionend", onTransitionEnd );
    //         StartAnimations = !StartAnimations;
    //         StartMusic();
    //     }

    // }

    // document.getElementById( "startBtn" ).onclick = function () { btnClicked(); };

    // function btnClicked () {
    //     btnPressed = !btnPressed;
    //     document.getElementById( "startBtn" ).remove();
    // }

    // function onTransitionEnd ( event ) {
    //     event.target.remove();
    // }

    // container = document.createElement( 'div' );
    // document.body.appendChild( container );


/****************************
*   SCENE
****************************/
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xBABACA );
    //scene.fog = new THREE.Fog( 0xBABACA, 10, 50 );

//// Camera
    camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
    camera.position.set( 2, 3, -6 );
    camera.lookAt( 0, 1, 0 );
    scene.add( camera );

    canvas = document.querySelector( "#canvas" );

    renderer = new THREE.WebGLRenderer( { canvas, antialias: true } );
    renderer.setPixelRatio( 2 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;

    // Adicionando um cubo à cena
    const cubeGeometry = new THREE.BoxGeometry( 2, 2, 2 ); // Definindo a geometria do cubo
    const cubeMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } ); // Definindo o material do cubo
    const cube = new THREE.Mesh( cubeGeometry, cubeMaterial ); // Criando o cubo
    cube.position.set( 0, 1, 0 ); // Posicionando o cubo
    scene.add( cube ); // Adicionando o cubo à cena

////Lights
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 3 );
    hemiLight.position.set( 0, 20, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
    dirLight.position.set( - 3, 10, - 10 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = - 4;
    dirLight.shadow.camera.left = - 4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add( dirLight );      
}

function animate () 
{
    requestAnimationFrame( animate );

    //camera.lookAt( 0, 1, 0 );

    render();

}

function render()
{
    renderer.render( scene, camera );
}

// Resize the window on size change
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}