require_relative "sliding_piece"

class Bishop < SlidingPiece
  ICONS = {
    white: "♗",
    black: "♝",
  }

  def directions(type:)
    {
      nw: [-1, -1],
      ne: [-1, 1],
      sw: [1, -1],
      se: [1, 1],
    }
  end
end