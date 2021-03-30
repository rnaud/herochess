require_relative "board"
require_relative "renderer"

class Game
  attr_reader :board
  attr_accessor :turn

  def initialize(spawn: :default)
    @board = Board.new
    @board.spawn_pieces! if spawn == :default
    @turn = :white
  end

  def switch_turn!
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

  def inspect
    "Game - state: #{state}"
  end

  def move(from, to)
    @board.move(from, to, turn)
    switch_turn!
    state
  rescue => error
    puts error.backtrace
    "#{state} - #{error}"
  end
end