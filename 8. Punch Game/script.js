import * as THREE from "three";
//import * as CANNON from "cannon";

import Stats from "statssrc";
import { FBXLoader } from "fbxsrc";
import { GUI } from "guisrc";
import { GLTFLoader } from "gltfsrc";


// MC = Main Character

let canvas, camera, scene, renderer, stats, container;

let delta = 0;
let btnPressed = true;

let light, hemiLight, spotLight;

let MCMixer;
const keyboard              = {};
let StartAnimations         = false;
let MixerReady              = false;
let cityModel;

const MC_MoveSpeed          = 0.035;
const NPC_MoveSpeed         = 0.02;
let SC_LaneHeight           = 2.5;

const MC_AnimationActions   = [];
let MC_LastAction           = THREE.AnimationAction;
let MC_ActiveAction         = THREE.AnimationAction;
let MC_SuperCooldown        = false;
let MC_SuperCooldownValue   = 8;
let MC_IsIdle               = true;
let MC_IsWalking            = false;
let MC_IsPunching           = false; 
let MC_IsSuper              = false;
let MC_SuperAnimationTime   = 0;
let MC_Position             = new THREE.Vector3(0, 0, 0);
let MC_Rotation             = new THREE.Euler( 0, - Math.PI / 2, 0 );
let MC_Combo                = 0;
let MC_Model;
let MC_HitboxPunch;
let MC_HitboxHit;
let MC_HitboxPunchBB;
let MC_HitboxHitBB;

let NPCMixer;
let NPC_Position            = new THREE.Vector3( -5, 0, 0 );
let NPC_Rotation            = new THREE.Euler( 0, - Math.PI / 2, 0 );
const NPC_AnimationActions  = [];
let NPC_LastAction          = THREE.AnimationAction;
let NPC_ActiveAction        = THREE.AnimationAction;
let NPC_isIdle              = true;
let NPC_isPunching          = false;
let NPC_isWalking           = false;
let NPC_isHit               = false;
let NPC_isNearPlayer        = false;
let NPC_Hitbox;
let NPC_HitboxBB;
let NPC_Model; 

const AudioLoader           = new THREE.AudioLoader();
const Listener              = new THREE.AudioListener();

const statsEnabled          = true;
const clock                 = new THREE.Clock();
const SuperClock            = new THREE.Clock();
let AnimationClock          = new THREE.Clock();
let animationTimer          = 0;

let world = new CANNON.World();
let timeStep = 1/60;

const gui = new GUI();

initCannon();
initThree();
initGame();
animate();

