# frozen_string_literal: true

class GameChannel < ApplicationCable::Channel
  def subscribed
    # stream_from "my_game_channel"
    stream_from "game_#{params[:id]}"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def move(data)
    Rails.logger.debug params
    Rails.logger.debug data
    @game = Game.find(params[:id])
    sessions = connection.game_sessions
    @player = sessions[@game.id.to_s].to_sym
    @move_result = @game.instance.move(data["from"], data["to"], @player)
    @game.save
    ActionCable.server.broadcast "game_#{params[:id]}", @game.as_json
  end
end
