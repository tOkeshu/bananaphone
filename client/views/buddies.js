var Buddy = (function() {
  var state   = Banana.state;
  var actions = Banana.actions;

  function Buddy(id, isAvatar) {
    this.id = id;
    this.isAvatar = !!isAvatar;
    this.peer = state.peers[this.id];

    this.render();

    state.listen("peers:" + id + ":mute", this.render.bind(this));
    state.listen("peers:" + id + ":metadata", this.render.bind(this));
  }

  Buddy.prototype = {
    toggleMute: function(event) {
      event.preventDefault();
      actions.toggleMute(this.id);
    },

    render: function() {
      var dom, classList, avatar;

      if (this.isAvatar) {
        classList = ["me", state.muted ? "muted" : ""].join(" ");
        dom = [
          "li.me", {"class": classList, "data-id": this.id},
            ["div",
              ["a", {"href": "#"},
                ["p.nickname", state.nickname],
                state.muted ? ["p.info", "muted"] : []
              ],
             ["img", {src: URL.createObjectURL(state.blobAvatar)}]
            ]
        ];
      } else {
        classList = this.peer.muted ? "muted" : "";
        dom = [
          "li", {"class": classList, "data-id": this.id},
            this.peer.connected ? this._peer() : this._loader(),
        ];
      }

      var el = shaven(dom)[0];
      if (this.el) {
        this.el.parentNode.replaceChild(el, this.el)
        this.el = el;
      } else {
        this.el = el;
      }

      this.el.addEventListener("click", this.toggleMute.bind(this));
    },

    _peer: function() {
      var connected = this.peer.connected;
      var muted     = this.peer.muted;
      var avatar    = null;

      if (this.peer.avatar)
        avatar = new Blob([this.peer.avatar], {type: "image/png"});

      return ["div",
               ["a", {"href": "#"},
                 ["p.nickname", this.peer.nickname],
                 muted ? ["p.info", "muted"] : []
               ],
               avatar ? ["img", {src: URL.createObjectURL(avatar)}] : []
             ];
    },

    _loader: function() {
      return ["div.ball-pulse", ["div"], ["div"], ["div"]];
    },
  };

  return Buddy;
}());
