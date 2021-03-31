// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.



import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import "channels"
import {INPUT_EVENT_TYPE, Chessboard} from 'cm-chessboard'

Rails.start()
Turbolinks.start()

var ws_protocol = (window.location.protocol === "https:") ? "wss://" : "ws://"
var ws       = new WebSocket(ws_protocol + window.location.host + window.location.pathname);
ws.onmessage = function(m) { 
  const game = JSON.parse(m.data);
  console.log(game)
  updateGame(game)
};

function updateGame(game) {
  window.board.setPosition(game.fen)
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

  var form = document.getElementById("moves_form")
  var formData = new FormData(form);
  var object = {};
  formData.forEach((value, key) => object[key] = value);
  var json = JSON.stringify(object);
  ws.send(json);

  form.reset();
}

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

window.addEventListener('load', function () {
  console.log("here")

  window.board = new Chessboard(document.getElementById("board"), {
    sprite: {url: "/img/chessboard-sprite-staunty.svg"},
    animationDuration: 300
  })

  console.log(board)

  window.board.enableMoveInput(inputHandler)
  updateGame(window.game)
}, false);
