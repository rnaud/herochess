# frozen_string_literal: true

module Piece
  module Hero
    class DoubleKnight < Piece::Knight
      ICONS = {
        white: "♘",
        black: "♞"
      }.freeze
      DIRECTIONS = {
        up1: [-2, -1],
        up2: [-2, 1],
        up3: [-3, -2],
        up4: [-3, 2],
        down1: [2, -1],
        down2: [2, 1],
        down3: [3, -2],
        down4: [3, 2],
        left1: [-1, -2],
        left2: [-1, 2],
        left3: [-2, -2],
        left4: [-2, 2],
        right1: [1, -2],
        right2: [1, 2],
        right3: [2, -2],
        right4: [2, 2]
      }.freeze
      SCORE = 30
    end
  end
end
