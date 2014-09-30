/**
*	Music Player
*	Authored by Donovan Munerlyn
*
*	This is a background music player that uses the SoundManager 2.0 audio library.
*	It allows easy control of music playback by calling various methods from web
*	page elements. It also allows listeners to be added for all actions so that
*	a user interface can be created to represent the current state of the music
*	player.
*
*	The "public" methods are:
*	- void play()
*	- void pause()
*	- void next()
*	- void prev()
*	- void setTrackNum(Int)		- Sets the current track to the specified track number
*	- Object getSongInfo()		- Returns information about the current song
*	- Playlist getPlaylist()	- Returns a Playlist object that contains information about
*								all songs in the playlist. Individual songs from the playlist
*								can be retrieved with its get(Int) method.
*	- void addListener(event, callback)	- Allows a callback to be set up to trigger when
*										the specified event occurs. Multiple listeners can be
*										added for any event.
*
*	Event types:
*	- evt.CHANGE	- Triggers when the song is changed
*	- evt.PLAY		- Triggers when a song starts playing (even after pausing)
*	- evt.PAUSE		- Triggers when a song is paused
*	- evt.UPDATE	- Triggers when a playing song's position changes (current time)
*	- evt.LOAD		- Triggers when a song finishes loading
**/

function MusicPlayer(playlist) {
	var self = this;

	this.playlist = playlist;
	this.trackNum = 0;
	this.evt = {
		CHANGE: 1,
		PLAY:	2,
		PAUSE:	3,
		UPDATE:	4,
		LOAD:	5
	};
	this.listener = {
		onchange:	[],
		onplay:		[],
		onpause:	[],
		onupdate:	[],
		onload:		[]
	};

	this.currentSound = null;
	this.isPlaying = false;
	this.position = 0;

	this.init = function() {
		var sound = new Audio();

		sound.addEventListener("timeupdate", function() {
			self.notifyListener(self.evt.UPDATE, {
				position: sound.currentTime,
				duration: sound.duration
			});
		})

		self.currentSound = sound;

		self.currentSound.addEventListener("durationchange", function() {
			self.notifyListener(self.evt.LOAD, self.getSongInfo());
		})

		self.currentSound.addEventListener("ended", function() {
			self.next();
		})

		return self;
	}

	this.loadSong = function(fileName, autoPlay) {
		self.position = 0;
		self.currentSound.src = fileName;

		if (autoPlay)
			self.play();

		var songInfo = self.getSongInfo();
		self.notifyListener(self.evt.CHANGE, 
			{
				title: songInfo.title,
				track: songInfo.track,
				duration: 0,
				art: songInfo.art
			}
		);

		return self;
	}

	this.setPlaylist = function(playlist) {
		self.playlist = playlist;
	}

	this.getPlaylist = function() {
		return self.playlist;
	}

	this.setTrackNum = function(number) {
		var isPlaying = self.isPlaying;

		if (number >= 0 && number < playlist.length) {
			self.pause();
			self.trackNum = number;
			self.loadSong(playlist.get(self.trackNum).file, isPlaying);
		}

		return self;
	}

	this.getCurrentTrack = function() {
		return self.playlist.get(self.trackNum);
	}

	// Returns the song info that an external interface would need such as position, total time, album art, etc.
	this.getSongInfo = function() {
		return {
			title: 		self.getCurrentTrack().title,
			track:		self.trackNum,
			duration:	(self.currentSound !== null) ? self.currentSound.duration : 0,
			position:	self.position,
			art:		self.getCurrentTrack().art
		}
	}

	this.setPosition = function(position) {
		self.currentSound.currentTime = position;

		return self;
	}

	this.play = function() {
		if (!self.isPlaying) {
			if (self.currentSound.readyState === 4) {
				play();
			} else {
				self.currentSound.addEventListener("canplay", play);
			}
		}

		function play(e) {
			self.currentSound.removeEventListener("canplay", play);

			self.currentSound.play();
			self.notifyListener(self.evt.PLAY, null);
			self.isPlaying = true;
		}

		return self;
	}

	this.pause = function() {
		if (self.isPlaying) {
			self.currentSound.pause();
			self.notifyListener(self.evt.PAUSE, null);
			self.isPlaying = false;
		}

		return self;
	}

	this.next = function() {
		var isPlaying = self.isPlaying;
		self.pause();

		if (++self.trackNum >= self.playlist.length)
			self.trackNum = 0;

		self.loadSong(playlist.get(self.trackNum).file, isPlaying);

		return self;
	}

	this.prev = function() {
		var isPlaying = self.isPlaying;
		self.pause();

		if (--self.trackNum < 0)
			self.trackNum = playlist.length - 1;

		self.loadSong(playlist.get(self.trackNum).file, isPlaying);

		return self;
	}

	this.setVolume = function(volume) {
		if (volume >= 0 && volume <= 1)
			self.currentSound.volume = volume;

		return self;
	}

	// This pauses the player without calling event handlers. This is useful when
	// using a slider to change the song position
	this.silence = function() {
		self.currentSound.pause();
		return self;
	}

	this.unsilence = function() {
		self.currentSound.play();
		return self;
	}

	// Chooses a random track
	this.random = function() {
		self.setTrackNum(Math.floor(Math.random() * playlist.length));
		return self;
	}

	this.addListener = function(type, callback) {
		switch(type) {
			case self.evt.CHANGE:
				self.listener.onchange.push(callback);
				break;
			case self.evt.PLAY:
				self.listener.onplay.push(callback);
				break;
			case self.evt.PAUSE:
				self.listener.onpause.push(callback);
				break;
			case self.evt.UPDATE:
				self.listener.onupdate.push(callback);
				break;
			case self.evt.LOAD:
				self.listener.onload.push(callback);
				break;
			default:
				console.error("Invalid Event type in MusicPlayer.addListener()");
		}
	}

	this.notifyListener = function(type, data) {
		switch(type) {
			case self.evt.CHANGE:
				self.callFunctionArray(self.listener.onchange, data);
				break;
			case self.evt.PLAY:
				self.callFunctionArray(self.listener.onplay, data);
				break;
			case self.evt.PAUSE:
				self.callFunctionArray(self.listener.onpause, data);
				break;
			case self.evt.UPDATE:
				self.callFunctionArray(self.listener.onupdate, data);
				break;
			case self.evt.LOAD:
				self.callFunctionArray(self.listener.onload, data);
				break;
			default:
				console.error("Unknown event type:", type);
		}
	}

	this.callFunctionArray = function(functions, data) {
		if (functions.length > 0)
			for (var i = 0, len = functions.length; i < len; i++)
				functions[i](data);
	}

	this.init();
}
MusicPlayer.create = function(playlist) {
	return new MusicPlayer(playlist);
}

function Playlist() {
	var self = this;
	this.songs = [];
	this.length = 0;
	this.prefix = "";
	this.art = null;

	this.prefix = function(prefix) {
		self.prefix = prefix;
		return self;
	}

	this.add = function(song) {
		self.songs.push(song);
		self.length = self.songs.length;
		return self;
	}

	this.defaultArt = function(albumArt) {
		self.art = albumArt;
		// console.log("Art set to '" + albumArt + "'");
		return self;
	}

	this.get = function(index) {
		// We apply the prefix to the file right before it's returned so that the prefix doesn't
		// neccessarily have to be set before any songs are added.
		var song = self.songs[index];

		return {
			file: self.prefix + song.file,
			title: song.title,
			duration: song.duration,
			art: (song.art || self.art)
		}
	}
}
Playlist.create = function() {
	return new Playlist();
}

