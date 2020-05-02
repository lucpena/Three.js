import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js";
import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';

function main(){
    //INITIALIZATION
    const canvas = document.querySelector("#c");
    const renderer = new THREE.WebGLRenderer({canvas});
    const scene = new THREE.Scene();
    const gui = new GUI();
    
    //VARIABLES
    const objects = [];

    //CAMERA
    const fov = 12;
    const aspect = 2;
    const near = 0.1;
    const far = 5000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 50, -100);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    //LIGHT
    const lightColor = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.PointLight(lightColor, intensity);
    scene.add(light);

    //  ---SCENE ELEMENTS---

    //SOLAR SYSTEM
    const solarSystem = new THREE.Object3D();
    const earthOrbit = new THREE.Object3D();
    const moonOrbit = new THREE.Object3D();
    earthOrbit.position.x = 10;
    solarSystem.add(earthOrbit);
    scene.add(solarSystem);
    objects.push(earthOrbit);
    objects.push(solarSystem);

    //SUN
    const radius = 1;
    const widthSegments = 7;
    const heightSegments = 7;
    const sphereGeometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);
    const sunMaterial = new THREE.MeshPhongMaterial({emissive: 0xFFFF00});
    const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
    sunMesh.scale.set(5, 5, 5);
    solarSystem.add(sunMesh);
    objects.push(sunMesh);

    //EARTH
    const earthMaterial = new THREE.MeshPhongMaterial({color: 0x2233FF, emissive: 0x112244});
    const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
    earthMesh.position.x = 10;
    solarSystem.add(earthMesh);
    objects.push(earthMesh);

    //MOON
    moonOrbit.position.x = 2;
    earthOrbit.add(moonOrbit);
    const moonMaterial = new THREE.MeshPhongMaterial({color: 0x888888, emissive: 0x222222});
    const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
    moonMesh.scale.set(0.5, 0.5, 0.5);
    moonOrbit.add(moonMesh);
    objects.push(moonMesh);

    //HELPER AXES
    class AxisGridHelper{
        constructor(node, units = 10){
            const axes = new THREE.AxesHelper();
            axes.material.depthTest = false;
            axes.renderOrder = 2;
            node.add(axes);

            const grid = new THREE.GridHelper(units, units);
            grid.material.depthTest = false;
            grid.renderOrder = 1;
            node.add(grid);

            this.grid = grid;
            this.axes = axes;
            this.visible = false;
        }

        get visible(){
            return this._visible;
        }

        set visible(v){
            this._visible = v;
            this.grid.visible = v;
            this.axes.visible = v;
        }
    }

    function makeAxisGrid(node, label, units){
        const helper = new AxisGridHelper(node, units);
        gui.add(helper, "visible").name(label);
    }

    makeAxisGrid(solarSystem, "solarSystem", 25);
    makeAxisGrid(sunMesh, "sunMesh");
    makeAxisGrid(earthOrbit, "earthOrbit");
    makeAxisGrid(moonMesh, "moonMesh");

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

    //RENDERING LOOP
    function render(time){
        //CONVERT TIME TO SECONDS
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        objects.forEach(obj => {
            obj.rotation.y = time;
        });

        renderer.render(scene, camera);
        requestAnimationFrame(render)
    }

    requestAnimationFrame(render);

}

main();