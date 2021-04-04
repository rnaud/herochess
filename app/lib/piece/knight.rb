# frozen_string_literal: true

module Piece
  class Knight < Piece::Base
    ICONS = {
      white: "♘",
      black: "♞"
    }.freeze
    DIRECTIONS = {
      up1: [-2, -1],
      up2: [-2, 1],
      down1: [2, -1],
      down2: [2, 1],
      left1: [-1, -2],
      left2: [-1, 2],
      right1: [1, -2],
      right2: [1, 2]
    }.freeze
    SCORE = 30

    POSITIONAL_SCORE = [
      [-5,-4,-3,-3,-3,-3,-3,-5],
      [-4,-2, 0, 0, 0, 0,-2,-4],
      [-3, 0, 1, 1, 1, 1, 0,-3],
      [-3, 0, 1, 2, 2, 1, 0,-3],
      [-3, 0, 1, 2, 2, 1, 0,-3],
      [-3, 0, 1, 1, 1, 1, 0,-3],
      [-4,-2, 0, 0, 0, 0,-2,-4],
      [-5,-4,-3,-3,-3,-3,-3,-5]
    ]

    def directions(type:)
      DIRECTIONS
    end
  end
end
