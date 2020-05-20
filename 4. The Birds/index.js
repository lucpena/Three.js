import * as THREE from "../src/build/three.module.js"
import {Water} from "../src/examples/jsm/objects/Water.js"
import {Sky} from "../src/examples/jsm/objects/Sky.js"
import {GLTFLoader} from "../src/examples/jsm/loaders/GLTFLoader.js";

function main(){
    //INITIALIZATION
    const canvas = document.querySelector("#c");
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.shadowMap.enabled = true;
    render.shadowMapType = THREE.PCFShadowMap;
    const scene = new THREE.Scene();
    let clock = new THREE.Clock();

    //CAMERA
    const fov = 40;
    const aspect = 2;
    const near = 0.1;
    const far = 20000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(450, 50, 100);
    scene.add(camera);

    //LIGHT 
    //SUN
    const sunIntencity = 1;
    const sunLightColor = 0xFFFFFF;
    const sunLight = new THREE.DirectionalLight(sunLightColor, sunIntencity);

    sunLight.castShadow = true;
    sunLight.shadow.camera.top = 180;
    sunLight.shadow.camera.bottom = -120;
    sunLight.shadow.camera.left = -120;
    sunLight.shadow.camera.right = 120;
    sunLight.shadowCameraVisible = true;

    scene.add(sunLight);

    //AMBIENT LIGHT
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    const hLight = new THREE.HemisphereLight(0xFFFFFF, 0x001E0F, 0.8);
    hLight.position.set(0,50,-150);
    scene.add(hLight);

    //<-===SCENE ELEMENTS===->

    //OCEAN
    const waterSize = 10000;
    const waterGeometry = new THREE.PlaneBufferGeometry(waterSize, waterSize);

    let water = new Water(
        waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load("./img/waternormals.jpg", function(texture){
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            alpha: 1,
            sunDirection: sunLight.position.clone().normalize(),
            sunColor: 0xFFFFFF,
            waterColor: 0x001E0F,
            distortionScale: 7,
            side: THREE.DoubleSide,
            fog: scene.fog !== undefined
        }
    );

    water.rotation.x = -Math.PI / 2;
    water.castShadow = false;
    water.receiveShadow = true;
    scene.add(water);

    //SKYBOX
    const sky = new Sky();
    const uniforms = sky.material.uniforms;

    uniforms['turbidity'].value = 8;
    uniforms['rayleigh'].value = 2;
    uniforms['luminance'].value = 1.1;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        distance: 400,
        inclination: 0.49,
        azimuth: 0.205
    }

    const cubeCamera = new THREE.CubeCamera(0.1, 1, 512);
    cubeCamera.renderTarget.texture.generateMipmaps = true;
    cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
    scene.background = cubeCamera.renderTarget;

    function updateSun(){
        const theta = Math.PI * (parameters.inclination - 0.5);
        const phi = 2 * Math.PI * (parameters.azimuth - 0.5);

        sunLight.position.x = parameters.distance * Math.cos(phi);
        sunLight.position.y = parameters.distance * Math.sin(phi) * Math.sin(theta);
        sunLight.position.z = parameters.distance * Math.sin(phi) * Math.cos(theta);

        sky.material.uniforms['sunPosition'].value = sunLight.position.copy(sunLight.position);
        water.material.uniforms['sunDirection'].value.copy(sunLight.position).normalize();
        cubeCamera.update(renderer, sky);
    }

    updateSun();

    //MESHES
    const mixer = new THREE.AnimationMixer(scene);
    const loader = new GLTFLoader();
    let morphs = [];

    function addMesh(mesh, clip, speed, duration, x, y, z, fudgeColor){
        mesh = mesh.clone();
        mesh.material = mesh.material.clone()

        if(fudgeColor){
            mesh.material.color.offsetHSL(0, Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25);
        }

        mesh.speed = speed;
        mixer.clipAction(clip, mesh).
              setDuration(duration).
              startAt(-duration * Math.random()).
              play();

        mesh.position.set(x, y, z);
        mesh.rotation.y = Math.PI / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add(mesh);
        morphs.push(mesh);

    }

    loader.load("gltf/Flamingo.glb", function(gltf){
        const mesh = gltf.scene.children[0];
        const clip = gltf.animations[0];

        addMesh(mesh, clip, 550, 1, 200 - Math.random() * 500, 200 + Math.random() * 200, -2000);
        addMesh(mesh, clip, 550, 1, 200 - Math.random() * 500, 200 + Math.random() * 200, -1800);
        addMesh(mesh, clip, 550, 1, 200 - Math.random() * 500, 200 + Math.random() * 200, -1600);
        addMesh(mesh, clip, 550, 1, 200 - Math.random() * 1000, 200 + Math.random() * 200, -1400);
        addMesh(mesh, clip, 550, 1, 200 - Math.random() * 1000, 200 + Math.random() * 200, -1200);
        addMesh(mesh, clip, 550, 1, 200 - Math.random() * 1000, 200 + Math.random() * 200, -1000);
    });

    //STORK
    loader.load("gltf/Stork.glb", function(gltf){
        const mesh = gltf.scene.children[0];
        const clip = gltf.animations[0];

        addMesh(mesh, clip, 450, 0.5, 500 - Math.random() * 500, 450, -1500);
        addMesh(mesh, clip, 450, 0.5, 500 - Math.random() * 500, 450, -1800);
    });

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

    //RENDERING THE SCENE
    function render(){
        let time = performance.now() / 1000;
        let delta = clock.getDelta();

        mixer.update(delta);

        for (let index = 0; index < morphs.length; index++) {
            const morph = morphs[index];
            morph.position.x += morph.speed * delta;

            if (morph.position.x > 2000) {
                morph.position.x = -1000 - Math.random() * 500;
            }
        }

        if(resizeRendererToDisplaySize(renderer)){
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        water.material.uniforms['time'].value += 1 / 60;

        camera.position.y = 50 + (Math.sin(time * 1.2) * 4);
        camera.position.x = 450 + (Math.sin(time * 0.6) * 8);

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();