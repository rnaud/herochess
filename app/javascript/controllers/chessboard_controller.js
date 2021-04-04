import { Controller } from "stimulus"

export default class extends Controller {
  move() {
    console.log("moving")
    setTimeout(function(){
      window.moveLastPiece()
    }, 100)
  }
}