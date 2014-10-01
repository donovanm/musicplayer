function MusicPlayerUI(elem, musicPlayer) {
	var self = this;
	init(elem, musicPlayer);

	function init(elem, mpObject) {
		self.musicPlayer = mpObject;
		self.baseElem = $(elem);

		var baseElem = self.baseElem,
			musicPlayer = self.musicPlayer;

		addElements();
		addActions();
		addListeners();


		// Set info for current song
		var songInfo = musicPlayer.getSongInfo();

		baseElem.find(".album-cover img").attr('src', songInfo.art);
		baseElem.find(".song-title").text(songInfo.title);
		baseElem.find(".song-duration").text(formatTime(songInfo.duration));
		baseElem.find(".song-position").text(formatTime(songInfo.position));

		// Add songs to playlist
		var playlist = musicPlayer.getPlaylist();

		for (var i = 0, len = playlist.length; i < len; i++) {
			(function(track) {
				var songDiv = $("<div>")
					.addClass("song")
					.html('<span class="duration">' + playlist.get(i).duration + '</span><span class="title">' + playlist.get(i).title + '</span>')
					.css('cursor', "pointer")
					.click(function() {
						musicPlayer.setTrackNum(track);
					});

				baseElem.find(".playlist").append(songDiv);
			})(i);	
		}

		// Mark the current song in the playlist
		baseElem.find(".playlist > .song").eq(songInfo.track)
			.addClass("selected");

		// Set play state
		if (musicPlayer.isPlaying)
			baseElem.find(".playPauseToggle").css('background-image', "url('img/pause.png')").css('background-size', "100%");
		else
			baseElem.find(".playPauseToggle").css('background-image', "url('img/play.png')").css('background-size', "100%");


		// Slide in the song info panel
		setTimeout(function() { baseElem.find(".song-info")[0].style.maxHeight = "100px"; }, 600);
	}

	function addElements() {
		self.baseElem.html('\
			<div class="album-cover">\
				<img>\
				<div class="song-info">\
					<div class="song-title"> </div>\
					<div class="song-progress">\
						<div class="song-progress-bar"></div>\
						<div class="song-progress-indicator"></div>\
					</div>\
					<div class="song-position-info">\
						<span class="song-position">0:00</span> / <span class="song-duration">-:--</span>\
					</div>\
				</div>\
			</div>\
			<div class="playlist"></div>\
			<div class="player-controls">\
				<a class="toggleView">L</a>\
				<a class="prev"></a>\
				<a class="playPauseToggle"></a>\
				<a class="next"></a>\
			</div>\
		')
		.css('display', "block");
	}


	function addActions() {
		var baseElem = self.baseElem,
			musicPlayer = self.musicPlayer;

		baseElem.find(".playPauseToggle").mousedown(function(e) {
			e.preventDefault();
			togglePlayPause();
		})

		baseElem.find(".album-cover > img").mousedown(function(e) {
			e.preventDefault();
			togglePlayPause();
		})

		baseElem.find(".prev").mousedown(function(e) {
			e.preventDefault();
			musicPlayer.prev();
		})

		baseElem.find(".next").mousedown(function(e) {
			e.preventDefault();
			musicPlayer.next();
		})

		function togglePlayPause() {
			if (musicPlayer.isPlaying) {
				musicPlayer.pause();
			} else {
				musicPlayer.play();
			}
		}

		// Switches between wide and long views
		baseElem.find(".toggleView").click(function(e) {
			e.preventDefault();
			var player = baseElem;

			if (player.hasClass("wide"))
				player.removeClass("wide");
			else
				player.addClass("wide");
		})


		// Dragging the slider
		self.slider = {
			down: function(e) {
				self.slider.target = $(this);
				self.slider.startX = e.clientX;
				self.slider.startLeft = parseInt($(this).css('left'));
				self.slider.isPlaying = musicPlayer.isPlaying;
				self.slider.duration = musicPlayer.getSongInfo().duration;

				$(window).on('mousemove', self.slider.move);
				$(window).on('mouseup', self.slider.up);

				if (self.slider.isPlaying)
					musicPlayer.silence();
			},

			move: function(e) {
				var left = self.slider.startLeft + e.clientX - self.slider.startX;
				var percent = left / self.slider.target.parent().width();

				// Don't go out of bounds
				if (percent > 1) {
					percent = 1;
					left = self.slider.target.parent().width();
				}
				else if (percent < 0) {
					percent = 0;
					left = 0;
				}

				// Show the current time position in the song
				baseElem.find(".song-position").text(formatTime(self.slider.duration * percent));

				self.slider.target.css('left', left + "px");
			},

			up: function(e) {
				var percent = (self.slider.startLeft + e.clientX - self.slider.startX) / self.slider.target.parent().width();
				musicPlayer.setPosition(percent * self.slider.duration);

				if (self.slider.isPlaying)
					musicPlayer.unsilence();

				$(window).off('mousemove', self.slider.move);
				$(window).off('mouseup', self.slider.up);
				self.slider.target = null;
			}
		};

		baseElem.find(".song-progress-indicator").on('mousedown', self.slider.down);

		// Jump to a position of the song according to which part of the progress bar was clicked.
		baseElem.find(".song-progress").on('mousedown', function(e) {
			var songInfo = musicPlayer.getSongInfo();
			var left = (e.pageX - $(this).offset().left);
			var percent = left / $(this).width();

			if (songInfo.duration > 0) {
				musicPlayer.setPosition(songInfo.duration * percent);
			}

			// Make the progress indicator jump to the current spot and begin its drag handling.
			// We check that the event target is 'this' so we can ignore bubbled events from clicking the indicator
			if (e.target == this) {
				var indicator = baseElem.find(".song-progress-indicator");
				indicator.css('left', (e.pageX - $(this).offset().left));
				indicator.trigger({
					type: 'mousedown',
					clientX: e.clientX
				});
			}
		});
	}


	function addListeners() {
		var baseElem = self.baseElem,
			musicPlayer = self.musicPlayer;

		musicPlayer.addListener(musicPlayer.evt.CHANGE, function(song) {
			baseElem.find(".song-title").text(song.title);
			baseElem.find(".song-duration").text(formatTime(-1));
			baseElem.find(".song-position").text(formatTime(0));
			baseElem.find(".album-cover img").attr('src', song.art);

			baseElem.find(".song-progress-indicator").css('left', "0px");

			// Clear playlist selections
			baseElem.find(".playlist > .song")
				.removeClass("selected");

			// Set selected song in playlist
			baseElem.find(".playlist > .song").eq(song.track)
				.addClass("selected");
		});

		musicPlayer.addListener(musicPlayer.evt.LOAD, function(song) {
			baseElem.find(".song-duration").text(formatTime(song.duration));
		});


		self.MPUI = {
			lastTime: 0,
			progressIndicator: baseElem.find(".song-progress-indicator"),
			songPosition: baseElem.find(".song-position")[0]
		}
		musicPlayer.addListener(musicPlayer.evt.UPDATE, function(e) {
			var time = Math.floor(e.position);

			// The if statement just makes it so there's only one update per second.
			if (time !== self.MPUI.lastTime || time == 0) {

				self.MPUI.songPosition.innerHTML = formatTime(e.position);
				var percent = (e.duration != 0) ? (e.position / e.duration) * 100 : 0;
				self.MPUI.progressIndicator.css('left', percent + "%");
				self.MPUI.lastTime = time;
			}
		});

		musicPlayer.addListener(musicPlayer.evt.PLAY, function(e) {
			baseElem.find(".playPauseToggle").css('background-image', "url('img/pause.png')")
		});

		musicPlayer.addListener(musicPlayer.evt.PAUSE, function(e) {
			// Uses setTimeout so play/pause button won't flicker when switching tracks
			setTimeout(function() {
				if (!musicPlayer.isPlaying)
					baseElem.find(".playPauseToggle").css('background-image', "url('img/play.png')")
			}, 100);
		});
	}

	function formatTime(seconds) {
		if (seconds >= 0) {
			// var seconds = millis / 1000;
			var minutes = Math.floor(seconds / 60);
			seconds = Math.floor(seconds % 60);

			return "" + minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;
		} else {
			return "-:--";
		}
	}

	this.init = init;
}

MusicPlayerUI.create = function(elem, musicPlayer) {
	var mp = new MusicPlayerUI(elem, musicPlayer);
	return mp;
}

