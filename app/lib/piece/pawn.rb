# frozen_string_literal: true

module Piece
  class Pawn < Piece::Base
    ICONS = {
      white: "♙",
      black: "♟︎"
    }.freeze
    BLACK_PROMOTION = 7
    WHITE_PROMOTION = 0
    SCORE = 10

    POSITIONAL_SCORE = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [5, 5, 5, 5, 5, 5, 5, 5],
      [1, 2, 2, 3, 3, 2, 1, 1],
      [0, 0, 1, 2, 2, 1, 0, 0],
      [0, 0, 0, 2, 2, 0, 0, 0],
      [0, 0, 0,-1,-1, 0, 0, 0],
      [0, 1, 1,-2,-2, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ]
    COLOR_POSITIONAL_SCORE = {
      white: POSITIONAL_SCORE,
      black: POSITIONAL_SCORE.reverse
    }

    attr_accessor :promoted_to

    def directions(type:)
      h = if white?
            {
              forward: [-1, 0],
              double_forward: [-2, 0],
              take_west: [-1, -1],
              take_east: [-1, 1]
            }
          else
            {
              forward: [1, 0],
              double_forward: [2, 0],
              take_west: [1, -1],
              take_east: [1, 1]
            }
          end

      h.delete(:forward) unless can_move_to?(h[:forward])
      h.delete(:double_forward) unless can_move_to?(h[:double_forward])
      h.delete(:double_forward) if moved?

      h.delete(:take_west) unless can_take?(h[:take_west])
      h.delete(:take_east) unless can_take?(h[:take_east])

      h
    end

    def can_move_to?(direction)
      move_position = [@position[0] + direction[0], @position[1] + direction[1]]
      return false unless @board.valid_coord?(move_position)

      other_piece = @board.find_piece(move_position)
      other_piece ? false : true
    end

    def can_take?(direction)
      take_position = [@position[0] + direction[0], @position[1] + direction[1]]
      other_piece = @board.find_piece(take_position)
      return false if other_piece.nil?

      other_piece.color != color
    end

    def move_to!(end_position)
      status = super
      promote! if can_be_promoted?
      status
    end

    def can_be_promoted?
      color == :white && row == WHITE_PROMOTION ||
        color == :black && row == BLACK_PROMOTION
    end

    def promote!(_klass = Queen)
      new_piece = Queen.new(color: @color, position: @position, board: @board, was: self)
      @promoted_to = new_piece
      new_piece.move_to!(@position)
      @board.pawn_promoted!(self, new_piece)
    end

    def unpromote!
      @board.pawn_unpromoted!(self, @promoted_to)
      @promoted_to = nil
    end

    def undo_last_move!
      super
      unpromote! if promoted_to
    end

    def positional_score
      score = self.class::COLOR_POSITIONAL_SCORE[color][position[0]][position[1]]
      white? ? -score : score
    end
  end
end
