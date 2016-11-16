function autoplay()
{
    var firstaudio = document.getElementsByTagName("audio")[0];
    firstaudio.autoplay = true;
    firstaudio.load();
}

function unloadexcept(except)
{
    console.log(except);
    const audios = document.getElementsByTagName("audio");
    for (var i=0, audio; audio = audios[i]; i++)
    {
        if (audio.readyState != 0 && // If station is unloaded, skip
            audio != except)         // If selected station, skip
        {
            const srcBackup = audio.src;
            audio.src = "";
            audio.load();
            audio.src = srcBackup;
        }
    }
}

function initradios()
{
    const urls = {
      "TSF Jazz"    : "http://tsfjazz.ice.infomaniak.ch/tsfjazz-high",
      "Radio Nova"  : "http://novazz.ice.infomaniak.ch/novazz-128.mp3",
      "FIP"         : "http://direct.fipradio.fr/live/fip-midfi.mp3",
    };
    const container = document.getElementById("radios");
    first = true;
    for (var radioName in urls)
    {
        if (first) first = false;
        else
        {
            const hr = document.createElement("hr");
            container.appendChild(hr);
        }
        // Create radio name <p>
        const nameElt = document.createElement("p");
        nameElt.className += "radio-name";
        const nameText = document.createTextNode(radioName);
        nameElt.appendChild(nameText);
        container.appendChild(nameElt);
        // Create radio stream <audio>
        const audio = document.createElement("audio");
        const controls = document.createAttribute("controls");
        audio.setAttributeNode(controls);
        audio.setAttribute("src", urls[radioName]);
        audio.setAttribute("preload", "none");
        audio.addEventListener(
            "play",
            function () { unloadexcept(audio); });
        container.appendChild(audio);
    }
}

