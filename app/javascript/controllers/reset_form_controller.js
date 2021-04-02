import { Controller } from "stimulus"

export default class extends Controller {
  reset() {
    console.log(this)
    this.element.reset()
  }
}