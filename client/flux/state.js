window.Banana = window.Banana || {};
window.Banana.state = (function() {
  function State(values) {
    Object.keys(values).forEach(function(key) {
      this[key] = values[key];
    }.bind(this));

  }
  MicroEvent.mixin(State);
  State.prototype.listen = State.prototype.bind;
  State.prototype.notify = State.prototype.trigger;

  var room = window.location.pathname.split('/')[2];
  return new State({
    me:        null,  // uid
    token:     null,  // secret token
    connected: false,
    peers:     {},    // peer connections
    room:      room
  });
}());
