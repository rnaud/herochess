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
end