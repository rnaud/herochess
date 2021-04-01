# frozen_string_literal: true

class Game < ApplicationRecord
  attr_accessor :instance

  after_initialize :load_defaults
  before_save :serialize_game_instance

  validates :white_user_id, presence: true

  after_create_commit do
    broadcast_prepend_to :games, partial: "games/game_list"
    broadcast_prepend_to "game_#{id}"
  end
  after_update_commit do
    broadcast_replace_to :games, partial: "games/game_list"
    broadcast_replace_to "game_#{id}"
  end
  after_destroy_commit do
    broadcast_remove_to :games
    broadcast_remove_to "game_#{id}"
  end

  def name
    instance.inspect
  end

  def load_defaults
    self.instance = if persisted?
                      Marshal.load(Base64.decode64(game_object))
                    else
                      GameEngine.new
                    end
  end

  def serialize_game_instance
    self.game_object = Base64.encode64(Marshal.dump(instance))
  end

  def color?(user_id)
    if user_id == white_user_id
      :white
    elsif user_id == black_user_id
      :black
    else
      :viewer
    end
  end

  def as_json(*)
    {
      moves: instance.moves.reverse.map(&:to_s),
      state: instance.state,
      error: instance.last_error,
      fen: instance.fen,
      id: id
    }
  end
end
