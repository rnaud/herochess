# frozen_string_literal: true

class GameChannel < ApplicationCable::Channel
  def find_game
    @game = Game.find(params[:id])
  end

  def subscribed
    find_game
    stream_for @game
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def move(data)
    find_game
    sessions = connection.game_sessions
    @player = sessions[@game.id.to_s].to_sym
    @move_result = @game.instance.move(data["from"], data["to"], @player)
    @game.save
    ActionCable.server.broadcast "game_#{params[:id]}", @game.as_json
  end
end
