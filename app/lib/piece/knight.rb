# frozen_string_literal: true

# require_relative "piece"

class Piece::Knight < Piece::Base
  ICONS = {
    white: "♘",
    black: "♞"
  }.freeze

  def directions(type:)
    {
      up1: [-2, -1],
      up2: [-2, 1],
      down1: [2, -1],
      down2: [2, 1],
      left1: [-1, -2],
      left2: [-1, 2],
      right1: [1, -2],
      right2: [1, 2]
    }
  end
end
