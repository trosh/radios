function autoplay()
{
    var firstaudio = document.getElementsByTagName("audio")[0];
    firstaudio.autoplay = true;
    firstaudio.load();
}

function unloadExcept(except)
{
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

function updateInfo(radio, trackInfoElt)
{
    const trackInfoRequest = new XMLHttpRequest();
    const phpgetter = "/getSongInformation.php"
    trackInfoRequest.open(
        "GET",
        phpgetter + "?url=" + encodeURI(radio.info),
        true);
    trackInfoRequest.onreadystatechange = function()
        {
            if (trackInfoRequest.readyState == 4
             && trackInfoRequest.status == 200) {
                if (radio.handler)
                {
                    // TODO : use ghost element to avoid polluting the DOM tree
                    const newTrackInfoElt = document.createElement("span");
                    newTrackInfoElt.className = trackInfoElt.className;
                    const replace = radio.handler(newTrackInfoElt, trackInfoRequest.responseText);
                    if (replace)
                    {
                        trackInfoElt.innerHTML = newTrackInfoElt.innerHTML;
                    }
                }
                else
                {
                    trackInfoElt.innerText = trackInfoRequest.responseText;
                }
            }
        };
    trackInfoRequest.send();
}

function updateTrackInfo(elt, artist, track)
{
    // Add artist name
    const artistElt = document.createElement("span");
    artistElt.className = "artist";
    artistElt.textContent = artist;
    elt.appendChild(artistElt);
    // Add spacing
    elt.appendChild(document.createTextNode(" — "));
    // Add track name
    const trackElt = document.createElement("span");
    trackElt.className = "track";
    trackElt.textContent = track;
    elt.appendChild(trackElt);
}

function initradios(container, radios)
{
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
        // Create radio name <p>
        const nameElt = document.createElement("p");
        nameElt.className += "name";
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
        audio.addEventListener("play", unloadExcept.bind(audio));
        container.appendChild(audio);
        if (radio.info != "" && radio.info != null)
        {
            // Create radio current track info
            const separator = document.createTextNode(" / ");
            nameElt.appendChild(separator);
            const trackInfoElt = document.createElement("span");
            trackInfoElt.className += "info";
            nameElt.appendChild(trackInfoElt);
            // Get info from server (every 5s)
            const boundUpdateInfo = updateInfo.bind(this, radio, trackInfoElt);
            boundUpdateInfo();
            setInterval(boundUpdateInfo, 5000);
        }
    }
}

function fixWord(word)
{
    return word.charAt(0).toLocaleUpperCase()
         + word.slice(1).toLocaleLowerCase();
}

String.prototype.fixText = function()
{
    return this.replace(/\<LL\>/i, "’ll ")
               .replace(/\<D\>/i, "’d ")
               .replace(/\<S\>/i, "’s ")
               .replace(/'/, "’")
               .split(" ").map(fixWord).join(" ");
}

function tsfHandler(elt, text)
{
    const trackData = text.split("|");
    const artist = trackData[0].replace(/\//, " / ").fixText();
    const title  = trackData[1].fixText();
    if (trackData.length != 2) throw "Bad track info";
    updateTrackInfo(elt, artist, title);
    return true;
}

// Reuse to avoid filling DOM tree
const novaElt = document.createElement("div");

function novaHandler(elt, text)
{
    const infocol =
        /<div class="info-col">[\s\S]*?<\/div>/
        .exec(text)[0]
        .replace(/[\s\S]*class="artiste">/, "")
        .replace(/<\/span>[\s\S]*/, "");
    const artist = infocol.replace(/<[\s\S]*/ , "").trim().replace(/\//, " / ");
    const title  = infocol.replace( /[\s\S]*>/, "").trim();
    updateTrackInfo(elt, artist, title);
    return true;
}

function fipHandler(elt, text)
{
    const steps = JSON.parse(text).steps;
    const now = Date.now();
    for (const step in steps)
    {
        const track = steps[step];
        if (track.start * 1000 <= now
         && track.end   * 1000 >  now)
        {
            const artist = track.authors.fixText();
            const title  = track.title  .fixText();
            updateTrackInfo(elt, artist, title);
            return true;
        }
    }
    throw "can't find current song";
}

function initMyRadios()
{
    const radios = [
        {
            name    : "TSF Jazz",
            stream  : "http://tsfjazz.ice.infomaniak.ch/tsfjazz-high",
            info    : "http://www.tsfjazz.com/getSongInformations.php",
            handler : tsfHandler
        },
        {
            name    : "Radio Nova",
            stream  : "http://novazz.ice.infomaniak.ch/novazz-128.mp3",
            info    : "http://www.novaplanet.com/radionova/cetaitquoicetitre",
            //info    : "http://www.novaplanet.com/radionova/ontheair",
            handler : novaHandler
        },
        {
            name    : "FIP",
            stream  : "http://direct.fipradio.fr/live/fip-midfi.mp3",
            info    : "http://www.fipradio.fr/livemeta",
            handler : fipHandler
        }
    ];
    const container = document.getElementById("radios");
    initradios(container, radios);
}

window.addEventListener("load", initMyRadios);

