var MusicPlayerUI = (function() {
	var musicPlayer;

	function addActions() {
		$("#playPauseToggle").mousedown(function(e) {
			e.preventDefault();
			togglePlayPause();
		})

		$("#album-cover > img").mousedown(function(e) {
			e.preventDefault();
			togglePlayPause();
		})

		$("#prev").mousedown(function(e) {
			e.preventDefault();
			musicPlayer.prev();
		})

		$("#next").mousedown(function(e) {
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
		$("#toggleView").click(function(e) {
			e.preventDefault();
			var player = $("#player");

			if (player.hasClass("wide"))
				player.removeClass("wide");
			else
				player.addClass("wide");
		})


		// Dragging the slider
		slider = {
			down: function(e) {
				slider.target = $(this);
				slider.startX = e.clientX;
				slider.startLeft = parseInt($(this).css('left'));
				slider.isPlaying = musicPlayer.isPlaying;
				slider.duration = musicPlayer.getSongInfo().duration;

				$(window).on('mousemove', slider.move);
				$(window).on('mouseup', slider.up);

				if (slider.isPlaying)
					musicPlayer.silence();
			},

			move: function(e) {
				var left = slider.startLeft + e.clientX - slider.startX;
				var percent = left / slider.target.parent().width();

				// Don't go out of bounds
				if (percent > 1) {
					percent = 1;
					left = slider.target.parent().width();
				}
				else if (percent < 0) {
					percent = 0;
					left = 0;
				}

				// Show the current time position in the song
				$("#song-position").text(formatTime(slider.duration * percent));

				slider.target.css('left', left + "px");
			},

			up: function(e) {
				var percent = (slider.startLeft + e.clientX - slider.startX) / slider.target.parent().width();
				musicPlayer.setPosition(percent * slider.duration);

				if (slider.isPlaying)
					musicPlayer.unsilence();

				$(window).off('mousemove', slider.move);
				$(window).off('mouseup', slider.up);
				slider.target = null;
			}
		};

		$("#song-progress-indicator").on('mousedown', slider.down);

		// Jump to a position of the song according to which part of the progress bar was clicked.
		$("#song-progress").on('mousedown', function(e) {
			var songInfo = musicPlayer.getSongInfo();
			var left = (e.pageX - $(this).offset().left);
			var percent = left / $(this).width();

			if (songInfo.duration > 0) {
				musicPlayer.setPosition(songInfo.duration * percent);
			}

			// Make the progress indicator jump to the current spot and begin its drag handling.
			// We check that the event target is 'this' so we can ignore bubbled events from clicking the indicator
			if (e.target == this) {
				var indicator = $("#song-progress-indicator");
				indicator.css('left', (e.pageX - $(this).offset().left));
				indicator.trigger({
					type: 'mousedown',
					clientX: e.clientX
				});
			}
		});
	}

	function init(mpObject) {
		musicPlayer = mpObject;

		addActions();
		addListeners();


		// Set info for current song
		var songInfo = musicPlayer.getSongInfo();

		$("#album-cover img").attr('src', songInfo.art);
		$("#song-title").text(songInfo.title);
		$("#song-duration").text(formatTime(songInfo.duration));
		$("#song-position").text(formatTime(songInfo.position));

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

				$("#playlist").append(songDiv);
			})(i);	
		}

		// Select the current song in the playlist
		$("#playlist > .song").eq(songInfo.track)
			.addClass("selected");

		// Set play state
		if (musicPlayer.isPlaying)
			$("#playPauseToggle").css('background-image', "url('img/pause.png')").css('background-size', "100%");
		else
			$("#playPauseToggle").css('background-image', "url('img/play.png')").css('background-size', "100%");


		// Slide in the song info panel
		setTimeout(function() { $("#song-info")[0].style.maxHeight = "100px"; }, 600);
	}

	function addListeners() {
		musicPlayer.addListener(musicPlayer.evt.CHANGE, function(song) {
			$("#song-title").text(song.title);
			$("#song-duration").text(formatTime(-1));
			$("#song-position").text(formatTime(0));
			$("#album-cover img").attr('src', song.art);

			$("#song-progress-indicator").css('left', "0px");

			// Clear playlist selections
			$("#playlist > .song")
				.removeClass("selected");

			// Set selected song in playlist
			$("#playlist > .song").eq(song.track)
				.addClass("selected");
		});

		musicPlayer.addListener(musicPlayer.evt.LOAD, function(song) {
			$("#song-duration").text(formatTime(song.duration));
		});


		MPUI = {
			lastTime: 0,
			counter: 0,
			progressIndicator: $("#song-progress-indicator"),
			songPosition: $("#song-position")[0]
		}
		musicPlayer.addListener(musicPlayer.evt.UPDATE, function(e) {
			var time = Math.floor(e.position / 100);

			if (time !== MPUI.lastTime || time == 0) {

				MPUI.songPosition.innerHTML = formatTime(e.position);
				var percent = (e.duration != 0) ? (e.position / e.duration) * 100 : 0;
				MPUI.progressIndicator.css('left', percent + "%");
				MPUI.lastTime = time;
			}
		});

		musicPlayer.addListener(musicPlayer.evt.PLAY, function(e) {
			$("#playPauseToggle").css('background-image', "url('img/pause.png')")
		});

		musicPlayer.addListener(musicPlayer.evt.PAUSE, function(e) {
			$("#playPauseToggle").css('background-image', "url('img/play.png')")
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

	return {
		init: init
	}
})();