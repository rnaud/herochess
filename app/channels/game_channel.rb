class GameChannel < ApplicationCable::Channel
  def subscribed
    # stream_from "my_game_channel"
    stream_from "game_#{params[:uuid]}"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def speak(data, bla)
    ActionCable.server.broadcast "game_channel", message: data["message"], sent_by: data["name"]
  end

  def move(data)
    @player = :white
    @game_hash = GamesController.games[params[:uuid]]
    @game = @game_hash[:game]
    @move_result = @game.move(data["from"], data["to"], @player)
    ActionCable.server.broadcast "game_#{params[:uuid]}", @game.as_json
  end
end
