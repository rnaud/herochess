# frozen_string_literal: true

class Game < ApplicationRecord
  attr_accessor :board, :en_passant, :from, :to, :fen_initial, :color, :pieces_moved

  after_initialize :load_defaults
  validate :move_board_and_validate
  before_save :serialize_game_instance

  has_many :messages, dependent: :destroy

  validates :white_user_id, presence: true
  validates :versus, presence: true
  validates :turn, presence: true
  validates :state, presence: true

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

  def versus
    super.to_sym
  end

  def state
    super.to_sym
  end

  # rubocop:disable Lint/DuplicateMethods
  def color
    @color&.to_sym
  end
  # rubocop:enable Lint/DuplicateMethods

  def update_state
    self.state = if board.checkmate?(turn)
                   :checkmate
                 elsif board.drawn?(turn)
                   :drawn
                 elsif board.in_check?(turn)
                   :check
                 else
                   :play
                 end
  end

  def gameover?
    state == :checkmate || state == :drawn
  end

  def increment_half_moves!(status)
    if %i[captured pawn_moved].include?(status)
      self.half_moves_count = 0
    else
      self.half_moves_count += 1
    end
  end

  def move(from:, to:, who_is_playing: nil)
    self.en_passant = nil
    who_is_playing = turn if who_is_playing.nil?
    piece_moved, status = board.move(from, to, turn, who_is_playing)
    pieces_moved << [status, piece_moved]

    increment_half_moves!(status)
    self.en_passant = to if status == :pawn_moved

    switch_turn!
    update_state

    ai_move! if ai_turn?
  rescue Board::MoveInvalidError => e
    errors.add(:turn, e.message)
    Rails.logger.error e.message
    Rails.logger.error e.backtrace
    state
  end

  def undo_last_move!
    _status, piece = pieces_moved.pop
    # self.en_passant = Helper.pt(piece.position) if status = :pawn_moved
    piece.undo_last_move!

    # TODO: undo half moves
    self.turn = Helper.invert_color(turn)
    self.moves_count -= 1 if turn == :black
    update_state
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
    self.pieces_moved = []

    if persisted?
      self.board = Marshal.load(Base64.decode64(serialized_board))
    else
      self.board = Board.new(game: self)
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

    move(from: from, to: to, who_is_playing: color)

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

  # AI

  def ai_game?
    versus == :ai
  end

  def ai_turn?
    ai_game? && turn == :black && !gameover?
  end

  def possible_moves
    @board.possible_moves(turn)
  end

  def explore_moves(depth: 0, max_depth: 1)
    return if depth > max_depth

    possible_moves.each do |move|
      from = Helper.pt(move[1])
      to = Helper.pt(move[2])

      move(from: from, to: to)
      _score = board.score
      explore_moves(depth: depth + 1, max_depth: max_depth)
      undo_last_move!
    end
  end

  def best_move
    possible_moves.sample
  end

  def ai_move!
    move = best_move
    _piece = move[0]
    from = Helper.pt(move[1])
    to = Helper.pt(move[2])
    move(from: from, to: to)
  end
end