function initCannon()
{
    /****************************
    *  Cannon.JS Setup
    ****************************/
    
    world.gravity.set( 0, -9.82, 0 );
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

}

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
    //renderer.toneMappingExposure = 1.5;
    //renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

    container.appendChild( renderer.domElement );

    // Scene

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xa0a0a0 );
    scene.fog = new THREE.Fog( scene.background, 200, 1000 );

    // Camera

    const aspect = window.innerWidth / window.innerHeight;
    const near   = 0.01;
    const far    = 500;
    const camFOV = 40;
    const width = window.innerWidth / 190;
    const height = window.innerHeight / 190;
    let cameraX = -1.5;

    camera = new THREE.PerspectiveCamera( camFOV, aspect, near, far );
    camera.position.set( cameraX, 2.8, -7 );
    camera.lookAt( cameraX, 0, 0 );

    // camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
    // camera.position.set(cameraX, 4, -6);
    // camera.lookAt(cameraX, 1, 0);

    // Lights

    // Ambient Light
    hemiLight = new THREE.HemisphereLight( 0xffeeb1, 0x202020, 0.8 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 25, 0 );
    scene.add( hemiLight );

    // Directional Light
    const colorLight = 0xffeeb1;
    const intensity = 0.75;
    light = new THREE.DirectionalLight( colorLight, intensity );
    const shadowMapBox = 25;
    light.castShadow = true;
    light.shadow.camera.top = shadowMapBox;
    light.shadow.camera.bottom = - shadowMapBox;
    light.shadow.camera.left = - shadowMapBox;
    light.shadow.camera.right = shadowMapBox;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 100;
    light.shadow.mapSize.width = 1024 * 10;
    light.shadow.mapSize.height = 1024 * 10;
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
    //scene.add( mesh );

    const grid = new THREE.GridHelper( 400, 800, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    //scene.add( grid );

    // Loading the City Stage
    const GLTFloader = new GLTFLoader( loadingManager );
    GLTFloader.load( 'stage/city/scene.gltf', result => {
        let lePie = Math.PI;
        cityModel = result.scene.children[ 0 ];
        cityModel.scale.set(7, 7, 7);
        cityModel.position.set( -11, 0, 7 );
        cityModel.rotation.set( -lePie/2, 0, lePie/2 );
        cityModel.traverse( n => {
            if ( n.isMesh ) {
                n.castShadow = true;
                n.receiveShadow = true;
                //n.material.transparent = false;
                //if ( n.material.map ) n.material.map.anisotropy = 1;
            }
        } );

        scene.add( cityModel );


    }, undefined,

        function ( error ) { console.error( error ); } );

    if ( statsEnabled ) {

        stats = new Stats();
        container.appendChild( stats.dom );

    }

    // Load the FBX model

    const loader = new FBXLoader( loadingManager );
    MCMixer = THREE.AnimationMixer;

    loader.load( 'chars/james/james_idle.fbx', ( character ) =>
    {
        character.scale.set(0.01, 0.01, 0.01);
        character.rotation.set(0, -Math.PI / 2, 0);

        character.castShadow = true;       
        MCMixer = new THREE.AnimationMixer( character );

        const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
        MC_AnimationAction.realAnimationTime = MC_AnimationAction._clip.duration;
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

        const animationEndRemove = 0.225;
        loader.load('chars/james/james_walk.fbx', ( character ) =>
        {
            const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
            MC_AnimationAction.realAnimationTime = MC_AnimationAction._clip.duration;
            MC_AnimationActions.push( MC_AnimationAction );
            console.log("Animation james_walk loaded...");
        });

        loader.load( 'chars/james/james_super.fbx', ( character ) => {
            const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
            MC_SuperAnimationTime = MC_AnimationAction._clip.duration;
            MC_AnimationAction.realAnimationTime = MC_AnimationAction._clip.duration;
            MC_AnimationActions.push( MC_AnimationAction );
            console.log( "Animation james_super loaded..." );
        });

        loader.load( 'chars/james/james_p1.fbx', ( character ) => {
            const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
            MC_AnimationAction.loop = THREE.LoopOnce ;
            MC_AnimationAction.clampWhenFinished  = true;
            MC_AnimationAction.realAnimationTime = MC_AnimationAction._clip.duration - animationEndRemove;
            MC_AnimationActions.push( MC_AnimationAction );
            console.log( "Animation james_p1 loaded..." );
        });

        loader.load( 'chars/james/james_p2.fbx', ( character ) => {
            const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
            MC_AnimationAction.loop = THREE.LoopOnce;
            MC_AnimationAction.clampWhenFinished = true;
            MC_AnimationAction.realAnimationTime = MC_AnimationAction._clip.duration;
            MC_AnimationActions.push( MC_AnimationAction );
            console.log( "Animation james_p2 loaded..." );
        });

        loader.load( 'chars/james/james_p3.fbx', ( character ) => {
            const MC_AnimationAction = MCMixer.clipAction( character.animations[ 0 ] );
            MC_AnimationAction.loop = THREE.LoopOnce;
            MC_AnimationAction.clampWhenFinished = true;
            MC_AnimationAction.realAnimationTime = MC_AnimationAction._clip.duration - animationEndRemove;
            MC_AnimationActions.push( MC_AnimationAction );
            console.log( "Animation james_p3 loaded..." );
        } );

        console.log( MC_AnimationActions );

        MC_Model = character;
        character.add( Listener );
        scene.add( character );
    });

    NPCMixer = THREE.AnimationMixer;

    loader.load( 'chars/enemies/manequim_idle.fbx', ( character ) => {
        character.scale.set( 0.01, 0.01, 0.01 );
        character.position.set( NPC_Position.x, NPC_Position.y, NPC_Position.z );
        character.rotation.set( 0, Math.PI / 2, 0 );

        character.castShadow = true;
        NPCMixer = new THREE.AnimationMixer( character );

        const NPC_AnimationAction = NPCMixer.clipAction( character.animations[ 0 ] );
        NPC_AnimationAction.realAnimationTime = NPC_AnimationAction._clip.duration;
        NPC_AnimationActions.push( NPC_AnimationAction );
        NPC_ActiveAction = NPC_AnimationActions[ 0 ];
        console.log("NPC Loaded.");

        character.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );

        loader.load( 'chars/enemies/manequim_hit.fbx', ( character ) => {
            const NPC_AnimationAction = NPCMixer.clipAction( character.animations[ 0 ] );
            NPC_AnimationAction.loop = THREE.LoopOnce;
            NPC_AnimationAction.clampWhenFinished = true;
            NPC_AnimationAction.realAnimationTime = NPC_AnimationAction._clip.duration;
            NPC_AnimationActions.push( NPC_AnimationAction );
            console.log( "Animation manequim_hit loaded..." );
        } );

        loader.load( 'chars/enemies/manequim_walk.fbx', ( character ) => {
            const NPC_AnimationAction = NPCMixer.clipAction( character.animations[ 0 ] );
            NPC_AnimationAction.realAnimationTime = NPC_AnimationAction._clip.duration;
            NPC_AnimationActions.push( NPC_AnimationAction );
            console.log( "Animation manequim_walk loaded..." );
        } );

        console.log( NPC_AnimationActions )

        NPC_Model = character;
        scene.add( character );
    } );

    // Stats

    if ( statsEnabled ) 
    {
        stats = new Stats();
        container.appendChild( stats.dom );
    }

    // BGM

    const BGM = new THREE.Audio( Listener );
    AudioLoader.load( 'ost/01.mp3', buffer => 
    {
        BGM.setBuffer( buffer );
        BGM.setLoop( true );
        BGM.setVolume( 0.1 );
    } );
    function StartMusic () { BGM.play(); }
}

