import * as THREE from "three";
import { FBXLoader } from "fbxsrc";

import { cout, coutWarning, cerr } from "./utils.js"

export class Character {
    constructor(scene, fbxPath, animations, loadingManager )
    {
        this._scene = scene;
        this._mixer = null;
        this._animations = {};
        this._position = null;
        this._activeAction = null;

        // loading character
        const loader = new FBXLoader(loadingManager);
        loader.load(fbxPath, (character) =>
        {
            this._mesh = character;
            this._mesh.scale.setScalar(1.0);
            // this.mesh.scale.set(3.0, 1.0, 2.0)
            this._mesh.rotation.set(0, -Math.PI/2, 0);
            this._position = this._mesh.position;

            // shadows
            this._mesh.traverse((object) => {
                if(object.isMesh) object.castShadow = true;
            })

            // add to scene
            this._scene.add(this._mesh);

            // mixer configuration
            this._mixer = new THREE.AnimationMixer(this._mesh);

            // load animations
            animations.forEach((animation, i) =>
            {
                // cout(animation.path);
                loader.load(animation.path, (anim) =>
                {
                    const action = this._mixer.clipAction(anim.animations[0]);
                    this._animations[i] = action;
                    this._animations[i].state = animation.state;
                },
                (xhr) =>
                {
                    let loadMsg = (xhr.loaded / xhr.total).toPrecision(4) * 100 + '% loaded.';
                    cout(loadMsg, animation.path)
                },
                (error) =>
                {
                    cerr(error);
                });
            });
        },
        (xhr) =>
        {
            let loadMsg = (xhr.loaded / xhr.total).toPrecision(4) * 100 + '% loaded.';
            cout(loadMsg, fbxPath)
        },
        (error) =>
        {
            cerr(error);
        });
    }

    get theMixer()
    {
        return this._mixer;
    }

    // sets animation correctly and play sounds
    playAnimation(currentAnimation, lastAnimation)
    {
        let stateOldAnimation = Object.values(this._animations).find(a => a.state === lastAnimation)
        
        if(stateOldAnimation) {
            stateOldAnimation.stop();
        }

        // fixing animations blending with others
        if( currentAnimation == "walk" )
        {
            const turnLeftStop = Object.values(this._animations).find(a => a.state === "turn_right");
            const turnRightStop = Object.values(this._animations).find(a => a.state === "turn_left");
            const backwalkStop = Object.values(this._animations).find(a => a.state === "backwalk");
            const runStop = Object.values(this._animations).find(a => a.state === "run");

            if(turnLeftStop && turnRightStop && backwalkStop && runStop)
            {
                turnLeftStop.stop();
                turnRightStop.stop();
                runStop.stop();
                backwalkStop.stop();
            }
            
        }
        if( currentAnimation == "idle" )
        {
            const turnLeftStop = Object.values(this._animations).find(a => a.state === "turn_right");
            const turnRightStop = Object.values(this._animations).find(a => a.state === "turn_left");
            const backwalkStop = Object.values(this._animations).find(a => a.state === "backwalk");
            const walkStop = Object.values(this._animations).find(a => a.state === "walk");
            const runStop = Object.values(this._animations).find(a => a.state === "run");

            if(turnLeftStop && turnRightStop && backwalkStop && runStop)
            {
                turnLeftStop.stop();
                turnRightStop.stop();
                backwalkStop.stop();
                walkStop.stop();
                runStop.stop();
            }
            
        }
        if( currentAnimation == "run" )
        {
            const turnLeftStop = Object.values(this._animations).find(a => a.state === "turn_right");
            const turnRightStop = Object.values(this._animations).find(a => a.state === "turn_left");
            const backwalkStop = Object.values(this._animations).find(a => a.state === "backwalk");
            const walkStop = Object.values(this._animations).find(a => a.state === "walk");

            if(turnLeftStop && turnRightStop && backwalkStop)
            {
                turnLeftStop.stop();
                turnRightStop.stop();
                backwalkStop.stop();
                walkStop.stop();
            }
            
        }
        if( currentAnimation == "turn_right" || currentAnimation == "turn_left"  )
        {
            const backwalkStop = Object.values(this._animations).find(a => a.state === "backwalk");
            const walkStop = Object.values(this._animations).find(a => a.state === "walk");
            const runStop = Object.values(this._animations).find(a => a.state === "run");

            if(backwalkStop && walkStop && runStop)
            {
                backwalkStop.stop();
                walkStop.stop();
                runStop.stop();
            }
            
        }

        let stateAnimation = Object.values(this._animations).find(a => a.state === currentAnimation)
        
        if(stateAnimation) {
            stateAnimation.play();
            this._activeAction = stateAnimation;
        }       

    }

    update(deltaTime)
    {
        if(this._mixer)
        {
            this._mixer.update(deltaTime);
        }
    }

    _add( p )
    {   
        this._mesh.add( p );
    }
};

export class FiniteStateMachine {
    constructor(states)
    {
        this._states = states;
        this._currentState = null;
        this._lastState = null;
        this._newState = [];            // create a stack like array to play animations once
        this.addStates(states);
    }

