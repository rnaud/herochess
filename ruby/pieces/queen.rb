require_relative "sliding_piece"

class Queen < SlidingPiece
  ICONS = {
    white: "♕",
    black: "♛",
  }

  def directions(type:)
    {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1],
      nw: [-1, -1],
      ne: [-1, 1],
      sw: [1, -1],
      se: [1, 1],
    }
  end

end