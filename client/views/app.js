var App = (function() {
  var state = Banana.state;

  function App(el, localStream) {
    this.el = el;
    this.stream = localStream;

    shaven([this.el, ["ul.peers"]]);

    state.listen("connected", this.connected.bind(this));
    state.listen("peers:add", this.addBuddy.bind(this));
    state.listen("peers:remove", this.removeBuddy.bind(this));
  }

  App.prototype = {
    connected: function() {
      var isAvatar = true;
      var buddy = new Buddy(state.me, isAvatar);
      this.el.querySelector("ul.peers").appendChild(buddy.el);
    },

    addBuddy: function(peer) {
      var buddy = new Buddy(peer.id);
      this.el.querySelector("ul.peers").appendChild(buddy.el);
    },

    removeBuddy: function(peer) {
      this.el.querySelector('[data-id="' + peer.id + '"]').remove();
    }
  };

  return App;
}());
