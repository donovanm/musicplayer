// Create the music player and playlist
musicPlayer = MusicPlayer.create(
		Playlist.create()
			.prefix("music/")
			.add({ file: "chopin-op-25.mp3", title: "Etude, Op. 25 no. 2", duration: "2:03" })
			.add({ file: "chopin-mazurka.mp3", title: "Mazurka in A Minor", duration: "5:34" })
			.add({ file: "beethoven-coriolan-overture.mp3", title: "Coriolan Overture, Op. 62", duration: "8:18"})
			.defaultArt("img/classical.jpg")
	)
	// .random()
	.setTrackNum(2)
	.setVolume(.3)
	.play();

// Create the UI for the musicPlayer
setTimeout(function() {
	MusicPlayerUI.create($("#mp1"), musicPlayer);
}, 3500);

setTimeout(function() {
	var player = document.getElementById("mp2"); // Works with DOM Elements
	MusicPlayerUI.create(player, musicPlayer);
}, 9550);

setTimeout(function() {
	MusicPlayerUI.create($("#mp3"), musicPlayer);
}, 15400);

setTimeout(function() {
	MusicPlayerUI.create($("#mp4"), musicPlayer);
}, 18000);

