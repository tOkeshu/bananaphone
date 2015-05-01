(function() {
  var app = new App(document.querySelector(".room"));
  var popOut = Banana.actions.sounds.popOut.bind(Banana.actions);
  window.addEventListener("beforeunload", popOut);
}());
