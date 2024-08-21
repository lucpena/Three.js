// prints a message on the screen console
export function cout(message) 
{
    const consoleMessages = document.getElementById("console-messages");
    const theMessage = document.createElement("li");
    theMessage.appendChild(document.createTextNode(message));
    consoleMessages.appendChild(theMessage);

    // auto scroll to bottom
    const console = document.getElementById("console")
    console.scrollTo(0, console.scrollHeight);

}

// prints a message on the screen console for loading assets
export function coutAssetLoading(message, assetName) 
{
    const consoleMessages = document.getElementById("console-messages");

    const messageOnList = document.getElementById(assetName);
    if(messageOnList)
    {
        consoleMessages.removeChild(messageOnList);
    }

    const theMessage = document.createElement("li");
    theMessage.id = assetName;
    theMessage.appendChild(document.createTextNode(assetName + ": " + message));
    consoleMessages.appendChild(theMessage);

    // auto scroll to bottom
    const console = document.getElementById("console")
    console.scrollTo(0, console.scrollHeight);
}

// displays an error on the screen console
export function cerr(message) 
{
    const consoleMessages = document.getElementById("console-messages");
    const theMessage = document.createElement("li");
    theMessage.style.color = "tomato";
    theMessage.style.fontWeight = "bolder";
    theMessage.appendChild(document.createTextNode(message));
    consoleMessages.appendChild(theMessage);

    // auto scroll to bottom
    const console = document.getElementById("console")
    console.scrollTo(0, console.scrollHeight);
}

// glTF loader
export class glTFLoader
{
    constructor(scene, glTFpath, glTFscale, loadingManager)
    {
        const loader = new glTFLoader(loadingManager);
        loader.load(glTFpath, (gltf) => 
        {
            const model = gltf.scene;
            model.scale.setScalar(glTFscale);
            scene.add(model);

             // Acessar animações, se houver
            const mixer = new THREE.AnimationMixer(model);
            const animations = gltf.animations;
            if (animations && animations.length) {
                const action = mixer.clipAction(animations[0]);
                action.play();
            }
        },
        function (xhr) {
            let loadMsg = (xhr.loaded / xhr.total).toPrecision(4) * 100 + '% loaded.';
            coutAssetLoading(loadMsg, glTFpath)
        },
        function (error) {
            cerr('An error occurred while loading' + glTFpath + ' the glTF model', error);
        });
    }
}

export class SoundEngine
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