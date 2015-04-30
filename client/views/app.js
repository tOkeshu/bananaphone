var App = (function() {
  var state   = Banana.state;
  var actions = Banana.actions;

  function App(el, localStream) {
    this.el = el;
    this.stream = localStream;

    this.switchPanel();

    state.listen("panel", this.switchPanel.bind(this));
    state.listen("connected", this.connected.bind(this));
    state.listen("peers:add", this.addBuddy.bind(this));
    state.listen("peers:remove", this.removeBuddy.bind(this));
    state.listen("avatar", this.updateAvatar.bind(this));

    this.el.querySelector('.take-picture')
      .addEventListener("click", this.onTakePicture.bind(this));
    this.el.querySelector('input[type=file]')
      .addEventListener("change", this.onFiles.bind(this));
    this.el.querySelector('[data-name=form]')
      .addEventListener("submit", this.joinRoom.bind(this));
  }

  App.prototype = {
    joinRoom: function(event) {
      event.preventDefault();
      var nickname = this.el.querySelector('input[type=text]').value;
      actions.joinRoom(nickname);
    },

    onTakePicture: function(event) {
      event.preventDefault();
      this.el.querySelector('input[type=file]').click();
    },

    onFiles: function(event) {
      actions.importAvatar(event.target.files[0]);
    },

    updateAvatar: function() {
      var avatar = this.el.querySelector('img.avatar');
      avatar.src = URL.createObjectURL(state.blobAvatar);
    },

    switchPanel: function() {
      var panels = this.el.querySelectorAll(".panel");
      panels = Array.prototype.slice.apply(panels);
      panels.forEach(function(panel) {
        if (panel.dataset.name === state.panel)
          panel.classList.remove("hidden");
        else
          panel.classList.add("hidden");
      });
    },

    connected: function() {
      var isAvatar = true;
      var buddy = new Buddy(state.me, isAvatar);
      this.el.querySelector('[data-name="peers"]').appendChild(buddy.el);
    },

    addBuddy: function(peer) {
      var buddy = new Buddy(peer.id);
      this.el.querySelector('[data-name="peers"]').appendChild(buddy.el);
    },

    removeBuddy: function(peer) {
      this.el.querySelector('[data-id="' + peer.id + '"]').remove();
    }
  };

  return App;
}());
