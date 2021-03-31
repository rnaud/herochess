# frozen_string_literal: true

module FEN
  class Serializer
    def initialize(game)
      @game = game
    end

    def serialized
      lines = []
      @game.board.squares.each do |row|
        line = ""
        count = 0
        row.each_with_index do |piece, index|
          count += 1 unless piece

          next if !piece && index < 7

          if count.positive?
            line += count.to_s
            count = 0
          end
          if piece
            identifier = [piece.class, piece.color]
            line += FEN::INVERT_MATCH[identifier].to_s
          end
        end
        lines << line
      end

      castling = []
      castling << "K" if @game.board.castling_priviledges[:white][:right]
      castling << "Q" if @game.board.castling_priviledges[:black][:left]
      castling << "k" if @game.board.castling_priviledges[:white][:right]
      castling << "q" if @game.board.castling_priviledges[:black][:left]

      arr = []
      arr << lines.join("/")
      arr << (@game.turn == :white ? "w" : "b")
      arr << (castling.empty? ? "-" : castling.join)
      arr << (@game.en_passant || "-")
      arr << @game.turn_count
      arr << @game.half_moves_count
      arr.join(" ")
    end
  end
end
