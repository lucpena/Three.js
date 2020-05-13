import * as THREE from "../src/build/three.module.js"
import {Water} from "../src/examples/jsm/objects/Water.js"
import {Sky} from "../src/examples/jsm/objects/Sky.js"
import {GLTFLoader} from "../src/examples/jsm/loaders/GLTFLoader.js"
import {DRACOLoader} from "../src/examples/jsm/loaders/DRACOLoader.js";
import {FBXLoader} from "../src/examples/jsm/loaders/FBXLoader.js"

function main(){
    //INITIALIZATION 
    const canvas = document.querySelector("#c");
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    const scene = new THREE.Scene();
    renderer.shadowMap.enabled = true;
    renderer.shadowMapType = THREE.PCFSoftShadowMap;

    let animationTimer;
    const clock = new THREE.Clock();

    //CAMERA
    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 20000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(30, 35, 70);
    camera.lookAt(0, 22, 0);
    scene.add(camera);

    //ILLUMINATION
    //SUN LIGHT
    const dLightColor = 0xFFFFFF;
    const dIntensity = 1;
    const dLight = new THREE.DirectionalLight(dLightColor, dIntensity);
    dLight.castShadow = true;
    dLight.shadow.camera.top = 180;
    dLight.shadow.camera.bottom = - 120;
    dLight.shadow.camera.left = - 120;
    dLight.shadow.camera.right = 120;
    dLight.shadowCameraVisible = true;
    scene.add(dLight);

    //HELPER LIGHTS
    const hLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 0.3);
    hLight.color.setHSL(1, 1, 1); // (HUE, SATURATION, LIGHTNESS)
    hLight.position.set(0, 0, 0);
    scene.add(hLight);

    const helperLightColor = 0xFFFFFF;
    const helperLightIntensity = 0.4;
    const helperLight = new THREE.DirectionalLight(helperLightColor, helperLightIntensity);
    helperLight.position.set(0, 200, 0);
    scene.add(helperLight);

    //LOADING SCREEN
    const loadingManager = new THREE.LoadingManager(() => {
        const loadingScreen = document.getElementById("loading-screen");
        loadingScreen.classList.add("fade-out");
        loadingScreen.addEventListener("transitionend", onTransitionEnd);
    });

    function onTransitionEnd( event ) {
        event.target.remove();
    }

    //---SCENE ELEMENTS---//
    //OCEAN
    const waterSize = 10000;
    const waterGeometry = new THREE.PlaneBufferGeometry(waterSize, waterSize);

    let water = new Water(
        waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader(loadingManager).load("../src/examples/textures/waternormals.jpg", function (texture){

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            }),
            alpha: 1,
            sunDirection: dLight.position.clone().normalize(),
            sunColor: 0xFFFFFF,
            waterColor: 0x001E0F,
            distortionScale: 2,
            fog: scene.fog !== undefined
        }
    );
    
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    //SKYBOX
    const sky = new Sky();
    const uniforms = sky.material.uniforms;

    uniforms['turbidity'].value = 10;
    uniforms['rayleigh'].value = 2;
    uniforms['luminance'].value = 1;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        distance: 400,
        inclination: 0.488,
        azimuth: 0.205
    };

    const cubeCamera = new THREE.CubeCamera(0.1, 1, 512);
    cubeCamera.renderTarget.texture.generateMipmaps = true;
    cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
    scene.background = cubeCamera.renderTarget;

    function updateSun(){
        const theta = Math.PI * (parameters.inclination - 0.5);
        const phi = 2 * Math.PI * (parameters.azimuth - 0.5);

        dLight.position.x = parameters.distance * Math.cos(phi);
        dLight.position.y = parameters.distance * Math.sin(phi) * Math.sin(theta);
        dLight.position.z = parameters.distance * Math.sin(phi) * Math.cos(theta);

        sky.material.uniforms['sunPosition'].value = dLight.position.copy(dLight.position);
        water.material.uniforms['sunDirection'].value.copy(dLight.position).normalize();

        cubeCamera.update(renderer, sky);
    }

    updateSun();

    //TEXTURE LOADER FOR THE ELEMENTS
    const TexLoader = new THREE.TextureLoader();

    //---ASPHALT---
    const asphaltTexture = new TexLoader.load("props/asphalt/Asphalt_005_COLOR.jpg");
    const asphaltBumpMap = new TexLoader.load("props/asphalt/Asphalt_005_OCC.jpg");
    const asphaltNormal = new TexLoader.load("props/asphalt/Asphalt_005_NORM.jpg");

    asphaltTexture.wrapS = asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.x = asphaltTexture.repeat.y = 1;

    // MAKING THE TEXTURE THE RIGHT ASPECT RATIO WITH THE MESH (400, 100) -> 4/1
    const asphaltMult = 10;
    asphaltTexture.repeat.set(6 * asphaltMult, asphaltMult);
    asphaltBumpMap.repeat.set(6 * asphaltMult, asphaltMult);
    asphaltNormal.repeat.set(6 * asphaltMult, asphaltMult);

    const asphalt = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(600, 100), 
        new THREE.MeshPhongMaterial({
            map: asphaltTexture,
            bumpMap: asphaltBumpMap,
            normalMap: asphaltNormal
        }),
    );

    asphalt.rotation.x = -Math.PI / 2;
    asphalt.renderOrder = 1;
    asphalt.castShadow = true;
    asphalt.receiveShadow = true;
    scene.add(asphalt);

    //---SIDEWALK---
    const sidewalkWidth = 800;
    const sidewalkHeight = 4;
    const sidewalkDepth = 50;

    const sidewalkTexture = new TexLoader.load("props/sidewalk/Pavement_COLOR.png");
    const sidewalkBumpMap = new TexLoader.load("props/sidewalk/Pavement_SPEC.png");
    const sidewalkNormal = new TexLoader.load("props/sidewalk/Pavement_NRM.png");
    sidewalkTexture.wrapS = sidewalkTexture.wrapT = THREE.RepeatWrapping;

    const sidewalkGeometry = new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, sidewalkDepth);
    const sidewalkMaterial = new THREE.MeshPhongMaterial({
        map:sidewalkTexture,
        bumpMap: sidewalkBumpMap,
        normalMap: sidewalkNormal
    });

    const sideMult = 2.5;
    sidewalkTexture.repeat.set(20 * sideMult, sideMult);
    sidewalkBumpMap.repeat.set(20 * sideMult, sideMult);
    sidewalkNormal.repeat.set(20 * sideMult, sideMult);

    const sidewalkMesh = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);

    sidewalkMesh.position.set(0, 0, -75);
    sidewalkMesh.castShadow = true;
    sidewalkMesh.receiveShadow = true;
    scene.add(sidewalkMesh);

    //---LITTE WALL---
    const wallWidth = 700;
    const wallHeight = 10;
    const wallDepth = 5;

    const wallTexture = new TexLoader.load("props/wall/Wall_Base_Color.jpg");
    const wallBumpMap = new TexLoader.load("props/wall/Wall_Height.png");
    const wallNormal = new TexLoader.load("props/wall/Wall_Normal.jpg");
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;

    const wallGeometry =  new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
    const wallMaterial = new THREE.MeshPhongMaterial({
        map: wallTexture,
        bumpMap: wallBumpMap,
        normalMap: wallNormal
    });

    const wallMult = 5;
    wallTexture.repeat.set(wallMult, wallMult / 40);
    wallBumpMap.repeat.set( wallMult, wallMult / 40);
    wallNormal.repeat.set(wallMult, wallMult / 40);

    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

    wallMesh.position.set(0, 5, -100);
    wallMesh.receiveShadow = true;
    wallMesh.castShadow = true;
    scene.add(wallMesh);

    //---BEACH---

    const beachTexture = new TexLoader.load("props/sand/Sand_basecolor.jpg");
    const beachNormal = new TexLoader.load("props/sand/Sand_normal.jpg");
    beachTexture.wrapS = beachTexture.wrapT = THREE.RepeatWrapping;

    const sandMult = 50;
    beachTexture.repeat.set(3 * sandMult, sandMult);
    beachNormal.repeat.set(3 * sandMult, sandMult);

    const beachRadius = 189;
    const beachHeight = 1000;
    const beachRadialSegments = 50;
    const beachGeometry = new THREE.CylinderGeometry(beachRadius, beachRadius, beachHeight, beachRadialSegments);
    const beachMaterial = new THREE.MeshPhongMaterial({ 
        map: beachTexture,
        normalMap: beachNormal
    }); 
    const beachMesh = new THREE.Mesh(beachGeometry, beachMaterial);
    beachMesh.position.set(0, -180, -190);
    beachMesh.rotation.set(55, 0, 55);
    scene.add(beachMesh);

    //GLTF LOADERS
    const dracoLoader = new DRACOLoader(loadingManager);
    dracoLoader.setDecoderPath("props/js/");

    const loader = new GLTFLoader(loadingManager);
    loader.setDRACOLoader(dracoLoader);
    let wheels = [];

    //---FERRARI---
    loader.load("props/ferrari-italia/ferrari.glb", function( gltf ){
        const carModel = gltf.scene.children[0];

        const shadowTexture = new THREE.TextureLoader().load("props/ferrari-italia/ferrari_ao.png");
        const shadow = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(0.655 * 4, 1.3 * 4),
            new THREE.MeshBasicMaterial({
                map: shadowTexture,
                opacity: 0.7,
                transparent: true
            })
        ); 
        shadow.rotation.x = - Math.PI / 2;
        shadow.renderOrder = 2;
        carModel.add(shadow);

        wheels.push(
            carModel.getObjectByName("wheel_fl"),
            carModel.getObjectByName("wheel_fr"),
            carModel.getObjectByName("wheel_rl"),
            carModel.getObjectByName("wheel_rr")
        );

        carModel.scale.set(12, 12, 12);
        carModel.position.set(0, 0.1, 0);
        carModel.rotation.y = Math.PI / 2;
        carModel.receiveShadow = true;
        carModel.castShadow = true;
        scene.add(carModel);
    });

    //===DRIVER===
    const fbxLoader = new FBXLoader(loadingManager);
    let mixer;
    fbxLoader.load("props/driver/driver.fbx", function(fbx){
        mixer = new THREE.AnimationMixer(fbx);
        const action = mixer.clipAction(fbx.animations[0]);

        fbx.traverse(function(child){
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.transparent = false;
            }
        });

        fbx.scale.set(0.1, 0.1, 0.1);
        fbx.position.set(0, -0.8, 4.5);
        fbx.rotation.y = -Math.PI / 2;
        action.play();
        scene.add(fbx);
    },
    undefined,
    function(e){
        console.error(e);
    });

    //CHECK IF THE CANVAS NEED RESIZE
    function resizeRendererToDisplaySize(render){
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;

        if (needResize) {
            render.setSize(width, height, false);
        }

        return needResize;
    }

    //RENDER LOOP

    function render(){
        let time = performance.now() / 1000;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        water.material.uniforms['time'].value += 1 / 60;
        
        //MOVING THE TEXTURES
        const speed = 5;

        //ASPHALT
        asphaltTexture.offset.x -= 0.016 * speed;
        asphaltBumpMap.offset.x -= 0.016 * speed;
        asphaltNormal.offset.x -= 0.016 * speed;

        //SIDEWALK
        sidewalkTexture.offset.x -= 0.028 * speed;
        sidewalkBumpMap.offset.x -= 0.028 * speed;
        sidewalkNormal.offset.x -= 0.028 * speed;

        //LITTLE WALL
        wallTexture.offset.x -= 0.0035 * speed;
        wallBumpMap.offset.x -= 0.0035 * speed;
        wallNormal .offset.x -= 0.0035 * speed;

        //BEACH
        beachTexture.offset.y -= 0.0052 * speed;
        beachNormal.offset.y -= 0.0052 * speed;

        for ( let i = 0; i < wheels.length; i ++ ) {

            wheels[ i ].rotation.x = - (4.5 * time *  Math.PI);

        }

        animationTimer = clock.getDelta();
        if(mixer){
            mixer.update(animationTimer);
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main()