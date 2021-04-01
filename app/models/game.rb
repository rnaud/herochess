class Game < ApplicationRecord
  attr_accessor :instance, :color
  
  after_initialize :load_defaults
  before_save :serialize_game_instance

  validates :white_user_id, presence: true

  def move(from, to, who_is_playing)
    self.instance.move(from, to, who_is_playing)
    save
  end

  def name
    self.instance.inspect
  end

  def load_defaults
    if persisted?
      self.instance = Marshal.load(Base64.decode64(self.game_object))
    else
      self.instance = GameEngine.new
    end
      
  end

  def serialize_game_instance
    self.game_object = Base64.encode64(Marshal.dump(self.instance))
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
      moves: self.instance.moves.reverse.map(&:to_s),
      state: self.instance.state,
      error: self.instance.last_error,
      fen: self.instance.fen,
      id: id
    }
  end
end
