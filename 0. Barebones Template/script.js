import * as THREE from "three";
//import * as CANNON from "cannon";

import Stats from "statssrc";
import { FBXLoader } from "fbxsrc";
import { GUI } from "guisrc";
import { GLTFLoader } from "gltfsrc";





// Resize the window on size change
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}