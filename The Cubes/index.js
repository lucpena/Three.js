import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js";

function main(){
    //INITIALIZATION
    const canvas = document.querySelector("#c");
    const renderer = new THREE.WebGLRenderer({canvas});
    const scene = new THREE.Scene();

    //CAMERA
    const fov = 75;
    const aspect = 2; // Canvas Default
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;

    //ILLUMINATION
    const lightColor = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(lightColor, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);

    //CUBE
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    //CREATE THE CUBES
    function makeInstance(geometry, color, x){
        const material = new THREE.MeshPhongMaterial({color});
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        cube.position.x = x;

        return cube;
    }

    const cubes = [
        makeInstance(geometry, 0x650D89, 0),
        makeInstance(geometry, 0x2DE2E6, -2),
        makeInstance(geometry, 0xF6019D, 2),
    ];

    //CHECK BROWSER SIZE
    function resizeRendererToDisplaySize(render){
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if(needResize){
            render.setSize(width, height, false);
        }

        return needResize;
    }

    //RENDER THE SCENE
    function render(time){
        //CONVERT TIME TO SECONDS
        time *= 0.001;

        //CHECK IF RESIZE IS NEEDED
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

         //RECALCULATE THE ASPECT RATIO
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        
        //ROTATE THE CUBES
        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.1;
            const rot = time * speed;

            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
