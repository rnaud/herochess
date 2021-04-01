# frozen_string_literal: true

class Game < ApplicationRecord
  attr_accessor :instance, :color

  after_initialize :load_defaults
  before_save :serialize_game_instance

  validates :white_user_id, presence: true

  # def move(from, to, who_is_playing)
  #   self.instance.move(from, to, who_is_playing)
  #   save
  # end

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
