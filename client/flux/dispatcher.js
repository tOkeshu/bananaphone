window.Banana = window.Banana || {};
window.Banana.actions = (function() {
  var state = Banana.state;

  function Dispatcher() {
    this.source = null;
    this.stream = null;

    state.listen("peers:add", this._setupPeer.bind(this));
  }

  Dispatcher.prototype = {
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