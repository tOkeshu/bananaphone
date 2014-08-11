var Peers = (function() {

  function Peer(id, config) {
    var pc = new RTCPeerConnection({
      iceServers: [{
        // please contact me if you plan to use this server
        url: 'turn:webrtc.monkeypatch.me:1025?transport=udp',
        credential: 'hibuddy',
        username: 'hibuddy'
      }]
    });
    pc.onaddstream = function(event) {
      this.trigger("stream", event.stream);
    }.bind(this);
    pc.oniceconnectionstatechange = this._onIceStateChange.bind(this);
    pc.onicecandidate = function(event) {
      this.trigger("icecandidate", event);
    }.bind(this);

    this.id = id;
    this.pc = pc;
  }

  Peer.prototype = {
    createOffer: function(callback) {
      this.pc.createOffer(function(offer) {
        this.pc.setLocalDescription(offer, function() {
          callback(offer);
        });
      }.bind(this), function() {});
    },

    createAnswer: function(offer, callback) {
      offer = new RTCSessionDescription(offer);
      this.pc.setRemoteDescription(offer, function() {
        this.pc.createAnswer(function(answer) {
          this.pc.setLocalDescription(answer, function() {
            callback(answer)
          });
        }.bind(this), function() {});
      }.bind(this), function() {});
    },

    complete: function(answer, callback) {
      answer = new RTCSessionDescription(answer);
      this.pc.setRemoteDescription(answer, callback);
    },

    addStream: function(localStream, muted) {
      this.stream = localStream;
      this.setMute(muted);
      this.pc.addStream(localStream);
    },

    addIceCandidate: function(candidate) {
      candidate = new RTCIceCandidate(candidate);
      this.pc.addIceCandidate(candidate);
    },

    setMute: function(muted) {
      this.stream.getAudioTracks().forEach(function(track) {
        track.enabled = !muted;
      });
    },

    _onIceStateChange: function() {
      // XXX: display an error if the ice connection failed
      console.log("ice: " + this.pc.iceConnectionState);
      if (this.pc.iceConnectionState === "failed") {
        console.error("Something went wrong: the connection failed");
        this.trigger("failure");
      }

      if (this.pc.iceConnectionState === "connected")
        this.trigger("connected");
    }
  };

  MicroEvent.mixin(Peer);
  Peer.prototype.on = Peer.prototype.bind;


  function Peers(config) {
    this.peers = {};
  }

  Peers.prototype = {
    get: function(id) {
      return this.peers[id];
    },

    add: function(id) {
      var peer = new Peer(id);
      this.peers[id] = peer;
      this.trigger("add", peer);
    },

    forEach: function(callback) {
      Object.keys(this.peers).forEach(function(id) {
        callback(this.peers[id]);
      }.bind(this));
    }
  };

  MicroEvent.mixin(Peers);
  Peers.prototype.on = Peers.prototype.bind;

  return Peers;
}());
