'use strict';

function autoplay()
{
    var firstaudio = document.getElementsByTagName("audio")[0];
    firstaudio.autoplay = true;
    firstaudio.load();
}

function getButt(audio)
{
    return audio.nextSibling.firstChild;
}

HTMLMediaElement.prototype.myLoad = function ()
{
    window.currentAudio = this;
    this.play();
    unloadExcept(this);
    getButt(this).className += " animated";
}

HTMLMediaElement.prototype.myUnload = function ()
{
    const srcBackup = this.src;
    this.src = "";
    this.load();
    this.src = srcBackup;
    const butt = getButt(this);
    butt.className =
        butt.className.replace(/animated/, "")
            .trim().replace(/\s/g, " ");
}

function unloadExcept(except)
{
    const audios = document.getElementsByTagName("audio");
    for (const audio of audios)
    {
        if (//audio.readyState != 0 && // If station is unloaded, skip
            audio != except)         // If selected station, skip
        {
            audio.myUnload();
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
                    radio.handler(newTrackInfoElt, trackInfoRequest.responseText);
                    trackInfoElt.className = newTrackInfoElt.className;
                    trackInfoElt.innerHTML = newTrackInfoElt.innerHTML;
                }
                else
                {
                    if (!trackInfoElt.className.match(/visible/))
                    {
                        trackInfoElt.className += " visible";
                    }
                    trackInfoElt.innerText = trackInfoRequest.responseText;
                }
                if (trackInfoElt.innerText !== "" &&
                    !trackInfoElt.previousSibling.className.match(/slanted/))
                {
                    trackInfoElt.previousSibling.className
                        += " slanted";
                }
            }
        };
    trackInfoRequest.send();
}

function updateTrackInfo(elt, artist, track)
{
    if (!elt.className.match(/visible/))
    {
        elt.className += " visible";
    }
    if (artist)
    {
        // Add artist name
        const artistElt = document.createElement("span");
        artistElt.className = "artist";
        artistElt.textContent = artist;
        elt.appendChild(artistElt);
        // Add spacing
        elt.appendChild(document.createTextNode(" — "));
    }
    // Add track name
    const trackElt = document.createElement("span");
    trackElt.className = "track";
    trackElt.textContent = track;
    elt.appendChild(trackElt);
}

function initradios(container, radios)
{
    for (var i=0, radio; radio=radios[i]; i++)
    {
        const audio = document.createElement("audio");
        audio.style.display = "hidden";
        audio.controls = false;
        audio.preload = "none";
        audio.src = radio.stream;
        container.appendChild(audio);
        if (i === 0)
        {
            window.currentAudio = audio;
        }
        const elt = document.createElement("div");
        elt.className = "radio";
        container.appendChild(elt);
        const butt = document.createElement("a");
        butt.className = "name";
        butt.innerText = radio.name;
        butt.addEventListener("click", function ()
            {
                if (!audio.paused)
                {
                    audio.myUnload();
                }
                else
                {
                    audio.myLoad();
                }
            });
        elt.appendChild(butt);
        if (radio.info != "" && radio.info != null)
        {
            // Create radio current track info
            //const separator = document.createTextNode(" / ");
            //elt.appendChild(separator);
            const trackInfoElt = document.createElement("span");
            trackInfoElt.className = "info";
            elt.appendChild(trackInfoElt);
            // Get info from server (every 5s)
            const boundUpdateInfo = updateInfo.bind(this, radio, trackInfoElt);
            boundUpdateInfo();
            setInterval(boundUpdateInfo, 10000);
        }
        //const br = document.createElement("br");
        //container.appendChild(br);
    }
    window.addEventListener("keydown", function (event)
        {
            if (event.key === " ")
            {
                if (!window.currentAudio.paused)
                {
                    window.currentAudio.myUnload();
                }
                else
                {
                    window.currentAudio.myLoad();
                }
                event.preventDefault();
            }
            else if (event.key === "j")
            {
                var newAudio = window.currentAudio.nextSibling;
                while (newAudio.tagName !== "AUDIO")
                {
                    newAudio = newAudio.nextSibling;
                    if (!newAudio)
                    {
                        newAudio = document.getElementsByTagName("audio")[0];
                    }
                }
                if (!window.currentAudio.paused)
                {
                    window.currentAudio.myUnload();
                    newAudio.myLoad();
                }
                window.currentAudio = newAudio;
            }
            else if (event.key === "k")
            {
                var newAudio = window.currentAudio.previousSibling;
                while (newAudio.tagName !== "AUDIO")
                {
                    newAudio = newAudio.previousSibling;
                    if (!newAudio)
                    {
                        const audios = document.getElementsByTagName("audio");
                        newAudio = audios[audios.length - 1];
                    }
                }
                if (!window.currentAudio.paused)
                {
                    window.currentAudio.myUnload();
                    newAudio.myLoad();
                }
                window.currentAudio = newAudio;
            }
            else if (event.key === "?")
            {
                const instr = document.getElementsByClassName("instr")[0];
                const table = instr.getElementsByTagName("table")[0];
                if (table.className.match(/hide/))
                {
                    table.className
                        = table.className
                               .replace(/hide/, "")
                               .replace(/\s*/, " ");
                }
                else
                {
                    table.className += "hide";
                }
            }
        });
}

