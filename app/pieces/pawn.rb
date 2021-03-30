require_relative "piece"

class Pawn < Piece
  ICONS = {
    white: "♙",
    black: "♟︎",
  }

  attr_accessor :promoted_to

  def directions(type:)
    h = {}
    if white?
      h = {
        forward: [-1, 0],
        double_forward: [-2, 0],
        take_west: [-1, -1],
        take_east: [-1, 1]
      }
    else
      h = {
        forward: [1, 0],
        double_forward: [2, 0],
        take_west: [1, -1],
        take_east: [1, 1]
      }
    end

    h.delete(:double_forward) if has_moved?
    h.delete(:take_west) unless can_take?(h[:take_west])
    h.delete(:take_east) unless can_take?(h[:take_east])

    h
  end

  def can_take?(direction)
    take_position = [@position[0] + direction[0], @position[1] + direction[1]]
    other_piece = @board.find_piece(take_position)
    return false if other_piece.nil?

    other_piece.color != self.color
  end

  def move_to!(end_position)
    super
    promote! if can_be_promoted?
  end

  def can_be_promoted?
    color == :white && @position[0] == 7 ||
      color == :black && @position[0] == 0
  end

  def promote!(klass = Queen)
    new_piece = Queen.new(color: @color, position: @position, board: @board, was: self)
    self.promoted_to = new_piece
    new_piece.move_to!(@position)
  end

end