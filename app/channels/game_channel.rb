# frozen_string_literal: true

class GameChannel < ApplicationCable::Channel
  def subscribed
    # stream_from "my_game_channel"
    stream_from "game_#{params[:uuid]}"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def move(data)
    @player = %i[white black].sample
    @game_hash = GamesController.games[params[:uuid]]
    @game = @game_hash[:game]
    @move_result = @game.move(data["from"], data["to"], @player)
    ActionCable.server.broadcast "game_#{params[:uuid]}", @game.as_json
  end
end
