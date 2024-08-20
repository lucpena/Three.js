// Console 

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