# frozen_string_literal: true

require_relative "../pieces/all"

module FEN
  class Parser
    attr_accessor :pieces_attributes, :castling_priviledges, :turn, :turn_count, :half_moves_count,
                  :en_passant

    def initialize(fen_str)
      @fen_str = fen_str
      @pieces_attributes = []
      @turn = :white
      @turn_count = 0
      @half_moves_count = 0
      @castling_priviledges = {
        black: {
          left: false,
          right: false
        },
        white: {
          left: false,
          right: false
        }
      }

      parse
    end

    def parse
      @fen_split = @fen_str.split
      parse_pieces
      parse_turn
      parse_castling
      parse_en_passant
      parse_turn_count
      parse_half_moves_count

      self
    end

    def parse_pieces
      board_data = @fen_split[0]
      # replace numbers with spaces
      clean_board = board_data.chars.map { |char| char.i? ? " " * char.to_i : char }.join
      rows = clean_board.split("/")

      rows.each_with_index do |row, row_index|
        row.chars.each_with_index do |col, col_index|
          next if col == " "

          klass = FEN::MATCH[col.to_sym][0]
          color = FEN::MATCH[col.to_sym][1]
          coord = [row_index, col_index]
          @pieces_attributes << [klass, color, coord]
        end
      end
    end

    def parse_turn
      @turn = :black if @fen_split[1] == "b"
    end

    def parse_castling
      @castling_priviledges[:white][:right] = true if @fen_split[2].include? "K"
      @castling_priviledges[:white][:left] = true if @fen_split[2].include? "Q"
      @castling_priviledges[:black][:right] = true if @fen_split[2].include? "k"
      @castling_priviledges[:black][:left] = true if @fen_split[2].include? "q"
    end

    def parse_en_passant
      @en_passant = @fen_split[3] unless @fen_split[3] == "-"
    end

    def parse_turn_count
      @turn_count = @fen_split[4].to_i
    end

    def parse_half_moves_count
      @half_moves_count = @fen_split[5].to_i
    end
  end
end
