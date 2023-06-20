import * as THREE from "three";
import Stats from "statssrc";
import { FBXLoader } from "fbxsrc";
import { GLTFLoader } from "gltfsrc";


// MC = Main Character

let canvas, camera, scene, renderer, stats, container;

let delta = 0;
let superDelta = 0;
let btnPressed = true;

let light, hemiLight, spotLight;

let MCMixer;
const keyboard              = {};
let StartAnimations         = false;
let MixerReady              = false;
let WaitActions             = false;

const MC_AnimationActions   = [];
let MC_LastAction           = THREE.AnimationAction;
let MC_ActiveAction         = THREE.AnimationAction;
let MC_SuperCooldown        = false;
let MC_SuperCooldownValue   = 8;
let MC_SuperBuffer          = 0;
let MC_PunchBuffer          = 0;
let MC_IsIdle               = true;
let MC_IsWalking            = false;
let MC_IsPunching           = false; 
let MC_IsSuper              = false;
let MC_Position             = new THREE.Vector3(0, 0, 0);
let MC_Rotation             = new THREE.Euler( 0, - Math.PI / 2, 0 );
const MC_MoveSpeed          = 0.035;
let MC_Combo                = 0;
let MC_Model;
let MC_AnimationCooldown    = 0;

let SC_LaneHeight           = 2;

const AudioLoader           = new THREE.AudioLoader();
const Listener              = new THREE.AudioListener();

const statsEnabled          = true;
const clock                 = new THREE.Clock();
const SuperClock            = new THREE.Clock();
const comboClock            = new THREE.Clock();
let AnimationClock          = new THREE.Clock();
let animationTimer          = 0;



init();
animate();

