var Peer = (function() {
  var CONFIG = {
    iceServers: [{
      // please contact me if you plan to use this server
      url: 'turn:webrtc.monkeypatch.me:1025?transport=udp',
      credential: 'hibuddy',
      username: 'hibuddy'
    }]
  };

  function Peer(id) {
    var pc = new RTCPeerConnection(CONFIG);
    pc.onaddstream = function(event) {
      this.audio.src = URL.createObjectURL(event.stream);
      this.audio.play();
    }.bind(this);
    pc.oniceconnectionstatechange = this._onIceStateChange.bind(this);
    pc.onicecandidate = function(event) {
      this.trigger("icecandidate", event);
    }.bind(this);

    this.id = id;
    this.pc = pc;
    this.audio = document.createElement("audio");
  }

  Peer.prototype = {
    get muted(){
      return this.audio.muted;
    },

    createOffer: function(callback) {
      this.pc.createOffer(function(offer) {
        this.pc.setLocalDescription(offer, function() {
          callback(offer);
        }, this._onError.bind(this));
      }.bind(this), this._onError.bind(this));
    },

    createAnswer: function(offer, callback) {
      offer = new RTCSessionDescription(offer);
      this.pc.setRemoteDescription(offer, function() {
        this.pc.createAnswer(function(answer) {
          this.pc.setLocalDescription(answer, function() {
            callback(answer)
          }, this._onError.bind(this));
        }.bind(this), this._onError.bind(this));
      }.bind(this), this._onError.bind(this));
    },

    complete: function(answer, callback) {
      answer = new RTCSessionDescription(answer);
      this.pc.setRemoteDescription(answer, callback, this._onError.bind(this));
    },

    addStream: function(localStream, muted) {
      this.stream = localStream;
      this.setOutboundMute(muted);
      this.pc.addStream(localStream);
    },

    addIceCandidate: function(candidate) {
      candidate = new RTCIceCandidate(candidate);
      this.pc.addIceCandidate(candidate);
    },

    setOutboundMute: function(muted) {
      this.stream.getAudioTracks().forEach(function(track) {
        track.enabled = !muted;
      });
    },

    toggleInboundMute: function() {
      this.audio.muted = !this.audio.muted;
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
    },

    _onError: function(error) {
      console.error(error);
    }
  };

  MicroEvent.mixin(Peer);
  Peer.prototype.on = Peer.prototype.bind;
  return Peer;
}());
