require_relative "sliding_piece"

class Rook < SlidingPiece
  LEFT_COL = 0
  RIGHT_COL = 7
  
  ICONS = {
    white: "♖",
    black: "♜",
  }

  def directions(type:)
    {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1]
    }
  end

  def move_to!(end_position)
    status = super
    
    if self.original_position[1] == LEFT_COL
      @board.castling_priviledges[self.color][:left] = false
    end

    if self.original_position[1] == RIGHT_COL
      @board.castling_priviledges[self.color][:left] = false
    end

    status
  end
end