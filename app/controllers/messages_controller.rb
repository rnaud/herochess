# frozen_string_literal: true

class MessagesController < ApplicationController
  

  def create
    @message = Message.new(user_id: current_user)
    @message.assign_attributes(message_params)
    @message.save!

    head :ok
  end

  def destroy; end

  def message_params
    params.require(:message).permit(:message, :data, :game_id)
  end
end
