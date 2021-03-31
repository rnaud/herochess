# frozen_string_literal: true

# require_relative "sliding_piece"

class Piece::Rook < Piece::SlidingPiece
  LEFT_COL = 0
  RIGHT_COL = 7

  ICONS = {
    white: "♖",
    black: "♜"
  }.freeze

  def directions(type:)
    {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1]
    }
  end

  def move_to!(end_position)
    status = super

    @board.castling_priviledges[color][:left] = false if original_position[1] == LEFT_COL

    @board.castling_priviledges[color][:left] = false if original_position[1] == RIGHT_COL

    status
  end
end