function initGame()
{
    // Adding PUNCH hitbox to PLAYER 
    const MC_hitboxShapeGeometry = new THREE.BoxGeometry( 0.75, 1.25, 1 );
    const MC_hitboxGeometry = new THREE.WireframeGeometry( MC_hitboxShapeGeometry );
    const MC_hitboxMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00 }); 
    const hitbox = new THREE.LineSegments( MC_hitboxGeometry, MC_hitboxMaterial );

    hitbox.material.depthTest = true;
    hitbox.material.opacity = 0;
    hitbox.material.transparent = true;

    MC_HitboxPunch = hitbox;
    MC_HitboxPunchBB = new THREE.Box3( new THREE.Vector3(), new THREE.Vector3() );
    MC_HitboxPunchBB.setFromObject( hitbox );

    const helper = new THREE.Box3Helper( MC_HitboxPunchBB, 0xff0000 );
    scene.add( helper );
    scene.add( hitbox );



    // Adding HIT hitbox to PLAYER
    const MC_hitboxHitShapeGeometry = new THREE.BoxGeometry( 1.5, 1, 0.6 );
    const MC_hitboxHitGeometry = new THREE.WireframeGeometry( MC_hitboxHitShapeGeometry );
    const MC_hitboxHitMaterial = new THREE.LineBasicMaterial( { color: 0xFF0000 } );
    const hitboxHit = new THREE.LineSegments( MC_hitboxHitGeometry, MC_hitboxHitMaterial );

    hitboxHit.material.depthTest = true;
    hitboxHit.material.opacity = 0;
    hitboxHit.material.transparent = true;

    MC_HitboxHit = hitboxHit;
    MC_HitboxHitBB = new THREE.Box3( new THREE.Vector3(), new THREE.Vector3() );

    MC_HitboxHitBB.setFromObject( hitboxHit );

    const helper2 = new THREE.Box3Helper( MC_HitboxHitBB, 0x00ff00 );
    scene.add( helper2 );
    scene.add( hitboxHit );

    // Adding hit box to NPC
    const NPC_hitboxShapeGeometry = new THREE.BoxGeometry( 0.75, 1.25, 0.5 );
    const NPC_hitboxMaterial = new THREE.WireframeGeometry( NPC_hitboxShapeGeometry );
    const NPC_HitboxObj = new THREE.LineSegments( NPC_hitboxMaterial );

    NPC_HitboxObj.material.depthTest = true;
    NPC_HitboxObj.material.opacity = 0;
    NPC_HitboxObj.material.transparent = true;
    NPC_HitboxObj.position.set( 0, 0, 0 );

    NPC_Hitbox = NPC_HitboxObj;
    NPC_HitboxBB = new THREE.Box3( new THREE.Vector3(), new THREE.Vector3() );
    NPC_HitboxBB.setFromObject( NPC_Hitbox );

    const helper3 = new THREE.Box3Helper( NPC_HitboxBB, 0xffff00 );
    scene.add( helper3 );
    scene.add( NPC_HitboxObj );
}

