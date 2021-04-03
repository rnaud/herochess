# frozen_string_literal: true

module Piece
  class King < Piece::Base
    attr_reader:capture_histories
    ICONS = {
      white: "♔",
      black: "♚"
    }.freeze

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
      original_position = position
      status = super(end_position)

      line = original_position[0]
      # the king moved to 2 squares to the left, move the rook as well
      case original_position[1] - end_position[1]
      when 2
        left_rook = @board.find_piece([line, Rook::LEFT_COL])
        left_rook.move_to!([line, 3])
      # the king moved to 2 squares to the right, move the rook as well
      when -2
        right_rook = @board.find_piece([line, Rook::RIGHT_COL])
        right_rook.move_to!([line, 5])
      end

      current_castling = [@board.castling_priviledges[color][:left], @board.castling_priviledges[color][:right]]

      case current_castling
      when [true, true]
        castling_that_changed = :both
      when [true, false]
        castling_that_changed = :left
      when [false, true]
        castling_that_changed = :right
      else
        castling_that_changed = :neither
      end
      @castling_histories << castling_that_changed

      @board.castling_priviledges[color][:left] = false
      @board.castling_priviledges[color][:right] = false
      
      status
    end

    def undo_last_move!
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
    end
  end
end
