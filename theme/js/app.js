var currentRegion;
var sfName, lastSfName;
var startTime = 0;
var endTime = 10;
var sfTitle;
var fadeTime = 500; //time to fade when programmatically changing playhead position (in ms)

var phpUrl = "https://damasi.be/masi";
//var phpUrl = "http://0.0.0.0:7000";
var mediaUrl = "/media/";
//var mediaUrl = "/masi/media/";
var mainColor = getComputedStyle(document.documentElement).getPropertyValue('--main-color');
var waveBackgroundColor = 'inherit';
var progressColor = mainColor;
var lastProgressColor = mainColor;
var regionColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
var lastRegionColor = 'rgba(0,0,0,0.1)';
var activeMediaFileColor = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color');

// init wavesurfer
var wavesurfer = WaveSurfer.create({
	container: document.querySelector('#waveform'),
	height: 240,
	backgroundColor: waveBackgroundColor,
	waveColor: mainColor,
	cursorColor: mainColor,
	progressColor: 'rgba(0,0,0,.1)',
	normalize: true,
  backend: 'MediaElementWebAudio',
  //splitChannels: true,
	plugins: [
		WaveSurfer.regions.create({ dragSelection: { slop: 5 }}),
		WaveSurfer.cursor.create({
			showTime: true,
			opacity: 1,
			customShowTimeStyle: {
				'background-color': getComputedStyle(document.documentElement).getPropertyValue('--main-bg-color'),
				//color: 'grey',
				padding: '1px',
				'font-size': '10px',
				'font-family': getComputedStyle(document.documentElement).getPropertyValue('--secondary-font')
			}
		}),
	],
});

wavesurfer.g = wavesurfer.backend.ac.createGain();
wavesurfer.backend.setFilter(wavesurfer.g);

$(document).ready(function(){

  $("#flip").click(function(){
    $("#panel").slideToggle(40);
		return false;
  });

	$("#toggleChrome").click(function(){
		$(".chrome").toggle(40);
		return false;
	});

	var sf = document.getElementsByClassName('sf');

	for( let i=0; i < sf.length; i++ ) {
		sfName = sf[i].id;
		//console.log(sfName + " found");

		sf[i].innerHTML = '<div class="progress"></div><div class="sfName"></div><div class="timestamp"></div><div class="play"></div><div class="title" contenteditable="true"></div><div class="regions"></div>';

		let title = sf[i].getElementsByClassName("title")[0];
		sf[i].getElementsByClassName("sfName")[0].innerHTML = sfName;
		sf[i].getElementsByClassName("progress")[0].style.background = progressColor;

		sf[i].getElementsByClassName("play")[0].setAttribute("onclick", "playPause('" + sfName + "');" ); //add onclick function to each div

		loadRegionsFromServer(sfName);

		title.addEventListener("input", function() {
			sfTitle = title.innerHTML;
			updateTitle(title.parentNode.id, title.innerHTML);
		}, false);
	}
	sfName=null;
});

function playPause(file) {
	if (sfName === file) {
		wavesurfer.playPause();
	} else {
		loadSf(mediaUrl+file);
	}

	document.getElementById(file).style.backgroundColor=activeMediaFileColor;

	if (lastSfName && lastSfName!==sfName) {
		document.getElementById(lastSfName).style.backgroundColor='';
	}
}

wavesurfer.on('ready', function () {
	let playPos = document.getElementById(sfName).getElementsByClassName("progress")[0].style.width.replace("%","");
	wavesurfer.seekTo(playPos/100);
	wavesurfer.play();
});

wavesurfer.on('waveform-ready', showWaveform);
function showWaveform() {
	if (document.getElementById("panel").style.display != 'block') {
  	$("#panel").slideToggle(40, function() {
			wavesurfer.zoom(0); //hack to show redraw waveform once div is shown;
		});
	}
}


function updateTitle(id, title) {
	let jsondata = JSON.stringify({ filename: id, title: title});

	var s = document.createElement("script");
	s.src = phpUrl + "/push/update-title.php?json=" + jsondata;
	document.body.appendChild(s);
}

function phpEcho(str) {
	console.log(str);
}

/* Progress bar */
(function() {
		var progressDiv = document.querySelector('#progress');
		var showProgress = function(percent) {
				progressDiv.style.display = 'block';
				progressDiv.innerHTML = 'Loading sound file... ' + percent + '%';
				if (percent==100) {
					progressDiv.innerHTML += '<br>getting peaks...';
				}
		};

		var hideProgress = function() {
				progressDiv.style.display = 'none';
		};

		wavesurfer.on('loading', showProgress);
		wavesurfer.on('waveform-ready', hideProgress);
		wavesurfer.on('destroy', hideProgress);
		wavesurfer.on('error', hideProgress);
})();

