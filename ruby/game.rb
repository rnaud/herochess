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
    @turn = invert_color(@turn)
  end

  def render
    Renderer.new(self).display
  end

  def move(from, to)
    @board.move(from, to, turn)
    switch_turn!
  rescue => error
    log "Sorry there was an issue: #{error}"
    log error.backtrace
  end
end

@game = Game.new