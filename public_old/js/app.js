import {INPUT_EVENT_TYPE, Chessboard} from "/js/Chessboard.js"

var ws_protocol = (window.location.protocol === "https:") ? "wss://" : "ws://"
var ws       = new WebSocket(ws_protocol + window.location.host + window.location.pathname);
ws.onmessage = function(m) { 
  const game = JSON.parse(m.data);
  console.log(game)
  updateGame(game)
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

function updateGame(game) {
  board.setPosition(game.fen)
  document.getElementById("state").innerHTML = game.state
  document.getElementById("error").innerHTML = game.error

  const movesEl = document.getElementById("moves_list")
  movesEl.innerHTML = ""
  game.moves.forEach(function (item, index) {
    var li = document.createElement("li");
    var textnode = document.createTextNode(item);
    li.appendChild(textnode);
    movesEl.appendChild(li);
  });
}

function move(from, to) {
  document.getElementById("from").value = from;
  document.getElementById("to").value = to;
  document.forms["moves_form"].dispatchEvent(new Event('submit'));
}

const board = new Chessboard(document.getElementById("board"), {
  sprite: {url: "/img/chessboard-sprite-staunty.svg"},
  animationDuration: 300
})

board.enableMoveInput(inputHandler)
function inputHandler(event) {
    switch (event.type) {
        case INPUT_EVENT_TYPE.moveStart:
            console.log(`moveStart: ${event.square}`)
            return true
        case INPUT_EVENT_TYPE.moveDone:
            console.log(`moveDone: ${event.squareFrom}-${event.squareTo}`)
            move(event.squareFrom, event.squareTo)
            return true
        case INPUT_EVENT_TYPE.moveCanceled:
            console.log(`moveCanceled`)
    }
}

updateGame(window.game)