function loadVid() {
	var mediaElt = document.querySelector('video');
	wavesurfer.load(mediaElt);
}

function loadSf(url) {
	wavesurfer.load(url);

	lastSfName = sfName;
	sfName = url.substring(url.lastIndexOf('/')+1);

	startTime = 0;
	endTime = wavesurfer.getDuration();

	loadRegionsFromServer(sfName);

	document.getElementById("sfname").innerText = sfName;
  //document.getElementById(sfName)..style.fontWeight = 'bold';

  if (lastSfName)
		document.getElementById(lastSfName).getElementsByClassName("progress")[0].style.background = lastProgressColor;
}

function exportReaperProject() {
	var txt = '<REAPER_PROJECT\n\n  TIMEMODE 3 5 -1 30 0 0 -1\n  ZOOM 1 0 0\n\n  <TRACK\n		NAME '+sfName;

	var count = 0;

	var region, lastRegion;
	Object.keys(wavesurfer.regions.list).forEach(function (id) {
		lastRegion = region;
		region = wavesurfer.regions.list[id];
		var color;

		//handle in between regions
		if (count==0)
			txt += reaperItem(0,region.start,'','');
		else
			txt += reaperItem(lastRegion.end,region.start-lastRegion.end,'','');

		if (region.attributes.label === 'rm')
			color = '33226774 B'; //red
		else
			color = '22258724 B'; //green

		txt += reaperItem(region.start,region.end-region.start,region.attributes.label,color);

		count++;
	});

	txt += reaperItem(region.end,wavesurfer.getDuration()-region.end,'','');

	txt += '\n  >\n>'

	var blob = new Blob([txt], {type: "text/plain;charset=utf-8"});
  saveAs(blob, sfName+".RPP");
}

function reaperItem(start,length,name,color) {
	return '\n    <ITEM\n      POSITION '+start+'\n      LENGTH '+length+'\n\n      NAME '+name+'\n      SOFFS '+start+'\n      COLOR '+color+'\n\n      <SOURCE WAVE\n        FILE "'+sfName+'"\n      >\n    >'
}

//zoom
document.querySelector('[data-action="zoom"]').oninput = function () {
  	wavesurfer.zoom(Number(this.value));
};
/*
document.getElementById("regioninput").addEventListener('change', function(e){
    var file = this.files[0];
    if (file) {
        var reader = new FileReader();

				reader.onload = function(e) { loadRegions(JSON.parse(reader.result).regions); }
        reader.onerror = function (evt) {	console.error("An error ocurred reading the file: ", evt); };
	 			reader.readAsText(file);
    }
  }, false);*/

document.getElementById("loginput").addEventListener('change', function(e){
    var file = this.files[0];
    if (file) {
        var reader = new FileReader();

				reader.onload = function(e) { loadRegions(JSON.parse(reader.result)); }
        reader.onerror = function (evt) {	console.error("An error ocurred reading the file: ", evt); };
	 			reader.readAsText(file);
    }
  }, false);
/*
//load soundfile from disk
document.getElementById("fileinput").addEventListener('change', function(e){
      var file = this.files[0];

      if (file) {
					sfName = file.name;
          var reader = new FileReader();

          reader.onload = function (evt) {
							document.getElementById("sfname").innerText = sfName;

              // Create a Blob providing as first argument a typed array with the file buffer
              var blob = new window.Blob([new Uint8Array(evt.target.result)]);

              // Load the blob into Wavesurfer
              wavesurfer.loadBlob(blob);
          };

          reader.onerror = function (evt) {
              console.error("An error ocurred reading the file: ", evt);
          };

          // Read File as an ArrayBuffer
          reader.readAsArrayBuffer(file);
      }
  }, false);
*/


// Play button in GUI
var button = document.querySelector('[data-action="play"]');
button.addEventListener('click', wavesurfer.playPause.bind(wavesurfer));

wavesurfer.on('audioprocess', function() {
	if(wavesurfer.isPlaying()) {
		document.getElementById('time-total').innerText = formatTime(wavesurfer.getDuration());
		document.getElementById('time-current').innerText = formatTime(wavesurfer.getCurrentTime());

    var width = (wavesurfer.getCurrentTime()/wavesurfer.getDuration());

		if (document.getElementById(sfName)) //if a div exists for the sf
			document.getElementById(sfName).getElementsByClassName("progress")[0].style.width = width*100 + "%";

		if (startTime>0)
			if (wavesurfer.getCurrentTime() < (startTime-0.01) )
				wavesurfer.seekTo(startTime/wavesurfer.getDuration());

		if (wavesurfer.getCurrentTime()>=endTime)
			wavesurfer.stop();
	}
});

