window.onload = function() {
  var ws       = new WebSocket('ws://' + window.location.host + window.location.pathname);
  // ws.onopen    = function()  { show('websocket opened'); };
  // ws.onclose   = function()  { show('websocket closed'); }
  ws.onmessage = function(m) { 
    document.getElementById('game').outerHTML = m.data;
  };

  document.forms["moves_form"].onsubmit = function(e) {
    var form = e.target
    var formData = new FormData(form);
    var object = {};
    formData.forEach((value, key) => object[key] = value);
    var json = JSON.stringify(object);
    ws.send(json);

    event.preventDefault();
    event.target.reset();
  }
}