var Buddy = (function() {
  var state = Banana.state;
  var actions = Banana.actions;

  function Buddy(id, isAvatar) {
    this.id = id;
    this.isAvatar = !!isAvatar;
    this.el = shaven(
      ["li", {"class": (isAvatar ? "me" : ""), "data-id": this.id},
        ["aside.pack-end",
          ["img.avatar", {
            "src": "/static/images/k.png",
            "title": this.id,
            "style": "background-color: #" + this.id.slice(-6)
          }]
        ],
        ["p.nickname", "Unamed"],
        ["div.progress",
          ["div.bar", {"style": "width: 33%"}]
        ]
      ])[0];

    state.listen("peers:" + id + ":mute", this.onMute.bind(this));
    this.el.addEventListener("click", this.toggleMute.bind(this));
  }

  Buddy.prototype = {
    toggleMute: function() {
      actions.toggleMute(this.id);
    },

    onMute: function() {
      var muted = this.isAvatar ? state.muted : state.peers[this.id].muted;

      if (muted)
        this.el.classList.add("muted");
      else
        this.el.classList.remove("muted");
    }
  };

  return Buddy;
}());
