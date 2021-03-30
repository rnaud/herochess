require_relative "../pieces/all"

class FEN::Parser
  attr_accessor :pieces_attributes
  attr_accessor :turn

  def initialize(fen_str)
    @fen_str = fen_str
    @pieces_attributes = []
    @turn = :white

    parse
  end

  def parse
    fen_split = @fen_str.split(" ")
    board_data = fen_split[0]
    # replace numbers with spaces
    clean_board = board_data.split("").map { |char| char.is_i? ? " " * char.to_i : char }.join("")
    rows = clean_board.split("/")

    rows.each_with_index do |row, row_index|
      row.split("").each_with_index do |col, col_index|
        next if col == " "
        klass = FEN::MATCH[col.to_sym][0]
        color = FEN::MATCH[col.to_sym][1]
        coord = [row_index, col_index]
        @pieces_attributes << [klass, color, coord]
      end
    end

    if fen_split[1] == "b"
      @turn = :black
    end

    self
  end
end