# frozen_string_literal: true

module Piece
  class Base
    class DirectionsUndefinedError < StandardError; end
    attr_reader :color, :moved, :captured, :was
    attr_accessor :position, :original_position

    def initialize(color:, position:, board:, was: nil)
      @color = color
      @position = position
      @original_position = position
      @board = board
      @moved = false
      @captured = false
      @was = was
    end

    def capture!
      Rails.logger.info "captured #{self.class} #{Helper.pt(position)}"
      @position = [nil, nil]
      @captured = true
      @board.piece_captured!(self)
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
      directions(type: type).each do |_direction, vector|
        moves << valid_options(vector)
      end
      moves.flatten!(1)
      Rails.logger.info "possible_moves - #{inspect} - #{moves.map { |a| Helper.pt(a) }.join(', ')}"
      moves
    end

    def valid_options(vector)
      options = []
      exploring = [(@position[0] + vector[0]), (@position[1] + vector[1])]

      other_piece = @board.find_piece(exploring)
      ennemy_piece = other_piece && other_piece.color != color
      valid_coord = @board.valid_coord?(exploring)

      options << exploring if valid_coord && (other_piece.nil? || ennemy_piece)

      options
    end

    def valid_move?(end_position)
      Rails.logger.info "end_position: #{Helper.pt(end_position)}"
      possible_moves.include?(end_position)
    end

    def move_to!(end_position)
      # remove piece from current location
      @board.remove_piece!(position)

      # capture end position piece
      old_piece = @board.remove_piece!(end_position)
      old_piece&.capture!

      # set piece in the new location
      @board.place_piece!(self, end_position)
      @position = end_position
      @moved = true

      old_piece ? :captured : "#{name}_moved".to_sym
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
  end
end
