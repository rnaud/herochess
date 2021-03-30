require_relative "board"
require_relative "renderer"
require_relative "move"

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
    end    
    @turn_count = 1
    @turn = :white
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
    fen_split = fen_str.split(" ")
    board_data = fen_split[0]
    # replace numbers with spaces
    clean_board = board_data.split("").map { |char| char.is_i? ? " " * char.to_i : char }.join("")
    rows = clean_board.split("/")

    rows.each_with_index do |row, row_index|
      row.split("").each_with_index do |col, col_index|
        next if col == " "
        klass = fen_class(col)
        color = col.is_lower? ? :black : :white
        coord = [row_index, col_index]
        @board.spawn(klass, color, [coord])
      end
    end

    if fen_split[0] == "b"
      @turn = :black
    else
      @turn = :white
    end
  end

  def inspect
    "Game - state: #{state}"
  end
end