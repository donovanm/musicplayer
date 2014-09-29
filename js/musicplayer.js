/**
*	Kid Lion Music Player
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

	this.start = function() {
		soundManager.setup({
			onready: function() {
				self.loadSong(playlist.get(self.trackNum).file, true);
			},

			ontimeout: function() {
				console.error("Error loading SoundManager");
			}
		});

		return self;
	}

	this.loadSong = function(fileName, autoPlay) {
		self.position = 0;

		self.currentSound = soundManager.createSound({
			url: fileName,

			onload: function() {
				self.notifyListener(self.evt.LOAD, self.getSongInfo());
			},

			whileplaying: function() {
				self.position = this.position;
				self.notifyListener(self.evt.UPDATE, {
					position: this.position,
					duration: (self.currentSound !== null) ? self.currentSound.duration : 0
				});
			},

			onfinish: function() {
				self.next();
			}
		});

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
			if (self.currentSound !== null)
				self.currentSound.destruct();

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
		self.currentSound.setPosition(position);
	}

	this.play = function() {
		if (!self.isPlaying) {
			self.currentSound.play();
			self.notifyListener(self.evt.PLAY, null);
			self.isPlaying = true;
		}
	}

	this.pause = function() {
		if (self.isPlaying) {
			self.currentSound.pause();
			self.notifyListener(self.evt.PAUSE, null);
			self.isPlaying = false;
		}
	}

	this.next = function() {
		var isPlaying = self.isPlaying;
		self.pause();
		self.currentSound.destruct();

		if (++self.trackNum >= self.playlist.length)
			self.trackNum = 0;

		self.loadSong(playlist.get(self.trackNum).file, isPlaying);
	}

	this.prev = function() {
		var isPlaying = self.isPlaying;
		self.pause();
		self.currentSound.destruct();

		if (--self.trackNum < 0)
			self.trackNum = playlist.length - 1;

		self.loadSong(playlist.get(self.trackNum).file, isPlaying);
	}

	this.setVolume = function(volume) {

	}

	// This pauses the player without calling event handlers. This is useful when
	// using a slider to change the song position
	this.silence = function() {
		self.currentSound.pause();
	}

	this.unsilence = function() {
		self.currentSound.play();
	}

	// Just changes the current track to a random one. Maybe in the future I'll
	// add a full shuffle
	this.shuffle = function() {
		self.trackNum = Math.floor(Math.random() * playlist.length);
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

	this.art = function(albumArt) {
		self.art = albumArt;
		console.log("Art set to '" + albumArt + "'");
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



// Let's actually create the music player and playlist and start playing music
musicPlayer = MusicPlayer.create(
		Playlist.create()
			.prefix("music/")
			.add({ file: "lord_knows.mp3",	title: "Lord Knows",	duration: "3:36" })
			.add({ file: "dnstm.mp3",		title: "#DNSTM",		duration: "4:04",	art: "img/albumcover.jpg" })
			.add({ file: "chill_out.mp3",	title: "Chill Out",		duration: "3:06",	art: "img/album3.jpg" })
			.add({ file: "kid_july.mp3",	title: "July",			duration: "1:36",	art: "img/YungKings.jpg" })
			.add({ file: "mlk.mp3",			title: "MLK",			duration: "1:35",	art: "img/album3.jpg" })
			.add({ file: "dont_letem_lie_to_you.mp3", title: "Don't Let 'Em Lie To You", duration: "1:46"})
			.add({ file: "questions.mp3",	title: "Questions",		duration: "1:50" })
			.add({ file: "party.mp3",		title: "Party",			duration: "1:26" })
			.add({ file: "money.mp3",		title: "Money",			duration: "1:20",	art: "img/album3.jpg" })
			.add({ file: "idgaf.mp3",		title: "IDGAF Freestyle", duration: "1:30" })
			.add({ file: "rise.mp3",		title: "Rise",			duration: "1:55" })
			.add({ file: "moola.mp3",		title: "Moola",			duration: "1:14",	art: "img/YungKings.jpg" })
			.art("img/album2.jpg")
	)
	// .shuffle()
	.setTrackNum(10)
	.start();
