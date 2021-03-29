Dir.glob('./**/*.rb') { |f| require_relative f }
require 'pry'
require 'colorize'

$VERBOSE = nil

class Game
  attr_reader :board
  attr_reader :turn

  def initialize
    @board = Board.new
    @turn = :white
  end

  def switch_turn!
    if @turn == :white
      @turn = :black
    else
      @turn = :white
    end
  end

  def move(from, to)
    @board.move(from, to, turn)
    switch_turn!
  rescue => error
    puts "Sorry there was an issue: #{error}"
    puts error.backtrace
  end
end

@game = Game.new