    addStates(states)
    {
        states.forEach((element, i) => {
            this._states.name = element;
        });

        // cout(this._states, "Added to FSM");
    }

    setActiveState(state)
    {
        if( state != this._currentState )
        {            
            this._lastState = this._currentState;
        }
        
        this._currentState = state;        
    }

    getActiveState()
    {
        return this._currentState;
    }

    getActiveAction(character)
    {
        return character._activeAction;
    }

    Update(character)
    {
        character.playAnimation(this._currentState, this._lastState);        
    }
};

export class ControlsInput
{
    constructor()
    {
        this._keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            space: false,
            shift: false,
        };

        document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
    }

    _onKeyDown(event) {
        switch (event.keyCode) {
            case 87: // w
                this._keys.forward = true;
                break;
            case 65: // a
                this._keys.left = true;
                break;
            case 83: // s
                this._keys.backward = true;
                break;
            case 68: // d
                this._keys.right = true;
                break;
            case 32: // SPACE
                this._keys.space = true;
                break;
            case 16: // SHIFT
                this._keys.shift = true;
                break;
        }
    }

    _onKeyUp(event) {
        switch(event.keyCode) {
            case 87: // w
                this._keys.forward = false;
                break;
            case 65: // a
                this._keys.left = false;
                break;
            case 83: // s
                this._keys.backward = false;
                break;
            case 68: // d
                this._keys.right = false;
                break;
            case 32: // SPACE
                this._keys.space = false;
                break;
            case 16: // SHIFT
                this._keys.shift = false;
                break;
        }
    }

};

export class CharacterControl
{
    constructor()
    {
        this._input = new ControlsInput();
        this._acceleration = 1.5;
        this._direction = null;
    }

    Update(character, deltaTime)
    {
        const _Q = new THREE.Quaternion();
        let isWalking = false;

        if( this._input._keys.backward || this._input._keys.forward )
        {
            isWalking = true;
        } else {
            isWalking = false;
        }

        // cout(isWalking, "isWalking");

        if(!(this._input._keys.forward && this._input._keys.backward && this._input._keys.left && this._input._keys.right))
        {
            character.FSM.setActiveState("idle");
        }

        if( this._input._keys.forward ) {
            // get the forward direction of the character
            this._direction = new THREE.Vector3(0, 0, 1);

            // apply the rotation
            this._direction.applyQuaternion(character._mesh.quaternion);

            // move character
            if( !this._input._keys.shift )
            {
                character._position.addScaledVector(this._direction, this._acceleration * deltaTime);
                character.FSM.setActiveState("walk");
            } else {
                character._position.addScaledVector(this._direction, this._acceleration * deltaTime * 2);
                character.FSM.setActiveState("run");
            }
        }

        if( this._input._keys.backward ) {

            this._direction = new THREE.Vector3(0, 0, -1);
            this._direction.applyQuaternion(character._mesh.quaternion);
            character._position.addScaledVector(this._direction, this._acceleration * deltaTime);
            character.FSM.setActiveState("backwalk");

        }
        if( this._input._keys.left ) {

            this._direction = new THREE.Vector3(0, 1, 0);
            _Q.setFromAxisAngle(this._direction, Math.PI / 2 * this._acceleration * deltaTime);
            character._mesh.quaternion.multiplyQuaternions(_Q, character._mesh.quaternion);
           
            if( !isWalking && character.FSM.getActiveState() != "walk" && character.FSM.getActiveState() != "backwalk" )
            {
                character.FSM.setActiveState("turn_left");                
            }
        }
        if( this._input._keys.right ) {

            this._direction = new THREE.Vector3(0, 1, 0);
            _Q.setFromAxisAngle(this._direction, -Math.PI / 2 * this._acceleration * deltaTime);
            character._mesh.quaternion.multiplyQuaternions(_Q, character._mesh.quaternion);
           
            if( !isWalking && character.FSM.getActiveState() != "walk" && character.FSM.getActiveState() != "backwalk" )
            {
                character.FSM.setActiveState("turn_right");
            }
        }    
    }
};

export class StepSounds
{
    constructor(stepSoundsPaths, stepSounds, listener, volume)
    {
        this._stepSoundsPaths = stepSoundsPaths;
        this._stepSounds = stepSounds;

        const _audioLoader = new THREE.AudioLoader();

        this._stepSoundsPaths.forEach((path) => 
        {
            const _sound = new THREE.Audio(listener);
            _audioLoader.load(path, (buffer) => 
            {
                _sound.setBuffer(buffer);
                _sound.setLoop(false);
                _sound.setVolume(volume);
                stepSounds.push(_sound);
            })
        });
    }

    playStep()
    {
        const stepSound = this.getRandomStepSound();
        if(!stepSound.isPlaying)
        {
            stepSound.play();
        }
    }

    getRandomStepSound()
    {
        const randomIndex = Math.floor(Math.random() * this._stepSounds.length);
        return this._stepSounds[randomIndex];
    }
};