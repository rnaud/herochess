# frozen_string_literal: true

class GameEngine
  attr_reader :board, :last_error
  attr_accessor :turn, :half_moves_count, :turn_count, :moves, :en_passant

  def initialize(fen: nil, spawn: true)
    @board = Board.new
    if fen
      parse_fen(fen)
    else
      @board.spawn_pieces! unless spawn == false
      @turn_count = 0
      @half_moves_count = 0
      @turn = :white
      @en_passant = nil
    end
    @last_error = nil
    @moves = []
  end

  def switch_turn!
    @turn_count += 1 if @turn == :black
    @turn = Helper.invert_color(@turn)
  end

  def render
    Renderer.new(self).display
  end

  def state
    if @board.checkmate?(turn)
      "#{Helper.invert_color(turn)} wins by checkmate"
    elsif @board.drawn?(turn)
      "drawn game"
    elsif @board.in_check?(turn)
      "in check, #{turn} to play"
    else
      "#{turn} to play"
    end
  end

  def increment_half_moves!(status)
    if %i[captured pawn_moved].include?(status)
      @half_moves_count = 0
    else
      @half_moves_count += 1
    end
  end

  def my_turn?(turn)
    false if turn != @turn
  end

  def move(from, to, who_is_playing = nil)
    @last_error = nil
    who_is_playing = turn if who_is_playing.nil?
    piece, status = @board.move(from, to, turn, who_is_playing)
    @moves << Move.new(piece, from, to, turn, turn_count, status)

    increment_half_moves!(status)
    self.en_passant = to if status == :pawn_moved
    switch_turn!

    state
  rescue StandardError => e
    @last_error = e.message
    # puts error.backtrace
    "#{state} - #{e}"
  end

  def parse_fen(fen_str)
    game_state = Fen::Parser.new(fen_str)
    game_state.pieces_attributes.each do |attr|
      @board.spawn(attr[0], attr[1], [attr[2]])
    end
    @turn_count = game_state.turn_count
    @turn = game_state.turn
    @half_moves_count = game_state.half_moves_count
    @en_passant = game_state.en_passant
    @board.castling_priviledges = game_state.castling_priviledges
  end

  def fen
    Fen::Serializer.new(self).serialized
  end

  def inspect
    "Game - state: #{state}"
  end
end