function init() 
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
        if (!btnPressed) {
            setTimeout(WaitButton, 2500);
            console.log("Pls press button...")
        } else {
            loadingScreen.classList.add("fade-out");
            loadingScreen.addEventListener("transitionend", onTransitionEnd);
            StartAnimations = !StartAnimations;
            StartMusic();
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

    // Canvas

    canvas = document.querySelector("#canvas");

    // Renderer

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(2); 
    renderer.setSize( window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild( renderer.domElement );

    // Scene

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xa0a0a0 );
    scene.fog = new THREE.Fog( scene.background, 200, 1000 );

    // Camera

    const aspect = window.innerWidth / window.innerHeight;
    const near   = 0.01;
    const far    = 500;
    const camFOV = 60;
    const width = window.innerWidth / 190;
    const height = window.innerHeight / 190;
    let cameraX = -1.5;

    camera = new THREE.PerspectiveCamera( camFOV, aspect, near, far );
    camera.position.set( cameraX, 2.8, -7 );

    // camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
    // camera.position.set(cameraX, 3, -8);

    camera.lookAt(cameraX, 0, 0);

    // Lights

    // Ambient Light
    hemiLight = new THREE.HemisphereLight( 0xffeeb1, 0x080820, 0.8 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 25, 0 );
    scene.add( hemiLight );

    // Directional Light
    const colorLight = 0xFFFFFF;
    const intensity = 2;
    light = new THREE.DirectionalLight( colorLight, intensity );
    const shadowMapBox = 10;
    light.castShadow = true;
    light.shadow.camera.top = shadowMapBox;
    light.shadow.camera.bottom = - shadowMapBox;
    light.shadow.camera.left = - shadowMapBox;
    light.shadow.camera.right = shadowMapBox;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 50; camera.position.x;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.color.setHSL( 0.1, 1, 0.95 );
    light.position.multiplyScalar( 30 );
    light.position.set( -15, 10, -20 );
    scene.add( light );

    /****************************
    *  Scene Setup
    ****************************/
   
    // Skybox   
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

    // First floor

    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 200, 200 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    const grid = new THREE.GridHelper( 400, 800, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );

    // Load the FBX model

    const loader = new FBXLoader( loadingManager );
    MCMixer = THREE.AnimationMixer;
    loader.load( 'chars/james_idle.fbx', ( character ) =>
    {
        character.scale.set(0.01, 0.01, 0.01);
        character.rotation.set(0, -Math.PI / 2, 0);

        character.castShadow = true;       
        MCMixer = new THREE.AnimationMixer( character );

        const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
        MC_AnimationActions.push( MC_AnimationAction );
        MC_ActiveAction = MC_AnimationActions[0];
        
        character.traverse( function ( child ) 
        {
            if ( child.isMesh ) 
            {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );

        loader.load('chars/james_walk.fbx', ( character ) =>
        {
            console.log("Loading animation.");
            const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
            MC_AnimationActions.push( MC_AnimationAction );
        });

        loader.load( 'chars/james_super.fbx', ( character ) => {
            console.log( "Loading animation." );
            const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
            MC_AnimationActions.push( MC_AnimationAction );
        });

        loader.load( 'chars/james_p1.fbx', ( character ) => {
            console.log( "Loading animation." );
            const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
            MC_AnimationAction.loop = THREE.LoopOnce ;
            MC_AnimationAction.clampWhenFinished  = true;
            console.log( MC_AnimationAction )
            MC_AnimationActions.push( MC_AnimationAction );
        });

        loader.load( 'chars/james_p2.fbx', ( character ) => {
            console.log( "Loading animation." );
            const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
            MC_AnimationActions.push( MC_AnimationAction );
        });

        loader.load( 'chars/james_p3.fbx', ( character ) => {
            console.log( "Loading animation." );
            const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
            MC_AnimationActions.push( MC_AnimationAction );
        } );

        //console.log( MC_AnimationActions );
        MC_Model = character;
        scene.add( character );
    });

    // Stats

    if ( statsEnabled ) 
    {
        stats = new Stats();
        container.appendChild( stats.dom );
    }

    // BGM

    camera.add( Listener );

    const BGM = new THREE.Audio( Listener );
    AudioLoader.load( 'ost/01.mp3', buffer => 
    {
        BGM.setBuffer( buffer );
        BGM.setLoop( true );
        BGM.setVolume( 0.4 );
    } );
    function StartMusic () { BGM.play(); }
}

/****************************
*  Audio Setup
****************************/

const punchSounds = []

for (let index = 1; index <= 3; index++) {
    let fileName = 'fx/punch_miss_' + index + '.wav'

    const punchSound = new THREE.Audio( Listener );
    AudioLoader.load( fileName , buffer => {
        punchSound.setBuffer( buffer );
        punchSound.setLoop( false );
        punchSound.setVolume( 0.1 );

    } );

    punchSounds.push(punchSound);
}
function playPunchSound () 
{
    let randomIndex = Math.floor( Math.random() * 2 ) + 1;
    
    if ( AudioLoader && Listener )
        punchSounds[randomIndex].play();
}

/****************************
*  Animation Setup
****************************/

function playAnimation( thisAnimation )
{
    switch ( thisAnimation )
    {
        case "idle":
            setAction( MC_AnimationActions[ 0 ] );
            break;

        case "walk":
            setAction( MC_AnimationActions[ 1 ] );
            break;
            
        case "super":
            setAction( MC_AnimationActions[ 2 ] );
            break;

        case "punch":
            setAction( MC_AnimationActions[ 3 ] );
            break;

        case "punch2":
            setAction( MC_AnimationActions[ 4 ] );
            break;

        case "punch3":
            setAction( MC_AnimationActions[ 5 ] );
            break;

        default:
            setAction( MC_AnimationActions[ 0 ] );
            break;
    }
}

let GotLastTimeAnimationWasUsed = false;
let SoundNotPlayedPunch = true;
let SoundNotPlayedSuper = true;
let SuperCooldownClockStarted = false;
let AnimationStartTime = 0;
let AnimationEndTime = 0;

function setAction ( toAction ) 
{
    let AnimationDuration = toAction.time;
    //console.log( AnimationDuration )

    // if( MC_IsPunching || MC_IsSuper )
    // {
    //     AnimationDuration = toAction.time;
    // }

    if ( (MC_IsPunching || MC_IsSuper) && !GotLastTimeAnimationWasUsed )
    {
        if ( AnimationDuration == 0 )
            AnimationDuration = toAction._clip.duration;

        GotLastTimeAnimationWasUsed = true;
        AnimationStartTime = animationTimer;
        AnimationEndTime = AnimationStartTime + AnimationDuration;

        console.log( "AnimationDuration " + AnimationDuration );
        console.log( "animationTimer: " + animationTimer );
        console.log( "AnimationEndTime: " + AnimationEndTime )
    }
    // Keep the Animation of the Action    
    if ( animationTimer < AnimationEndTime && MC_IsPunching && !MC_IsSuper )
    {
        MC_IsPunching = true;

        if( SoundNotPlayedPunch )
        {
            if ( MC_IsPunching ) MC_Combo = ( MC_Combo + 1 ) % 3;
            SoundNotPlayedPunch = false;
            playPunchSound();
        }
    } else
    {
        SoundNotPlayedPunch = true;
        MC_IsPunching = false;
    }

    if ( MC_IsSuper && MC_SuperCooldown && animationTimer > MC_SuperCooldownValue )
    {
        MC_SuperCooldown = false;
        console.log( "Super available..." )
    }

    console.log( MC_SuperCooldown )
    if ( animationTimer < AnimationEndTime && MC_IsSuper && !MC_SuperCooldown)
    {
        console.log( "SUPER" )
        console.log( "AnimationDuration " + AnimationDuration )
        console.log( "animationTimer: " + animationTimer )
        console.log( "AnimationEndTime: " + AnimationEndTime )
        console.log( "Super Cooldown" );

        if ( !SuperCooldownClockStarted ) {
            SuperCooldownClockStarted = true;
            SuperClock.start();
            MC_IsSuper = true;
            MC_SuperCooldown = true;
            console.log( "Super Cooldown" );
        }

        if ( SoundNotPlayedSuper ) {
            SoundNotPlayedSuper = false;
            playPunchSound();
        }

    } else if ( animationTimer > AnimationEndTime && MC_IsSuper ) {
        SoundNotPlayedSuper = true;
        MC_IsSuper = false;
    }

    if( animationTimer > AnimationEndTime )
    {
        GotLastTimeAnimationWasUsed = false;
    }

    // Changing animation and blend
    if ( toAction != MC_ActiveAction )
    {
        MC_LastAction = MC_ActiveAction;
        MC_ActiveAction = toAction;
        //MC_LastAction.stop()
        MC_LastAction.fadeOut( 0.2 );
        MC_ActiveAction.reset();
        MC_ActiveAction.fadeIn( 0.2 );
        MC_ActiveAction.play();
    }

    toAction.play();   
    
}

function handleCamera()
{
    const CAM_MovementOffset = 1.5;
    const CAM_CurrentPos = camera.position;

    if ( MC_Position.x - CAM_CurrentPos.x > CAM_MovementOffset )
    {
        const CAM_Position = new THREE.Vector3 
        (
            MC_Position.x - CAM_MovementOffset,
            MC_Position.y + camera.position.y,
            camera.position.z
        );
        camera.position.copy( CAM_Position );
    }
    else if ( MC_Position.x - CAM_CurrentPos.x < - CAM_MovementOffset ) {
        const CAM_Position = new THREE.Vector3
            (
                MC_Position.x + CAM_MovementOffset,
                MC_Position.y + camera.position.y,
                camera.position.z
            );
        camera.position.copy( CAM_Position );
    }
    else
    {
        const CAM_Position = camera.position;
        camera.position.copy( CAM_Position );
    }
}

function MC_Actions()
{    
    if ( MC_IsPunching ) 
    {
        switch ( MC_Combo ) 
        {
            case 0:
                playAnimation( "punch" );
                break;
            
            case 1:
                playAnimation( "punch2" );
                break;

            case 2:
                playAnimation( "punch3" );
                break;
            
            default:
                playAnimation( "punch" );
                break;
        }       
    }
    else if ( MC_IsSuper ) {
   
        playAnimation( "super" );         
        
    }   
    else if ( MC_IsIdle ) {
        //MC_Combo = 0;
        playAnimation( "idle" );
    }
    else if ( MC_IsWalking ) {
        //MC_Combo = 0;
        playAnimation( "walk" );
    }

}

function updateAnimations()
{
    delta = clock.getDelta();
    animationTimer = clock.getElapsedTime();;

    if( MCMixer )
    {
        MixerReady = true;
       
    }
    if( StartAnimations && MixerReady )
    {
        MCMixer.update( delta );        

        if ( keyboard.movement && !MC_IsPunching) {
            MC_IsWalking = true;

            if( keyboard.up )
            {
                MC_Position.z += MC_MoveSpeed;

                if ( MC_Position.z > SC_LaneHeight ) 
                {
                    MC_Position.z = SC_LaneHeight;
                }
            }

            if ( keyboard.down )
            {
                MC_Position.z -= MC_MoveSpeed;

                if ( MC_Position.z < -SC_LaneHeight ) 
                {
                    MC_Position.z = -SC_LaneHeight;
                }
            }

            if ( keyboard.left )
            {
                MC_Position.x += MC_MoveSpeed;
                if( MC_Position.x > 2 )
                {
                    MC_Position.x = 2;
                }

                MC_Rotation.y = Math.PI / 2;
            }

            if ( keyboard.right ) 
            {
                MC_Position.x -= MC_MoveSpeed;
                if ( MC_Position.x < -15 ) 
                {
                    MC_Position.x = -15;
                }
                MC_Rotation.y = - Math.PI / 2;
            }

            MC_Model.rotation.copy( MC_Rotation );
            MC_Model.position.copy( MC_Position );
        }

        MC_Actions();

    }

    handleCamera();
    //comboTimer();
 
    light.position.x = -15 + MC_Position.x;

}

function animate()
{     
    requestAnimationFrame( animate );
    updateAnimations();
    if( statsEnabled ) stats.update();
    renderer.render( scene, camera );
}

// Event listeners for key presses and releases
document.addEventListener( 'keydown', handleKeyDown );
document.addEventListener( 'keyup', handleKeyUp );

let MC_GetPunchInput = true;
let MC_GetSuperInput = true;

// Function to handle key down events
function handleKeyDown ( event ) {

    if ( event.key === 'ArrowUp' || event.key === 'w' ) 
    {
        keyboard.up = true;
    }
    if ( event.key === 'ArrowDown' || event.key === 's' ) 
    {
        keyboard.down = true;
    }
    if ( event.key === 'ArrowLeft' || event.key === 'a' ) 
    {
        keyboard.left = true;
    }
    if ( event.key === 'ArrowRight' || event.key === 'd' ) 
    {
        keyboard.right = true;
    }
    if ( keyboard.up || keyboard.down || keyboard.left || keyboard.right ) 
    {
        keyboard.movement = true;
        MC_IsIdle = false;
    }

    if ( MC_GetPunchInput )
    {
        if ( event.key === 'f' ) 
        {            
            MC_IsPunching = true;
            keyboard.punch = true;
            MC_IsIdle = false;
            MC_IsWalking = false;
            MC_GetPunchInput = false;
        }
    }

    if ( MC_GetSuperInput )
    {
        if ( event.key === 'r' ) 
        {
            keyboard.super = true;
            MC_GetSuperInput = false;
            MC_IsSuper = true;
        }
    }
}

// Function to handle key up events
function handleKeyUp ( event ) {
    
    if ( event.key === 'ArrowUp' || event.key === 'w' ) {
        keyboard.up = false;
    }
    if ( event.key === 'ArrowDown' || event.key === 's' ) {
        keyboard.down = false;
    }
    if ( event.key === 'ArrowLeft' || event.key === 'a' ) {
        keyboard.left = false;
    }
    if ( event.key === 'ArrowRight' || event.key === 'd' ) {
        keyboard.right = false;
    }
    if ( !keyboard.up && !keyboard.down && !keyboard.left && !keyboard.right ) 
    {
        keyboard.movement = false;
        MC_IsIdle = true;
    }

    if ( event.key === 'f' ) 
    {
        MC_IsWalking = false;
        keyboard.punch = false;        
        MC_GetPunchInput = true;
    }    
    
    if ( event.key === 'r' ) 
    {
        keyboard.super = false;
        MC_GetSuperInput = true;
    }
    

}

// Resize the window on size change
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    animate();
}

function log( value, delay )
{
    setTimeout( () => {
        console.log( value );
    }, delay );
}