wavesurfer.on('region-dblclick', function(region, e) {
  region.remove();
	saveRegionsToServer();
});

var lastSelectedRegion, selectedRegion;

wavesurfer.on('region-click', regionFocus);
wavesurfer.on('region-update-end', regionFocus);
wavesurfer.on('interaction', handlePlayheadClick);

var regionClicked = false;

function regionFocus(region) {
	regionClicked = true;
	var input = document.getElementById("inputtext");
	input.focus();

	if (region.attributes.label!=null)
		input.value = region.attributes.label;
	else
		input.value = '';

	lastSelectedRegion = selectedRegion;
	selectedRegion = region;
  selectedRegion.update({ color: regionColor });

	if (lastSelectedRegion != null && lastSelectedRegion != selectedRegion) {
		lastSelectedRegion.update({ color: lastRegionColor });
	}
}

function handlePlayheadClick() {
	if (regionClicked==false) {
		if (selectedRegion!=null) {
			selectedRegion.update({
				color: 'rgba(11, 91, 162,.3)'
			});
			selectedRegion=null;
		}

    var input = document.getElementById("inputtext");
	  input.focus();
		input.value = '';
	}

	regionClicked = false;
}

var timeIn, timeOut, note;
function handle(e) {
	var input = document.getElementById("inputtext").value;
	var t = wavesurfer.getCurrentTime();

	if (input.length==1) timeIn = t;

	note = input;
	timeOut = t;

	if (selectedRegion!=null) {
		selectedRegion.update({
			attributes: {
				label: note
			},
		});
	}

	var key=e.keyCode || e.which;
	if (key==13){
		if (selectedRegion!=null) {
			selectedRegion.update({
					color: 'rgba(11, 91, 162,.3)'
			});
			selectedRegion=null;
		} else {
			wavesurfer.addRegion({
			  start: timeIn,
			  end: timeOut,
			  attributes: {
					label: note
			  }
			});

		}
		document.getElementById("inputtext").value='';
	}

	saveRegionsToServer();

}


function formatTime(seconds) {
    minutes = Math.floor(seconds / 60);
    minutes = (minutes >= 10) ? minutes : "0" + minutes;
    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    return minutes + ":" + seconds;
  }

/**
* Save annotations
*/
function saveRegions() {
  var jsondata = JSON.stringify({
			filename: sfName,
			regions: Object.keys(wavesurfer.regions.list).map(function(id) {
          var region = wavesurfer.regions.list[id];
          return {
              start: region.start,
              end: region.end,
              attributes: region.attributes,
              //data: region.data
          };
      	})
  	});

  var blob = new Blob([jsondata], {type: "text/plain;charset=utf-8"});
  saveAs(blob, sfName+"_regions.json");
}

wavesurfer.on('region-update-end', saveRegionsToServer);

function saveRegionsToServer() {
	printRegionsToList(sfName);

	if (sfTitle === null)
		sfTitle = sfName;

  var jsondata = JSON.stringify({
			filename: sfName,
			title: sfTitle,
			regions: Object.keys(wavesurfer.regions.list).map(function(id) {
          var region = wavesurfer.regions.list[id];
          return {
              start: region.start,
              end: region.end,
              attributes: region.attributes,
              //data: region.data
          };
      	})
  	});

	var s = document.createElement("script");
	s.src = phpUrl + "/push/?json=" + jsondata;
	document.body.appendChild(s);
}

function savedJSON(txt) { //callback from save.php
	console.log(txt + " regions saved to server");
}

function loadRegionsFromServer(filename) {
	wavesurfer.regions.clear();
	console.log("regions cleared. loading regions for "+filename);
	var s = document.createElement("script");
	s.src = phpUrl + "/pull.php?json=" + sfName;
	document.body.appendChild(s);
}

function servedJSON(json) {
	let data = JSON.parse(json);

	var sf = document.getElementById(data.filename);
	var div;

	if (sf) {
		if (data.title)
			sf.getElementsByClassName("title")[0].innerHTML = data.title;

		div = sf.getElementsByClassName("regions")[0];
		div.innerHTML = "";
		if (data.regions) {
		  data.regions.forEach(function(region) {
		  	wavesurfer.addRegion(region);
				handleStartEndTime(region);
				//not keeping in DRY here...
				if (sf) {
					if (region.attributes.label && region.attributes.label!="rm") { //only print regions with labels
						//div.innerHTML += formatTime(region.start) + "-" + formatTime(region.end) + " " + region.attributes.label;
						if (region.attributes.label === "start" || region.attributes.label === "end") {
							div.innerHTML += formatTime(region.start) + " " + region.attributes.label + "<br>";
						} else {
							div.innerHTML += formatTime(region.start) + " " + region.attributes.label + " (" + formatTime(region.end-region.start) + ")<br>";
						}
					}
				}
			});
		}
	}
}


