// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.



import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import "channels"
import {INPUT_EVENT_TYPE, Chessboard} from 'cm-chessboard'
import consumer from '../channels/consumer'
// import gameChannel from "../channels/game_channel";

Rails.start()
Turbolinks.start()

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

function inputHandler(event) {
    switch (event.type) {
        case INPUT_EVENT_TYPE.moveStart:
            console.log(`moveStart: ${event.square}`)
            return true
        case INPUT_EVENT_TYPE.moveDone:
            console.log(`moveDone: ${event.squareFrom}-${event.squareTo}`)
            window.gameChannel.move(event.squareFrom, event.squareTo)
            return true
        case INPUT_EVENT_TYPE.moveCanceled:
            console.log(`moveCanceled`)
    }
}

window.addEventListener('load', function () {
  if (document.getElementById("board")) {
    var uuid = document.getElementById("game").dataset.uuid
    window.subscribe(uuid)
    window.board = new Chessboard(document.getElementById("board"), {
      sprite: {url: "/img/chessboard-sprite-staunty.svg"},
      animationDuration: 300
    })

    console.log(board)

    window.board.enableMoveInput(inputHandler)
    updateGame(window.game)  
  }
  
}, false);

window.subscribe = function(uuid) {
  window.gameChannel = consumer.subscriptions.create({channel: "GameChannel", uuid: uuid}, {
    connected() {
      // Called when the subscription is ready for use on the server
      console.log("Connected to the game");
    },

    disconnected() {
      // Called when the subscription has been terminated by the server
    },

    received(data) {
      updateGame(data)
    },

     move(from, to) {
      this.perform('move', { from: from, to: to })
    }
  });
}
