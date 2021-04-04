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

    def directions(type:)
      DIRECTIONS
    end
  end
end
