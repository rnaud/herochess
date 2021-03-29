require_relative "sliding_piece"

class Rook < SlidingPiece
  ICONS = {
    white: "♖",
    black: "♜",
  }

  def directions
    {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1]
    }
  end
end