# frozen_string_literal: true

class Game < ApplicationRecord
  attr_accessor :board, :en_passant, :from, :to, :color, :fen_initial

  after_initialize :load_defaults
  validate :move_board_and_validate
  before_save :serialize_game_instance

  has_many :messages

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

  after_validation do
    broadcast_replace_to "game_#{id}" if errors.any?
  end

  def name
    board.inspect
  end

  def switch_turn!
    self.moves_count += 1 if turn == :black
    self.turn = Helper.invert_color(turn)
  end

  def render
    Renderer.new(self).display
  end

  def turn
    super.to_sym
  end

  def color
    @color&.to_sym
  end

  def update_state
    self.state = if board.checkmate?(turn)
                   "#{Helper.invert_color(turn)} wins by checkmate"
                 elsif board.drawn?(turn)
                   "drawn game"
                 elsif board.in_check?(turn)
                   "in check, #{turn} to play"
                 else
                   "#{turn} to play"
                 end
  end

  def increment_half_moves!(status)
    if %i[captured pawn_moved].include?(status)
      self.half_moves_count = 0
    else
      self.half_moves_count += 1
    end
  end

  def move(from, to, who_is_playing = nil)
    who_is_playing = turn if who_is_playing.nil?
    piece, status = board.move(from, to, turn, who_is_playing)

    increment_half_moves!(status)
    en_passant = to if status == :pawn_moved

    switch_turn!
    update_state
  rescue StandardError => e
    errors.add(:turn, e.message)
    Rails.logger.error e.message
    Rails.logger.error e.backtrace
    "#{state} - #{e}"
  end

  def parse_fen(fen_str)
    game_state = Fen::Parser.new(fen_str)
    game_state.pieces_attributes.each do |attr|
      board.spawn(attr[0], attr[1], [attr[2]])
    end
    self.moves_count = game_state.moves_count
    self.turn = game_state.turn
    self.half_moves_count = game_state.half_moves_count
    self.en_passant = game_state.en_passant
    board.castling_priviledges = game_state.castling_priviledges
  end

  def fen
    Fen::Serializer.new(self).serialized
  end

  def load_defaults
    if persisted?
      self.board = Marshal.load(Base64.decode64(serialized_board))
    else
      self.board = Board.new
      if fen_initial
        parse_fen(fen_initial)
      else
        board.spawn_pieces!
      end
      update_state
    end
  end

  def move_board_and_validate
    return unless from && to

    move(from, to, color)

    self.from = nil
    self.to = nil
    self.color = nil
  end

  def serialize_game_instance
    self.serialized_board = Base64.encode64(Marshal.dump(board))
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
      moves: board.moves.reverse.map(&:to_s),
      state: state,
      fen: fen,
      id: id
    }
  end
end
