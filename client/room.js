(function() {
  var room = window.location.pathname.split('/')[2];
  var phone = new BananaPhone(room);
  var localAudio = document.querySelector("audio");
  var buddies = new Buddies();

  phone.on("connected", function(uid) {
    var isAvatar = true;
    var avatar = buddies.add(uid, isAvatar);
    document.querySelector("ul.peers").appendChild(avatar.el);
    avatar.setStream(phone.stream);

    avatar.el.addEventListener("click", function() {
      phone.toggleMyMuteState();
    });
  });

  phone.on("newbuddy", function(peer) {
    console.log("newbuddy", peer.id);
    var buddy = buddies.add(peer.id);

    peer.on("stream", function(remoteStream) {
      buddy.setStream(remoteStream);
    });

    document.querySelector("ul.peers").appendChild(buddy.el);
  });

  phone.on("buddyleft", function(peer) {
    buddies.get(peer.id).destroy();
  });

  phone.on("connection", function() {
    console.log("new connection");
  });
  phone.on("failure", function() {
    console.log("failure");
  });

  navigator.getUserMedia({audio: true}, function(localStream) {
    localAudio.src = URL.createObjectURL(localStream);
    localAudio.play();

    phone.start(localStream);
  }, function(err) {
    console.error("getUserMedia Failed: " + err);
  });

}());
