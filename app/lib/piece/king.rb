# frozen_string_literal: true

module Piece
  class King < Piece::Base
    ICONS = {
      white: "♔",
      black: "♚"
    }.freeze
    SCORE = 900
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
      h = {
        up: [-1, 0],
        down: [1, 0],
        left: [0, -1],
        right: [0, 1],
        nw: [-1, -1],
        ne: [-1, 1],
        sw: [1, -1],
        se: [1, 1]
      }

      h[:castle_left] = [0, -2] if type == :all && can_castle?(:left)
      h[:castle_right] = [0, 2] if type == :all && can_castle?(:right)
      h
    end

    def can_castle?(side)
      line = position[0]

      return false unless @board.castling_priviledges[color][side]

      # check that the squares in between are empty and not currently attacked
      squares_to_check = if side == :left
                           (1..3)
                         else
                           (5..6)
                         end
      squares_to_check.each do |i|
        coord = [line, i]
        return false if @board.square_attacked?(Helper.invert_color(color), coord)
        return false if @board.find_piece(coord)
      end
    end

    def move_to!(end_position)
      status = super(end_position)

      castling_direction = recently_castled?
      case castling_direction
      when :left
        left_rook = @board.find_piece([position[0], Rook::LEFT_COL])
        left_rook.move_to!([row, Rook::CASTLE_LEFT_COL])
      when :right
        right_rook = @board.find_piece([position[0], Rook::RIGHT_COL])
        right_rook.move_to!([row, Rook::CASTLE_RIGHT_COL])
      end

      current_castling = [@board.castling_priviledges[color][:left], @board.castling_priviledges[color][:right]]

      castling_that_changed = case current_castling
                              when [true, true]
                                :both
                              when [true, false]
                                :left
                              when [false, true]
                                :right
                              else
                                :neither
                              end
      @castling_histories << castling_that_changed

      @board.castling_priviledges[color][:left] = false
      @board.castling_priviledges[color][:right] = false

      status
    end

    def recently_castled?
      return false unless moved?

      previous_position = @position_histories[-2]
      case previous_position[1] - position[1]
      when 2
        :left
      when -2
        :right
      end
    end

    def undo_last_move!
      # check for recent castle before undoing the last move, since we need to undo the rook as well
      castling_direction = recently_castled?

      super

      case @castling_histories.last
      when :both
        @board.castling_priviledges[color][:left] = true
        @board.castling_priviledges[color][:right] = true
      when :left
        @board.castling_priviledges[color][:left] = true
      when :right
        @board.castling_priviledges[color][:right] = true
      end

      @castling_histories.pop

      case castling_direction
      when :left
        left_rook = @board.find_piece([position[0], Rook::CASTLE_LEFT_COL])
        left_rook.undo_last_move!
      when :right
        right_rook = @board.find_piece([position[0], Rook::CASTLE_RIGHT_COL])
        right_rook.undo_last_move!
      end
    end
  end
end
