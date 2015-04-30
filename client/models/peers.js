var Peer = (function() {
  var CONFIG = {
    iceServers: [{
      // please contact me if you plan to use this server
      url: 'turn:webrtc.monkeypatch.me:1025?transport=udp',
      credential: 'hibuddy',
      username: 'hibuddy'
    }]
  };
  var encoder = new tnetbin.Encoder({arraybuffer: true});
  var decoder = new tnetbin.Decoder();
  var attachementsDecoder = new tnetbin.Decoder({arraybuffer: true});

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

    var dc = pc.createDataChannel("banana", {id: 0, negotiated: true});
    dc.onopen = this._onDatachannelOpen.bind(this);
    dc.onmessage = this._onMessage.bind(this);
    dc.onclose = this.trigger.bind(this, "disconnected");
    dc.binaryType = "arraybuffer";

    this.id       = id;
    this.pc       = pc;
    this.dc       = dc;
    this.queue    = [];

    this.audio    = document.createElement("audio");
    this.nickname = null;
    this.avatar   = null;
    this.connected = false;
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

    send: function(data) {
      var message, attachements;
      if (this.dc.readyState === "connecting") {
        this.queue.push(data);
        return;
      }

      attachements = data.attachements;
      delete data.attachements;

      message = encoder.encode(data);
      if (attachements) {
        message = tnetbin.concatArrayBuffers([
          message,
          encoder.encode(attachements)
        ]);
      }

      this.dc.send(message);
    },

    _onIceStateChange: function() {
      // XXX: display an error if the ice connection failed
      console.log("ice: " + this.pc.iceConnectionState);
      if (this.pc.iceConnectionState === "failed") {
        console.error("Something went wrong: the connection failed");
        this.trigger("failure");
      }

      if (this.pc.iceConnectionState === "connected") {
        this.connected = true;
        this.trigger("connected");
      }
    },

    _onDatachannelOpen: function() {
      while (this.queue.length > 0) {
        this.send(this.queue.shift());
      }
    },

    _onMessage: function(event) {
      var payload, message, remain;

      payload = decoder.decode(event.data);
      message = payload.value;
      remain  = payload.remain;

      if (remain) {
        payload = attachementsDecoder.decode(remain);
        message.attachements = payload.value;
      } else
        message.attachements = {}

      this.trigger(message.type, message);
    },

    _onError: function(error) {
      console.error(error);
    }
  };

  MicroEvent.mixin(Peer);
  Peer.prototype.on = Peer.prototype.bind;
  return Peer;
}());
