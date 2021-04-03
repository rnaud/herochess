# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :game

  after_create_commit do
    broadcast_append_to "game_#{game.id}_messages"
  end
  after_destroy_commit do
    broadcast_remove_to "game_#{game.id}_messages"
  end
end
