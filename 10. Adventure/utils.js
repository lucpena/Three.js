import * as THREE from "three";
import { GLTFLoader } from "gltfsrc";
import { FBXLoader } from "fbxsrc";

const JSfile = "utils.js";

// prints a message on the screen console
export function cout(message, title) 
{
    const consoleMessages = document.getElementById("console-messages");

    const messageOnList = document.getElementById(title);
    if(messageOnList)
    {
        consoleMessages.removeChild(messageOnList);
    }

    const theMessage = document.createElement("li");
    theMessage.id = title;
    theMessage.appendChild(document.createTextNode("✅ " + title + ": " + message));
    consoleMessages.appendChild(theMessage);

    // auto scroll to bottom
    const console = document.getElementById("console")
    // console.scrollTo(0, console.scrollHeight);
}

// displays an error on the screen console
export function cerr(message) 
{
    const consoleMessages = document.getElementById("console-messages");
    const theMessage = document.createElement("li");
    theMessage.style.color = "tomato";
    theMessage.style.fontWeight = "bolder";
    theMessage.appendChild(document.createTextNode("⛔ " + message));
    consoleMessages.appendChild(theMessage);

    // auto scroll to bottom
    const console = document.getElementById("console")
    // console.scrollTo(0, console.scrollHeight);
}

// prints a message on the screen console for loading assets
export function coutWarning(message, title) 
{
    const consoleMessages = document.getElementById("console-messages");

    const messageOnList = document.getElementById(title);
    if(messageOnList)
    {
        consoleMessages.removeChild(messageOnList);
    }

    const theMessage = document.createElement("li");
    theMessage.id = title;
    theMessage.appendChild(document.createTextNode("⚠️ " + title + ": " + message));
    theMessage.style.color = "gold";
    consoleMessages.appendChild(theMessage);

    // auto scroll to bottom
    const console = document.getElementById("console")
    // console.scrollTo(0, console.scrollHeight);
}

// glTF loader
export class _glTFLoader
{
    constructor(scene, glTFpath, glTFscale, loadingManager,)
    {

        this._scene = scene;
        this._glTFpath = glTFpath;
        this._glTFscale = glTFscale;
        this._mesh = null;

        const loader = new GLTFLoader(loadingManager);
        loader.load(this._glTFpath, (gltf) => 
        {
            this._mesh = gltf.scene;
            this._mesh.scale.setScalar(this._glTFscale);
            this._mesh.position.set(0, -50, 0);
            scene.add(this._mesh);

             // Acessar animações, se houver
            const mixer = new THREE.AnimationMixer(this._mesh);
            const animations = gltf.animations;
            if (animations && animations.length) {
                const action = mixer.clipAction(animations[0]);
                action.play();
            }
        },
        function (xhr) {
            let loadMsg = (xhr.loaded / xhr.total).toPrecision(4) * 100 + '% loaded...';
            cout(loadMsg, glTFpath)
        },
        function (error) {
            cerr('An error occurred while loading ' + this._glTFpath + ' the glTF model | ' + error);
        });
    }

    set scale(scale) {
        if (this._mesh) {
            this._mesh.scale.setScalar(scale);
        } else {
            coutWarning(this._glTFpath + ' is not loaded yet.', "glTF Loader set Scale");
        }
    }

    set rotation(rotation) {        
        if (this._mesh) {
            if (rotation instanceof THREE.Euler) {
                this._mesh.rotation.copy(rotation); // Usa um THREE.Vector3 para definir a rotação
            } else {
                coutWarning("Expected rotation to be an instance of THREE.Euler.", JSfile + "_glTFLoader | set rotation()");
            }
        } else {
            coutWarning(this._glTFpath + ' is not loaded yet.', JSfile + "_glTFLoader | set rotation()");
        }
    }

    set position(position) {
        if (this._mesh) {
            if (position instanceof THREE.Vector3) {
                this._mesh.position.copy(position); // Usa um THREE.Vector3 para definir a rotação
            } else {
                coutWarning('Expected rotation to be an instance of THREE.Vector3.', JSfile + "_glTFLoader | set position()");
            }
        } else {
            coutWarning(this._glTFpath + ' is not loaded yet.', JSfile + "_glTFLoader | set position()");
        }
    }

