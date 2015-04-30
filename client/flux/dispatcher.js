window.Banana = window.Banana || {};
window.Banana.actions = (function() {
  var state = Banana.state;

  function readFile(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();

      reader.onload = function(event) {
        var blob = event.target.result;
        resolve(blob);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function dataUrlToArrayBuffer(dataUrl) {
    var binStr = atob(dataUrl.split(',')[1]);
    var len    = binStr.length;
    var buffer = new Uint8Array(len);

    for (var i = 0; i < len; i++) {
      buffer[i] = binStr.charCodeAt(i);
    }

    return buffer;
  }

  function Dispatcher() {
    this.source = null;
    this.stream = null;

    state.listen("peers:add", this._setupPeer.bind(this));
    state.listen("nickname", this._generateDefaultAvatar.bind(this));
  }

  Dispatcher.prototype = {
    joinRoom: function(nickname) {
      navigator.getUserMedia({audio: true}, function(localStream) {
        this.listen(localStream);
      }.bind(this), function(err) {
        console.error("getUserMedia Failed: " + err);
      });
      state.nickname = nickname;
      state.notify("nickname");
    },

    updateNickname: function(nickname) {
      state.nickname = nickname;
      state.notify("nickname");
    },

    listen: function(stream) {
      this.stream = stream;

      this.source = new EventSource("/api/rooms/" + state.room);
      this.source.on = this.source.addEventListener.bind(this.source);
      this.source.on("uid",          this._onUID.bind(this));
      this.source.on("newbuddy",     this._onNewBuddy.bind(this));
      this.source.on("buddyleft",    this._onBuddyLeft.bind(this));
      this.source.on("offer",        this._onOffer.bind(this));
      this.source.on("answer",       this._onAnswer.bind(this));
      this.source.on("icecandidate", this._onIceCandidate.bind(this));

      state.panel = "peers";
      state.notify("panel");
    },

    toggleMute: function(id) {
      if (id === state.me) {
        state.muted = !state.muted;
        Object.keys(state.peers).forEach(function(peerId) {
          state.peers[peerId].setOutboundMute(state.muted);
        });
      } else {
        state.peers[id].toggleInboundMute();
      }

      state.notify(`peers:${id}:mute`);
    },

    importAvatar: function(file) {
      readFile(file).then(function(avatar) {
        console.log(avatar);
        state.avatar = avatar;
        state.notify("avatar");
      });
    },

    _generateDefaultAvatar: function() {
      var canvas = document.createElement("canvas");
      canvas.width = 150;
      canvas.height = 150;

      Identicon.render(canvas, state.nickname).then(function(canvas) {
        state.defaultAvatar = dataUrlToArrayBuffer(canvas.toDataURL());
        state.notify("avatar");
      });
    },

    _onUID: function(event) {
      var message = JSON.parse(event.data);

      state.me = message.uid;
      state.token = message.token
      state.connected = true;

      state.notify("me");
      state.notify("token");
      state.notify("connected");
      state.notify("buddies");
    },

    _onNewBuddy: function(event) {
      var message = JSON.parse(event.data);
      var peer    = new Peer(message.peer);

      state.peers[peer.id] = peer;

      this._sendOffer(message.peer);
      state.notify("peers:add", peer);
    },

    _onBuddyLeft: function(event) {
      var message = JSON.parse(event.data);
      var peer = state.peers[message.peer];

      state.peers = Object.keys(state.peers).reduce(function(peers, peerId) {
        if (peerId !== message.peer)
          peers[peerId] = state.peers[peerId];

        return peers;
      }, {});

      state.notify("peers:remove", peer);
    },

    _onOffer: function(event) {
      var message = JSON.parse(event.data);
      var peer    = new Peer(message.peer);

      state.peers[peer.id] = peer;

      this._sendAnswer(peer.id, message.offer);
      state.notify("peers:add", peer);
    },

    _onAnswer: function(event) {
      var message = JSON.parse(event.data);

      state.peers[message.peer].complete(message.answer, function() {
      }.bind(this));
    },

    _onIceCandidate: function(event) {
      var message = JSON.parse(event.data);
      state.peers[message.peer].addIceCandidate(message.candidate);
    },

    _newIceCandidate: function(peer, event) {
      if (event.candidate) {
        this._post({
          type: 'icecandidate',
          peer: peer.id,
          payload: {candidate: event.candidate}
        });
      }
    },

    _setupPeer: function(peer) {
      peer.on("icecandidate", this._newIceCandidate.bind(this, peer));
      peer.on("connected", this._sendMetadata.bind(this, peer));
      peer.on("metadata", function(metadata) {
        peer.nickname  = metadata.nickname;
        peer.avatar    = metadata.attachements.avatar;
        state.notify("peers:" + peer.id + ":metadata");
      });
      peer.addStream(this.stream, state.muted);
    },

    _sendOffer: function(peerId) {
      state.peers[peerId].createOffer(function(offer) {
        this._post({type: 'offer', peer: peerId, payload: {offer: offer}});
      }.bind(this));
    },

    _sendAnswer: function(peerId, offer) {
      state.peers[peerId].createAnswer(offer, function(answer) {
        this._post({type: 'answer', peer: peerId, payload: {answer: answer}});
      }.bind(this));
    },

    _sendMetadata: function(peer) {
      peer.send({
        type: "metadata",
        nickname: state.nickname,
        attachements: {
          avatar: state.avatar
        }
      });
    },

    _post: function(message) {
      var xhr = new XMLHttpRequest();
      message.token = state.token;

      xhr.open('POST', '/api/rooms/' + state.room, true);
      xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      xhr.send(JSON.stringify(message));
    }
  };

  return new Dispatcher();
}());
