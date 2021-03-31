// import consumer from "./consumer"

// const gameChannel = consumer.subscriptions.create("GameChannel", {
//   connected() {
//     // Called when the subscription is ready for use on the server
//     console.log("Connected to the game");
//   },

//   disconnected() {
//     // Called when the subscription has been terminated by the server
//   },

//   received(data) {
//     console.log(data);
//     // Called when there's incoming data on the websocket for this channel
//   },

//    speak(message) {
//     this.perform('speak', { message: message })
//   }
// });

// export default gameChannel;