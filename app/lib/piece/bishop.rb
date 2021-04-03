# frozen_string_literal: true

module Piece
  class Bishop < Piece::SlidingPiece
    ICONS = {
      white: "♗",
      black: "♝"
    }.freeze
    SCORE = 30

    def directions(type:)
      {
        nw: [-1, -1],
        ne: [-1, 1],
        sw: [1, -1],
        se: [1, 1]
      }
    end
  end
end
