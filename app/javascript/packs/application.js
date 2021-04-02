// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

import Rails from "@rails/ujs"
import interact from 'interactjs'
import 'controllers'
import "@hotwired/turbo-rails"

Rails.start()

window.interact = interact

window.dragMoveListener = function dragMoveListener (event) {
  var target = event.target
  // keep the dragged position in the data-x/data-y attributes
  var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
  var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy
  dragTo(target, x, y)
}

window.dragTo = function dragTo(target, x,y) {
  // translate the element
  target.style.webkitTransform =
    target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)'

  // update the posiion attributes
  target.setAttribute('data-x', x)
  target.setAttribute('data-y', y)
}

window.move = function move(from, to) {
  console.log(from)
  console.log(to)
  document.getElementById('game_from').value = from;
  document.getElementById('game_to').value = to;

  var form = document.getElementById("move_form")
  form.submit();
  form.reset();
}

window.setupPage = function setupPage() {

interact('.square').dropzone({
  // only accept elements matching this CSS selector
  accept: '.piece',
  // Require a 75% element overlap for a drop to be possible
  overlap: 0.51,

  ondropactivate: function (event) {
    // add active dropzone feedback
    var target = event.target
    var relatedTarget = event.relatedTarget
    var possibleMoves = JSON.parse(relatedTarget.dataset.moves)
    var currentSquare = target.dataset.square

    if (possibleMoves.includes(currentSquare)) {
      event.target.classList.add('drop-active')  
    }
  },
  ondragenter: function (event) {
    var draggableElement = event.relatedTarget
    var dropzoneElement = event.target

    // feedback the possibility of a drop
    dropzoneElement.classList.add('drop-target')
    draggableElement.classList.add('can-drop')
    // draggableElement.textContent = 'Dragged in'
  },
  ondragleave: function (event) {
    // remove the drop feedback style
    event.target.classList.remove('drop-target')
    event.relatedTarget.classList.remove('can-drop')
    // event.relatedTarget.textContent = 'Dragged out'
  },
  ondrop: function (event) {
    var toSquareElement = event.target
    var piece = event.relatedTarget
    var fromSquareElement = piece.parentElement
    var from = fromSquareElement.dataset.square
    var to = toSquareElement.dataset.square

    console.log(event)
    if (from != to) {
      move(from, to)
    } else {
      console.log("drop at same spot, skipping move")
    }

    var fromRect = fromSquareElement.getBoundingClientRect()
    var toRect = toSquareElement.getBoundingClientRect()

    var x = toRect.x - fromRect.x
    var y = toRect.y - fromRect.y

    dragTo(piece, x, y)
  },
  ondropdeactivate: function (event) {
    // remove active dropzone feedback
    event.target.classList.remove('drop-active')
    event.target.classList.remove('drop-target')
  }
})

interact('.piece')
  .draggable({
    inertia: true,
     listeners: {
      start: function(event) {
        console.log(event.type, event.target)
      },
      move: dragMoveListener
    },
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: '#chessboard',
        endOnly: true
      })
    ]
  })

}

document.addEventListener("turbo:load", function() {
  setupPage()
});

document.addEventListener("DOMContentLoaded", function() {
  console.log("page load")
  setupPage()
});