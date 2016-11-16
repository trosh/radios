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
    const radios = [
        {
            name : "TSF Jazz",
            stream : "http://tsfjazz.ice.infomaniak.ch/tsfjazz-high",
            info : "http://www.tsfjazz.com/getSongInformations.php"
        },
        {
            name : "Radio Nova",
            stream : "http://novazz.ice.infomaniak.ch/novazz-128.mp3",
        },
        {
            name : "FIP",
            stream : "http://direct.fipradio.fr/live/fip-midfi.mp3"
        }
    ];
    const container = document.getElementById("radios");
    first = true;
    for (var i=0, radio; radio=radios[i]; i++)
    {
        if (first) first = false;
        else
        {
            // Horizontal line
            const hr = document.createElement("hr");
            container.appendChild(hr);
        }
        if (radio.info)
        {
            // Create radio current track info <iframe>
            const trackInfoElt = document.createElement("iframe");
            trackInfoElt.setAttribute("src", radio.info);
            container.appendChild(trackInfoElt);
            // Forbidden on cross-origin :-(
            //// Reload every 2s
            //setInterval(function() {
            //        trackInfoElt.contentWindow.location.reload();
            //    }, 2000);
            // Break line
            const br = document.createElement("br");
            container.appendChild(br);
        }
        // Create radio name <p>
        const nameElt = document.createElement("p");
        nameElt.className += "radio-name";
        const nameText = document.createTextNode(radio.name);
        nameElt.appendChild(nameText);
        container.appendChild(nameElt);
        // Create radio stream <audio>
        const audio = document.createElement("audio");
        const controls = document.createAttribute("controls");
        audio.setAttributeNode(controls);
        audio.setAttribute("src", radio.stream);
        audio.setAttribute("preload", "none");
        // Unload other loaded streams on play()
        audio.addEventListener(
            "play",
            function () { unloadexcept(audio); });
        container.appendChild(audio);
    }
}

