var Buddies = (function() {

  function Buddy(id, isAvatar) {
    this.el = document.createElement("div");
    this.el.innerHTML =
      '<img class="avatar" src="/static/k.png">' +
      '  <audio></audio>' +
      '<div class="feedback hidden">' +
      '  <div class="level"></div>' +
      '</div>';
    this.el.querySelector("img").setAttribute("title", id);
    this.el.querySelector("img").style.backgroundColor = "#" + id.slice(-6);

    this.audio = this.el.querySelector("audio");
    this.id = id;
    this.isAvatar = !!isAvatar;

    // this.audio.addEventListener("canplay", this._plugAnalyser.bind(this));
    if (this.isAvatar)
      this.audio.muted = true;
    this.el.addEventListener("click", this._onToggleMute.bind(this));
  }

  Buddy.prototype = {
    setStream: function(stream) {
      this.audio.mozSrcObject = stream;
      this.audio.play();
      this.audio.controls = true;
    },

    destroy: function() {
      this.el.remove();
    },

    _onToggleMute: function() {
      if (!this.isAvatar)
        this.audio.muted = !this.audio.muted;

      if (this.el.classList.contains("muted"))
        this.el.classList.remove("muted")
      else
        this.el.classList.add("muted")
    }

    // _soundLevel: function(sequence) {
    //   // We do a RMS then normalize the output
    //   var n = sequence.length;
    //   var sum = 0, rms;

    //   for (var index = 0; index < n; index++) {
    //     sum += Math.pow(sequence[index], 2);
    //   };

    //   rms = Math.sqrt(sum / n);
    //   return Math.floor(rms) * 150 / 256;
    // },

    // _plugAnalyser: function() {
    //   var context = new AudioContext();
    //   var analyser = context.createAnalyser();
    //   analyser.fftSize = 32;
    //   var frequencyData = new Uint8Array(analyser.frequencyBinCount);
    //   var source = context.createMediaElementSource(this.audio);
    //   source.connect(analyser);
    //   // analyser.connect(context.destination);

    //   var update = (function () {
    //     var level;
    //     // Schedule the next update
    //     requestAnimationFrame(update);

    //     // Get the new frequency data
    //     analyser.getByteFrequencyData(frequencyData);

    //     level = this._soundLevel(frequencyData);
    //     // console.log(level);
    //     this.el.querySelector(".level").style.width = level + "px";
    //   }.bind(this));

    //   // Kick it off...
    //   update();
    // }
  };

  function Buddies() {
    this.buddies = {};
  }

  Buddies.prototype = {
    get: function(id) {
      return this.buddies[id];
    },

    add: function(id, isAvatar) {
      var buddy = new Buddy(id, isAvatar);
      this.buddies[id] = buddy;
      return buddy;
    }
  };

  return Buddies;
}());
