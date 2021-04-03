# frozen_string_literal: true

module Piece
  class Base
    class DirectionsUndefinedError < StandardError; end
    attr_reader :color, :moved, :captured, :was, :position_histories, :capture_histories, :castling_histories
    attr_accessor :position

    def initialize(color:, position:, board:, was: nil)
      @color = color
      @position = position
      @position_histories = [position]
      @capture_histories = [nil]
      @castling_histories = [nil]
      @board = board
      @moved = false
      @captured = false
      @was = was
    end

    def capture!
      Rails.logger.debug "captured #{self.class} #{Helper.pt(position)}"
      @captured = true
      push_histories!(position: [nil, nil], capture: nil)
      @board.piece_captured!(self)
    end

    def uncapture!
      Rails.logger.debug "uncaptured #{self.class} #{Helper.pt(position)}"
      @captured = false
      pop_histories!
      @board.piece_uncaptured!(self)
    end

    def push_histories!(position:, capture:)
      @position_histories << position
      @capture_histories << capture
      @position = position
      @moved = true
    end

    def pop_histories!
      @position = position_histories[-2]
      position_histories.pop
      capture_histories.pop
      @moved = false if position_histories.size == 1
    end

    def white?
      @color == :white
    end

    def black?
      @color == :black
    end

    def icon
      self.class::ICONS[@color]
    end

    def directions(type: :all)
      raise DirectionsUndefinedError
    end

    def possible_moves(type: :all)
      moves = []
      directions(type: type).each do |direction, vector|
        moves << valid_options(direction, vector)
      end
      moves.flatten!(1)
      Rails.logger.debug "possible_moves - #{inspect} - #{moves.map { |a| Helper.pt(a) }.join(', ')}"
      moves
    end

    def possible_moves_str
      possible_moves.map { |m| Helper.pt(m) }
    end

    def valid_options(_direction, vector)
      options = []
      exploring = [(@position[0] + vector[0]), (@position[1] + vector[1])]

      other_piece = @board.find_piece(exploring)
      ennemy_piece = other_piece && other_piece.color != color
      valid_coord = @board.valid_coord?(exploring)

      options << exploring if valid_coord && (other_piece.nil? || ennemy_piece)

      options
    end

    def valid_move?(end_position)
      Rails.logger.debug "end_position: #{Helper.pt(end_position)}"
      possible_moves.include?(end_position)
    end

    def move_to!(end_position)
      Rails.logger.debug "moving - #{inspect} - to #{Helper.pt(end_position)}"
      # remove piece from current location
      @board.remove_piece!(position)

      # capture end position piece
      piece_in_end_position = @board.remove_piece!(end_position)

      if piece_in_end_position
        piece_in_end_position.capture!
        push_histories!(position: end_position, capture: piece_in_end_position)
      else
        push_histories!(position: end_position, capture: nil)
      end

      # set piece in the new location
      @board.place_piece!(self, end_position)
      piece_in_end_position ? :captured : "#{name}_moved".to_sym
    end

    def undo_last_move!
      @board.remove_piece!(position)
      if (last_captured_piece = capture_histories.last)
        last_captured_piece.uncapture!
        @board.place_piece!(last_captured_piece, position)
      end
      @board.place_piece!(self, position_histories[-2])
      pop_histories!
    end

    def moved?
      @moved
    end

    def inspect
      "#{self.class.name} - #{color} - #{Helper.pt(position)}"
    end

    def name
      self.class.name.downcase.demodulize
    end

    def id
      "#{name}-#{object_id}"
    end

    def row
      position[0]
    end

    def col
      position[1]
    end
  end
end
