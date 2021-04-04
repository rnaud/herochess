# frozen_string_literal: true

module Piece
  class Rook < Piece::SlidingPiece
    LEFT_COL = 0
    RIGHT_COL = 7
    CASTLE_LEFT_COL = 3
    CASTLE_RIGHT_COL = 5
    ICONS = {
      white: "♖",
      black: "♜"
    }.freeze
    SCORE = 50

    DIRECTIONS = {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1]
    }.freeze

    def directions(type:)
      DIRECTIONS
    end

    def move_to!(end_position)
      status = super

      original_position = position_histories[0]

      castling_that_changed = nil

      if original_position[1] == LEFT_COL && @board.castling_priviledges[color][:left]
        @board.castling_priviledges[color][:left] = false
        castling_that_changed = :left
      end

      if original_position[1] == RIGHT_COL && @board.castling_priviledges[color][:right]
        @board.castling_priviledges[color][:right] = false
        castling_that_changed = :right
      end

      @castling_histories << castling_that_changed

      status
    end

    def undo_last_move!
      super

      case @castling_histories.last
      when :left
        @board.castling_priviledges[color][:left] = true
      when :right
        @board.castling_priviledges[color][:right] = true
      end

      @castling_histories.pop
    end
  end
end