    _add( p )
    {
        // console.log(this._model);      
        this._mesh.add( p );
    }

}

// FBX loader
export class _FBXLoader
{
    constructor(scene, FBXpath, FBXscale, loadingManager)
    {
        this._scene = scene;
        this._FBXpath = FBXpath;
        this._FBXscale = FBXscale;
        this._mesh = null;
        
        const loader = new GLTFLoader(loadingManager);
        loader.load(this._FBXpath, (mesh) => 
            {
            cout(this._FBXpath, 1)
            this._mesh = mesh;
            this._mesh.scale.setScalar(1.0);
            // this.mesh.scale.set(3.0, 1.0, 2.0)
            this._mesh.rotation.set(0, -Math.PI/2, 0);
            this._position = this._mesh.position;
            this._FBXpath = FBXpath;

            // shadows
            this._mesh.traverse((object) => {
                if(object.isMesh) object.castShadow = true;
            })

            // add to scene
            this._scene.add(this._mesh);

        },
        function (xhr) {
            let loadMsg = (xhr.loaded / xhr.total).toPrecision(4) * 100 + '% loaded.';
            cout(loadMsg, "Portal Radio");
        },
        function (error) {
            cerr('An error occurred while loading ' + FBXpath + ' the FBX model | ' + error);
        });
    }

    set scale(scale) {
        if (this._mesh) {
            this._mesh.scale.setScalar(scale);
        } else {
            coutWarning(this._FBXpath + ' is not loaded yet.', "FBX Loader set Scale");
        }
    }

    set rotation(rotation) {
        if (this._mesh) {
            if (rotation instanceof THREE.Vector3) {
                this._mesh.rotation.copy(rotation); // Usa um THREE.Vector3 para definir a rotação
            } else {
                coutWarning('Expected rotation to be an instance of THREE.Vector3.', "FBX Loader set Rotation");
            }
        } else {
            coutWarning(this._FBXpath + ' is not loaded yet.', "FBX Loader set Rotation");
        }
    }

    set position(position) {
        if (this._mesh) {
            if (position instanceof THREE.Euler) {
                this._mesh.position.copy(position); // Usa um THREE.Vector3 para definir a rotação
            } else {
                coutWarning('Expected rotation to be an instance of THREE.Euler.', "FBX Loader set Position");
            }
        } else {
            coutWarning(this._FBXpath + ' is not loaded yet.', "FBX Loader set Position");
        }
    }

    add( p )
    {
        this._mesh.add( p );
    }

}

export class SoundEngine
{
    constructor(soundsPaths, sounds, listener, volume)
    {
        this._soundsPaths = soundsPaths;
        this._sounds = sounds;

        const _audioLoader = new THREE.AudioLoader();

        this._soundsPaths.forEach((path) => 
        {           
            const _sound = new THREE.Audio(listener);
            _audioLoader.load(path, (buffer) => 
            {
                _sound.setBuffer(buffer);
                _sound.setLoop(false);
                _sound.setVolume(volume);
            })

            sounds.push(_sound);
        });
    }

    playSound()
    {
        this._sounds[0].play();        
    }

    playRandomSound()
    {
        const sound = this.getRandomSound();
        if(!stepSound.isPlaying)
        {
            sound.play();
        }
    }

    getRandomSound()
    {
        const randomIndex = Math.floor(Math.random() * this._sounds.length);
        return this._sounds[randomIndex];
    }

    setRepeat(value)
    {
        this._sounds.forEach(sound => {
            sound.setLoop(value);           
        });   
    }

    setRefDistance(value)
    {
        this._sounds.forEach(sound => {
                sound.setRefDistance(value);          
            });  
    }

};

// htmlID -> String
// sound => THREE.PositionalAudio | THREE.Audio
export class LoadMusicFromHTML
{
    constructor(htmlID, sound)
    {
        this._element = document.getElementById(htmlID);
        this._sound = sound;

        this._sound.setMediaElementSource( this._element );
    }
};