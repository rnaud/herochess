# frozen_string_literal: true

# require_relative "sliding_piece"

module Piece
  class Bishop < Piece::SlidingPiece
    ICONS = {
      white: "♗",
      black: "♝"
    }.freeze

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