/****************************
*  Audio Setup
****************************/

const punchSounds = [];
let lastPunchSoundIndex = 0;
for (let index = 1; index <= 3; index++) {
    let fileName = 'fx/punch_' + index + '.wav'

    const punchSound = new THREE.Audio( Listener );
    AudioLoader.load( fileName , buffer => {
        punchSound.setBuffer( buffer );
        punchSound.setVolume( 0.05 );

    } );

    punchSounds.push(punchSound);
}
function playPunchSound () 
{
    let randomIndex = Math.floor( Math.random() * 2 ) + 1;
    lastPunchSoundIndex = randomIndex;
    
    if ( AudioLoader && Listener )
        punchSounds[randomIndex].play();
}
function stopPunchSound () { punchSounds[ lastPunchSoundIndex ].stop() }

const hitSounds = [];
let lastHitSoundIndex = 0;
for ( let index = 1; index <= 10; index++ ) {
    let fileName = 'fx/hit_' + index + '.wav';

    const punchSound = new THREE.Audio( Listener );
    AudioLoader.load( fileName, buffer => {
        punchSound.setBuffer( buffer );
        punchSound.setVolume( 0.05 );

    } );

    hitSounds.push( punchSound );
}
function playHitSound () {
    let randomIndex = Math.floor( Math.random() * 9 ) + 1;
    lastHitSoundIndex = randomIndex;

    if ( AudioLoader && Listener )
        hitSounds[ randomIndex ].play();
}
function stopHitSound () { hitSounds[ lastHitSoundIndex ].stop(); }


const superSound = new THREE.Audio( Listener );
AudioLoader.load( 'fx/james_super.wav', SuperBuffer => {
    superSound.setBuffer( SuperBuffer );
    superSound.setVolume( 0.1 );
} );
function playSuperSound () { superSound.play(); }
function stopSuperSound () { superSound.stop(); }