function fixWord(word)
{
    return word.charAt(0).toLocaleUpperCase()
         + word.slice(1).toLocaleLowerCase();
}

String.prototype.fixText = function ()
{
    return this.toLocaleUpperCase()
               .replace(/&quot.*?&quot;/g, "“\\1”")
               .split(" ").map(fixWord).join(" ");
}

function tsfHandler(elt, text)
{
    const trackData = text.split("|");
    const artist = trackData[0].replace(/\//, " / ").fixText();
    const title  = trackData[1].fixText();
    if (trackData.length != 2) throw "Bad track info";
    updateTrackInfo(elt, artist, title);
}

// Reuse to avoid filling DOM tree
const novaElt = document.createElement("div");

function novaHandler(elt, text)
{
    const infocol =
        /<div class="info-col">[\s\S]*?<\/div>/
        .exec(text)[0]
        .replace(/[\s\S]*class="artiste">/, "")
        .replace(/<a [^>]*>/, "")
        .replace(/<\/span>[\s\S]*/, "");
    const artist = infocol.replace(/<[\s\S]*/ , "").trim().replace(/\//, " / ");
    const title  = infocol.replace( /[\s\S]*>/, "").trim();
    updateTrackInfo(elt, artist, title);
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
            if (!track.authors)
            {
                const title = track.title.fixText();
                updateTrackInfo(elt, null, title);
            }
            else
            {
                const artist = track.authors.fixText();
                const title  = track.title  .fixText();
                updateTrackInfo(elt, artist, title);
            }
            return;
        }
    }
    throw "FIP can't find current song";
}

function classiqueHandler(elt, text)
{
    const data = JSON.parse(text).trackData;
    const artist = data.name;
    const title = data.title + " — " + data.interpretes;
    updateTrackInfo(elt, artist, title);
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
        },
        {
            name    : "Radio Classique",
            stream  : "http://radioclassique.ice.infomaniak.ch/radioclassique-high.mp3",
            info    : "http://www.radioclassique.fr/typo3temp/init_player_high.json",
            handler : classiqueHandler,
        },
        {
            name    : "France Inter",
            stream  : "http://direct.franceinter.fr/live/franceinter-midfi.mp3",
        },
        {
            name    : "France Info",
            stream  : "http://direct.franceinfo.fr/live/franceinfo-midfi.mp3",
        },
    ];
    const container = document.getElementById("radios");
    initradios(container, radios);
}

window.addEventListener("load", initMyRadios);

