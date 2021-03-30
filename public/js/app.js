var ws       = new WebSocket('ws://' + window.location.host + window.location.pathname);
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

function move(from, to) {
  document.getElementById("from").value = from;
  document.getElementById("to").value = to;
  document.forms["moves_form"].dispatchEvent(new Event('submit'));
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
  ev.dataTransfer.setData("position", ev.target.parentElement.dataset.position);
}

function drop(ev, el) {
  console.log(ev)
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  el.innerHTML = ""
  el.appendChild(document.getElementById(data));

  var from = ev.dataTransfer.getData("position");
  var to = el.dataset.position;
  console.log(from)
  console.log(to)
  move(from, to)

}