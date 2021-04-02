class Message < ApplicationRecord
  belongs_to :game

  after_create_commit do
    broadcast_prepend_to "game_#{game.id}_messages"
  end
  after_update_commit do
    broadcast_replace_to "game_#{game.id}_messages"
  end
  after_destroy_commit do
    broadcast_remove_to "game_#{game.id}_messages"
  end
end
