import * as THREE from "../src/build/three.module.js"
import {FBXLoader} from "../src/examples/jsm/loaders/FBXLoader.js"

function main(){
    //INITIALIZATION
    const canvas = document.querySelector("#c");

    const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true; //NEED THIS TO CAST SHADOWS!!!

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 300, 1000);

    const clock = new THREE.Clock();
    let delta, angle = 0, radius = 300;

    //CAMERA
    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 5000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 200, 400);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    //ILLUMINATION
    const colorLight = 0xFFFFFF;
    const intensity = 0.8;
    const light = new THREE.DirectionalLight(colorLight, intensity);
    light.position.set(-80, 250, 200);
    light.castShadow = true;
    light.shadow.camera.top = 180;
    light.shadow.camera.bottom = - 100;
    light.shadow.camera.left = - 120;
    light.shadow.camera.right = 120;
    scene.add(light);

    const hLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 0.7);
    hLight.color.setHSL(1, 1, 1); // (HUE, SATURATION, LIGHTNESS)
    hLight.position.set(0, 50, 0);
    scene.add(hLight);

    //GROUND
    const mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0xCCCCCC, depthWrite: true } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    //GROUND GRID
    const grid = new THREE.GridHelper( 2000, 80, 0x000000, 0x000000 );
    grid.material.opacity = 0.1;
    grid.material.transparent = true;
    scene.add(grid);

    //ANIMATION CONTROLLER
    let mixer;
    const loader = new FBXLoader();
    loader.load("fbx/kachujin.fbx", function(obj){
        mixer = new THREE.AnimationMixer(obj);
        const action = mixer.clipAction(obj.animations[0]);
        
        obj.traverse(function(child){
            if (child.isMesh) {
                child.castShadow = true;
				child.receiveShadow = true;
                child.material.transparent = false;
            }
        });

        action.play();
        scene.add(obj);
    }, 

    undefined, 
    //RETURN ERRORS FROM loader()
    function (e){
        console.error(e);
    });
    

    //CHECK IF BROWSER NEED RESIZE
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

    //SCENE RENDERER
    function render(){

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        delta = clock.getDelta();
        if (mixer) {
            mixer.update(delta);
        }

        //ROTATING THE CAMERA :)
        camera.lookAt(0, 100, 0);
        angle += 0.005;
        camera.position.x = radius * Math.cos (angle);
        camera.position.z = radius * Math.sin(angle);
        

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);

}

main();
