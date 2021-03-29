class Pawn < Piece
  ICONS = {
    white: "♙",
    black: "♟︎",
  }

  def directions
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
end