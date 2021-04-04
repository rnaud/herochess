# frozen_string_literal: true

module Piece
  class Queen < Piece::SlidingPiece
    ICONS = {
      white: "♕",
      black: "♛"
    }.freeze
    DIRECTIONS = {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1],
      nw: [-1, -1],
      ne: [-1, 1],
      sw: [1, -1],
      se: [1, 1]
    }.freeze
    SCORE = 90
    POSITIONAL_SCORE = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ]

    def directions(type:)
      self.class::DIRECTIONS
    end
  end
end