wavesurfer.on('region-created', handleStartEndTime);
wavesurfer.on('region-updated', handleStartEndTime);
wavesurfer.on('region-update-end', handleStartEndTime);

function handleStartEndTime(region) {
	if (region.attributes.label==="start")
		startTime = region.start;
	if (region.attributes.label==="end")
		endTime = region.end;
}

function loadRegions(regions) {
	var sf = document.getElementById(sfName);
	var div;

	if (sf) {
		div = sf.getElementsByClassName("regions")[0];
		div.innerHTML = "";
	}

  regions.forEach(function(region) {
      wavesurfer.addRegion(region);

			if (sf)
				if (region.attributes.label && egion.attributes.label!="rm")
					div.innerHTML += formatTime(region.start) + " " + region.attributes.label + " (" + formatTime(region.end-region.start) + ")<br>";
  });

}

wavesurfer.on('region-update-end', saveRegionsToServer);

wavesurfer.on('region-in', function(region, e) {
	if (region.attributes.label.startsWith("rm")) {

		var currTime = wavesurfer.backend.ac.currentTime;
		var fadeTimeS = fadeTime/1000; //in seconds
		var vol = wavesurfer.g.gain.value;
		wavesurfer.g.gain.linearRampToValueAtTime(vol,currTime);
		wavesurfer.g.gain.linearRampToValueAtTime(0,currTime+fadeTimeS);
		setTimeout(function(){
			wavesurfer.play(region.end);
			},
			fadeTime);
		wavesurfer.g.gain.linearRampToValueAtTime(vol,currTime+fadeTimeS+fadeTimeS);

	} else if (region.attributes.label==="start") { //fade in
			var currTime = wavesurfer.backend.ac.currentTime;
			var fadeTimeS = region.end-region.start;
			var vol = wavesurfer.g.gain.value;
			wavesurfer.g.gain.linearRampToValueAtTime(0,currTime);
			wavesurfer.g.gain.linearRampToValueAtTime(vol,currTime+fadeTimeS);
	} else if (region.attributes.label==="end") { //fade out
			var currTime = wavesurfer.backend.ac.currentTime;
			var fadeTimeS = region.end-region.start;
			var vol = wavesurfer.g.gain.value;
			wavesurfer.g.gain.linearRampToValueAtTime(vol,currTime);
			wavesurfer.g.gain.linearRampToValueAtTime(0,currTime+fadeTimeS);
			wavesurfer.g.gain.linearRampToValueAtTime(vol,currTime+fadeTimeS+0.5);
	} else {
		// PRINT TO LOG
		var div = document.getElementById(sfName+"-log");
		if (div) {
			div.innerHTML += formatTime(region.start) + " " + region.attributes.label + "<br>";
		}
		var txt = document.getElementById("log");
		if (txt) {
			txt.value += "\n";
			txt.value += region.attributes.label;
			//txt.value += formatTime(region.start) + " " + region.attributes.label;
			txt.scrollTop = txt.scrollHeight;
		}
	}
});

function offsetRegions(amount) {
	Object.keys(wavesurfer.regions.list).map(function(id) {
			var region = wavesurfer.regions.list[id];
			region.update({start: region.start+amount, end: region.end+amount})
		})
}

function removeCloseRegions() {
	Object.keys(wavesurfer.regions.list).map(function(id) {
			if (region!=null) var lastRegion = region;
			var region = wavesurfer.regions.list[id];

			if (lastRegion!=null) {
				if (region.start-lastRegion.start<0.1) {
					console.log("region removed")
					region.remove();
				}
			}

		})
}

function printRegionsToList(f) {
	var sf = document.getElementById(f);

	if (sf) {
		let div = sf.getElementsByClassName("regions")[0];
		div.innerHTML = "";

		Object.keys(wavesurfer.regions.list).map(function(id) {
				var region = wavesurfer.regions.list[id];
				if (region.attributes.label && region.attributes.label!="rm") { //only print regions with labels
					//div.innerHTML += formatTime(region.start) + "-" + formatTime(region.end) + " " + region.attributes.label;
					if (region.attributes.label === "start" || region.attributes.label === "end") {
						div.innerHTML += formatTime(region.start) + " " + region.attributes.label + "<br>";
					} else {
						div.innerHTML += formatTime(region.start) + " " + region.attributes.label + " (" + formatTime(region.end-region.start) + ")<br>";
					}
				}
			})
	}
}
