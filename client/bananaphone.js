var BananaPhone = (function() {
  function BananaPhone(room) {
    this.room   = room;
    this.peers  = new Peers();
    this.me     = undefined;
    this.token  = undefined;
    this.stream = undefined;
    this.muted  = false;
  }

  BananaPhone.prototype = {
    start: function(stream) {
      this.stream = stream;

      this.source = new EventSource("/api/rooms/" + this.room);
      this.source.on = this.source.addEventListener.bind(this.source);
      this.source.on("uid",          this._onUID.bind(this));
      this.source.on("newbuddy",     this._onNewBuddy.bind(this));
      this.source.on("buddyleft",    this._onBuddyLeft.bind(this));
      this.source.on("offer",        this._onOffer.bind(this));
      this.source.on("answer",       this._onAnswer.bind(this));
      this.source.on("icecandidate", this._onIceCandidate.bind(this));

      this.peers.on("add", this._setupPeer.bind(this));
    },

    toggleMyMuteState: function() {
      this.muted = !this.muted;
      this.peers.forEach(function(peer) {
        peer.setMute(this.muted);
      }.bind(this));
    },

    _onUID: function(event) {
      var message = JSON.parse(event.data);
      this.me = message.uid;
      this.token = message.token;

      console.log('UID: ' + this.me);
      console.log('TOKEN: ' + this.token);
      this.trigger("connected", this.me);
    },

    _onNewBuddy: function(event) {
      var message = JSON.parse(event.data);
      this.peers.add(message.peer);
      this._sendOffer(message.peer);

      this.trigger("newbuddy", this.peers.get(message.peer));
    },

    _onBuddyLeft: function(event) {
      var message = JSON.parse(event.data);
      this.trigger("buddyleft", this.peers.get(message.peer));
    },

    _onOffer: function(event) {
      var message = JSON.parse(event.data);
      this.peers.add(message.peer);
      this._sendAnswer(message.peer, message.offer);

      this.trigger("newbuddy", this.peers.get(message.peer));
    },

    _onAnswer: function(event) {
      var message = JSON.parse(event.data);
      // console.log("answer", message.answer);

      this.peers.get(message.peer).complete(message.answer, function() {
        // console.log("done");
        // console.log("peers:", this.peers);
      }.bind(this));
    },

    _onIceCandidate: function(event) {
      var message = JSON.parse(event.data);
      this.peers.get(message.peer).addIceCandidate(message.candidate);
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
      peer.addStream(this.stream, this.muted);
    },

    _sendOffer: function(peerId) {
      this.peers.get(peerId).createOffer(function(offer) {
        this._post({type: 'offer', peer: peerId, payload: {offer: offer}});
      }.bind(this));
    },

    _sendAnswer: function(peerId, offer) {
      this.peers.get(peerId).createAnswer(offer, function(answer) {
        this._post({type: 'answer', peer: peerId, payload: {answer: answer}});
      }.bind(this));
    },

    _post: function(message) {
      var xhr = new XMLHttpRequest();
      message.token = this.token;

      xhr.open('POST', '/api/rooms/' + this.room, true);
      xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      xhr.send(JSON.stringify(message));
    }
  };

  MicroEvent.mixin(BananaPhone);
  BananaPhone.prototype.on = BananaPhone.prototype.bind;

  return BananaPhone;
}());