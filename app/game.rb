require_relative "board"
require_relative "renderer"
require_relative "move"
require_relative "fen/all"

class Game
  attr_reader :board
  attr_accessor :turn
  attr_accessor :turn_count
  attr_accessor :moves

  def initialize(fen: nil)
    @board = Board.new
    if fen
      set_fen(fen)
    else
      @board.spawn_pieces!
      @turn_count = 1
      @turn = :white
    end
    @moves = []
  end

  def switch_turn!
    @turn_count += 1 if @turn == :black
    @turn = invert_color(@turn)
  end

  def render
    Renderer.new(self).display
  end

  def state
    if @board.checkmate?(turn)
      "#{invert_color(turn)} wins by checkmate"
    elsif @board.drawn?(turn)
      "drawn game"
    elsif @board.in_check?(turn)
      "in check, #{turn} to play"
    else
      "#{turn} to play"
    end
  end

  def move(from, to)
    piece, status = @board.move(from, to, turn)
    @moves << Move.new(piece, from, to, self.turn, self.turn_count, status)
    switch_turn!
    state
  rescue => error
    puts error.backtrace
    "#{state} - #{error}"
  end

  def set_fen(fen_str)
    game_state = FEN::Parser.new(fen_str)
    game_state.pieces_attributes.each do |attr|
      @board.spawn(attr[0], attr[1], [attr[2]])
    end
    @turn_count = 1
    @turn = game_state.turn
  end

  def fen
    FEN::Serializer.new(self).serialized
  end

  def as_json
    {
      moves: @moves.reverse.map(&:to_s),
      state: state,
      fen: fen
    }
  end

  def to_json
    JSON.generate(as_json)
  end

  def inspect
    "Game - state: #{state}"
  end
end