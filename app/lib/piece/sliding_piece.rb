# frozen_string_literal: true

# require_relative "piece"

module Piece
  class SlidingPiece < Piece::Base
    def valid_options(vector)
      options = []
      exploring = [(@position[0] + vector[0]), (@position[1] + vector[1])]

      # keep exploring until we get off board or hit an ennemy piece
      loop do
        other_piece = @board.find_piece(exploring)
        ennemy_piece = other_piece && other_piece.color != color
        valid_coord = @board.valid_coord?(exploring)

        break unless valid_coord
        break if other_piece && !ennemy_piece

        options << exploring

        break if other_piece && ennemy_piece

        exploring = [(exploring[0] + vector[0]), (exploring[1] + vector[1])]
      end

      options
    end
  end
end
