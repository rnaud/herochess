class Knight < Piece
  ICONS = {
    white: "♘",
    black: "♞",
  }

  def directions
    {
      up: [-1, 0],
      down: [1, 0],
      left: [1, 0],
      right: [1, 0],
      nw: [1, 0],
      ne: [1, 0],
      sw: [1, 0],
      se: [1, 0],
    }
  end
end