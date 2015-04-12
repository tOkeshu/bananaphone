(function() {
  var app;

  navigator.getUserMedia({audio: true}, function(localStream) {
    app = new App(document.querySelector(".room"));
    Banana.actions.listen(localStream);
  }, function(err) {
    console.error("getUserMedia Failed: " + err);
  });
}());
