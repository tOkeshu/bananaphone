(function() {
  var room = window.location.pathname.split('/')[2];
  var phone = new BananaPhone(room);
  var localAudio = document.querySelector("audio");

  phone.on("newbuddy", function(peer) {
    peer.on("stream", function(remoteStream) {
      console.log("new stream", remoteStream);
      var audio = document.createElement('audio');
      document.querySelector("ul.peers").appendChild(audio);
      audio.mozSrcObject = remoteStream;
      audio.play();
    });
  });
  phone.on("connection", function() {
    console.log("new connection");
  });
  phone.on("failure", function() {
    console.log("failure");
  });

  navigator.mozGetUserMedia({audio: true}, function(localStream) {
    localAudio.mozSrcObject = localStream;
    localAudio.play();

    phone.start(localStream);
  }, function(err) {
    console.error("getUserMedia Failed: " + err);
  });

}());
