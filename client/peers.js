var Peers = (function() {

  function Peer(id, config) {
    var pc = new mozRTCPeerConnection(config);
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
      offer = new mozRTCSessionDescription(offer);
      this.pc.setRemoteDescription(offer, function() {
        this.pc.createAnswer(function(answer) {
          this.pc.setLocalDescription(answer, function() {
            callback(answer)
          });
        }.bind(this), function() {});
      }.bind(this), function() {});
    },

    complete: function(answer, callback) {
      answer = new mozRTCSessionDescription(answer);
      this.pc.setRemoteDescription(answer, callback);
    },

    addStream: function(localStream, muted) {
      this.stream = localStream;
      this.setMute(muted);
      this.pc.addStream(localStream);
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
    this.config = config;
  }

  Peers.prototype = {
    get: function(id) {
      return this.peers[id];
    },

    add: function(id) {
      var peer = new Peer(id, this.config);
      this.peers[id] = peer;
      this.trigger("add", peer);
    }
  };

  MicroEvent.mixin(Peers);
  Peers.prototype.on = Peers.prototype.bind;

  return Peers;
}());