/****************************
*  Player Animation Setup
****************************/
function MC_Actions () {
    if ( MC_IsPunching ) {
        switch ( MC_Combo ) {
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
       // MC_Combo = 0;
        playAnimation( "walk" );
    }

}

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

    if ( (MC_IsPunching || MC_IsSuper) && !GotLastTimeAnimationWasUsed )
    {
        if ( toAction.realAnimationTime )
        {
            AnimationDuration = toAction.realAnimationTime;
            //console.log( AnimationDuration );
        }

        if( MC_IsSuper )
            AnimationDuration = MC_SuperAnimationTime;

        //console.log("AnimationDuration: " + AnimationDuration )

        GotLastTimeAnimationWasUsed = true;
        AnimationStartTime = animationTimer;
        AnimationEndTime = AnimationStartTime + AnimationDuration;


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
        stopPunchSound();
    }

    if ( animationTimer > AnimationEndTime + MC_SuperCooldownValue )
    {
        MC_SuperCooldown = false;
        //console.log( "Super available..." )
    }
    if( MC_IsSuper )
    {
        // console.log( "animationTimer < AnimationEndTime : " + animationTimer < AnimationEndTime );
        // console.log( "MC_IsSuper: " + MC_IsSuper );
        // console.log( "!MC_SuperCooldown: " + !MC_SuperCooldown )
    }
    if ( !MC_SuperCooldown && MC_IsSuper && animationTimer < AnimationEndTime )
    {
        MC_IsPunching = false;

        if ( !SuperCooldownClockStarted ) {
            SuperCooldownClockStarted = true;
            MC_IsSuper = true;
            MC_SuperCooldown = true;
        }

        // console.log( "SoundNotPlayedSuper: " + SoundNotPlayedSuper )
        if ( SoundNotPlayedSuper ) {
            SoundNotPlayedSuper = false;
            playSuperSound();
        }

    } else if ( animationTimer > AnimationEndTime && MC_IsSuper ) {
        SoundNotPlayedSuper = true;
        MC_IsSuper = false;
        stopSuperSound();
        // console.log( "Super Cooldown." );
        // console.log( "MC_IsSuper: " + MC_IsSuper );
        // console.log( "!MC_SuperCooldown: " + !MC_SuperCooldown )
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

/****************************
*  NPC Animation Setup
****************************/

function NPC_Actions ( state ) {
    if ( state == "attack" )
    {
        playNPCAnimation( "attack" );
    }    
    else if ( state == "hit" ) {
        //MC_Combo = 0;
        playNPCAnimation( "hit" );
    }
    else if ( state == "idle" ) {
        //MC_Combo = 0;
        playNPCAnimation( "idle" );
    }
    else if ( state == "walk" ) {
        //MC_Combo = 0;
        playNPCAnimation( "walk" );
    }

}

function playNPCAnimation ( thisAnimation ) {
    switch ( thisAnimation ) {
        case "idle":
            setNPCAction( NPC_AnimationActions[ 0 ] );
            break;

        case "hit":
            setNPCAction( NPC_AnimationActions[ 2 ] );
            break;

        case "walk":
            setNPCAction( NPC_AnimationActions[ 1 ] );
            break;

        // case "attack":
        //     setNPCAction( NPC_AnimationActions[ 3 ] );
        //     break;

        // case "punch2":
        //     setNPCAction( NPC_AnimationActions[ 4 ] );
        //     break;

        // case "punch3":
        //     setNPCAction( NPC_AnimationActions[ 5 ] );
        //     break;

        default:
            setNPCAction( NPC_AnimationActions[ 0 ] );
            break;
    }
}

let NPC_GotLastTimeAnimationWasUsed = false;
let NPC_SoundNotPlayedPunch = true;
let NPC_AnimationStartTime = 0;
let NPC_AnimationEndTime = 0;

function setNPCAction ( toAction ) {
    let AnimationDuration = toAction.time;

    if ( toAction.realAnimationTime ) {
        AnimationDuration = toAction.realAnimationTime;
        //console.log( AnimationDuration );
    }

    //console.log( "NPC AnimationDuration: " + AnimationDuration );

    if ( NPC_isHit && !NPC_GotLastTimeAnimationWasUsed )
    {
     
        GotLastTimeAnimationWasUsed = true;
        NPC_AnimationStartTime = animationTimer;
        NPC_AnimationEndTime = NPC_AnimationStartTime + AnimationDuration;

    }
    // Keep the Animation of the Action    
    if ( animationTimer < AnimationEndTime && NPC_isHit ) {
        if ( NPC_SoundNotPlayedPunch ) {
            NPC_SoundNotPlayedPunch = false;
            NPC_isHit = true;
            NPC_isIdle = false;
            playHitSound();
        }
    } else {
        NPC_SoundNotPlayedPunch = true;
        NPC_isHit = false;
        NPC_isIdle = true;
        stopHitSound();
    }


    // if ( animationTimer > AnimationEndTime + MC_SuperCooldownValue ) {
    //     MC_SuperCooldown = false;
    //     //console.log( "Super available..." )
    // }
    // if ( MC_IsSuper ) {
    //     console.log( "animationTimer < AnimationEndTime : " + animationTimer < AnimationEndTime );
    //     console.log( "MC_IsSuper: " + MC_IsSuper );
    //     console.log( "!MC_SuperCooldown: " + !MC_SuperCooldown );
    // }
    // if ( animationTimer < AnimationEndTime && MC_IsSuper && !MC_SuperCooldown ) {
    //     MC_IsPunching = false;

    //     if ( !SuperCooldownClockStarted ) {
    //         SuperCooldownClockStarted = true;
    //         MC_IsSuper = true;
    //         MC_SuperCooldown = true;
    //     }

    //     console.log( "SoundNotPlayedSuper: " + SoundNotPlayedSuper );
    //     if ( SoundNotPlayedSuper ) {
    //         SoundNotPlayedSuper = false;
    //         playSuperSound();
    //     }

    // } else if ( animationTimer > AnimationEndTime && MC_IsSuper ) {
    //     SoundNotPlayedSuper = true;
    //     MC_IsSuper = false;
    //     stopSuperSound();
    //     console.log( "Super Cooldown." );
    //     console.log( "MC_IsSuper: " + MC_IsSuper );
    //     console.log( "!MC_SuperCooldown: " + !MC_SuperCooldown );
    // }

    if ( animationTimer > AnimationEndTime ) {
        GotLastTimeAnimationWasUsed = false;
    }

    // Changing animation and blend
    if ( toAction != NPC_ActiveAction ) {
        NPC_LastAction = NPC_ActiveAction;
        NPC_ActiveAction = toAction;
        //NPC_LastAction.stop()
        NPC_LastAction.fadeOut( 0.2 );
        NPC_ActiveAction.reset();
        NPC_ActiveAction.fadeIn( 0.2 );
        NPC_ActiveAction.play();
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
            camera.position.y,
            camera.position.z
        );
        camera.position.copy( CAM_Position );
    }
    else if ( MC_Position.x - CAM_CurrentPos.x < - CAM_MovementOffset ) {
        const CAM_Position = new THREE.Vector3
            (
                MC_Position.x + CAM_MovementOffset,
                camera.position.y,
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

function updateAnimations()
{
    delta = clock.getDelta();
    animationTimer = clock.getElapsedTime();

    let facingDirection = 0.75;

    if( MCMixer && NPCMixer )
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
                if( MC_Position.x > 1 )
                {
                    MC_Position.x = 1;
                }

                MC_Rotation.y = Math.PI / 2;

            }

            if ( keyboard.right ) 
            {
                MC_Position.x -= MC_MoveSpeed;
                if ( MC_Position.x < -28 ) 
                {
                    MC_Position.x = -28;
                }
                MC_Rotation.y = - Math.PI / 2;

            }

            MC_Model.rotation.copy( MC_Rotation );
            MC_Model.position.copy( MC_Position );
        }

        // Hitbox

        if ( MC_Rotation.y == - Math.PI / 2 )
            facingDirection = 0.6;

        if ( MC_Rotation.y == Math.PI / 2 )
            facingDirection = -0.6;

        if( MC_IsSuper )
        {
            facingDirection = 0;
            MC_HitboxPunch.scale.set( 2.5, 1.25, 1 );
        } else {
            MC_HitboxPunch.scale.set( 0.6, 1.25, 0.5 );
        }

        console.log( MC_Position.x )
        if ( MC_Position.z >= -1.35 && ( MC_Position.x > -11 || MC_Position.x < -15.5 ) )
            MC_Position.y = 0;
        else
            MC_Position.y = -0.3;


        MC_Actions();

    }
 
    let MC_hitboxPunchPosition = new THREE.Vector3( MC_Position.x - facingDirection, MC_Position.y + 1, MC_Position.z );
    let MC_hitboxHitPosition = new THREE.Vector3( MC_Position.x, MC_Position.y + 1, MC_Position.z );

    MC_HitboxPunch.position.copy( MC_hitboxPunchPosition );
    MC_HitboxHit.position.copy( MC_hitboxHitPosition );


    //light.position.x = -15 + MC_Position.x;

}

function updateNPCAnimations ()
{
    let facingDirection = 0.75;

    if ( StartAnimations && MixerReady ) {
        NPCMixer.update( delta );

        // NPC Facing the player
        if( MC_Position.x > NPC_Position.x )
        {
            NPC_Rotation.y = Math.PI / 2;
        } else {
            NPC_Rotation.y = -Math.PI / 2;
        }

        if ( NPC_isHit ) {
            NPC_Actions( "hit" );
        }else if( NPC_isWalking )
        {
            NPC_Actions( "walk" );
        }
        else if( NPC_isIdle )
        {
            NPC_Actions( "idle" );
        }

        // console.log( "NPC_Position.x: " + NPC_Position.x )
        // console.log( "MC_Position.x - NPC_Position.x: " + ( Math.round( MC_Position.x - NPC_Position.x ) ) );
        // Makes the enemy goes to the Player
        if ( Math.abs(MC_Position.x - NPC_Position.x) > 1.5)
        {
            if (  MC_Position.x - NPC_Position.x < 1.5 ) {
                NPC_isWalking = true;
                NPC_isIdle = false;
                NPC_Position.x -= NPC_MoveSpeed;
             }

            else if ( MC_Position.x - NPC_Position.x > 1.5 ) {
                NPC_isWalking = true;
                NPC_isIdle = false;
                NPC_Position.x += NPC_MoveSpeed;
            } 
            
        } 
        if ( MC_Position.z - NPC_Position.z != 0.1 )
        {
            if ( MC_Position.z - NPC_Position.z < 0.1 ) 
            {
                NPC_isWalking = true;
                NPC_isIdle = false;
                NPC_Position.z -= NPC_MoveSpeed;
            } 
            else if ( MC_Position.z - NPC_Position.z > 0.1 ) 
            {
                NPC_isWalking = true;
                NPC_isIdle = false;
                NPC_Position.z += NPC_MoveSpeed;
            }
        }

        if ( Math.abs( MC_Position.x - NPC_Position.x ) < 1.5 )
        {
            NPC_isIdle = true;
            NPC_isWalking = false;
        }
        
        if ( MC_Position.z - NPC_Position.z > 0.15 )
        {
            NPC_isIdle = false;
            NPC_isWalking = true;
        }
        else {
            NPC_isIdle = true;
        }

        if ( NPC_Position.z >= -1.35 && ( NPC_Position.x > -11 || NPC_Position.x < -15.5 ) )
            NPC_Position.y = 0;
        else
            NPC_Position.y = -0.3;


        NPC_Model.rotation.copy( NPC_Rotation );
        NPC_Model.position.copy( NPC_Position );
    }

    if ( NPC_Rotation.y == - Math.PI / 2 )
        facingDirection = 0.25;

    if ( NPC_Rotation.y == Math.PI / 2 )
        facingDirection = -0.25;

    let NPC_hitboxPosition = new THREE.Vector3( NPC_Position.x - facingDirection, NPC_Position.y + 1, NPC_Position.z );

    NPC_Hitbox.position.copy( NPC_hitboxPosition );
}

function updatePhysics() 
{
    // Step the physics world
    world.step( timeStep );

    // Copy coordinates from Cannon.js to Three.js
    // mesh.position.copy( body.position );
    // mesh.quaternion.copy( body.quaternion );
}

function checkCollisions()
{
    // Making the Bounding Boxes attach to the original Geometry
    MC_HitboxPunchBB.copy( MC_HitboxPunch.geometry.boundingBox ).applyMatrix4( MC_HitboxPunch.matrixWorld );
    MC_HitboxHitBB.copy( MC_HitboxHit.geometry.boundingBox ).applyMatrix4( MC_HitboxHit.matrixWorld );
    NPC_HitboxBB.copy( NPC_Hitbox.geometry.boundingBox ).applyMatrix4( NPC_Hitbox.matrixWorld );

    // Hitted punch. outch
    if( MC_HitboxPunchBB.intersectsBox(NPC_HitboxBB) && MC_IsPunching ) 
    {
        NPC_isHit = true;
    }

    // Super hitted. outch
    if ( MC_HitboxPunchBB.intersectsBox( NPC_HitboxBB ) && MC_IsSuper ) {
        NPC_isHit = true;
    }
}

function animate()
{     
    requestAnimationFrame( animate );

    handleCamera();
    updateAnimations();
    updateNPCAnimations();
    updatePhysics();
    checkCollisions();

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
}