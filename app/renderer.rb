# frozen_string_literal: true

class Renderer
  def initialize(game)
    @game = game
  end

  def display
    put_line("Turn: #{@game.turn}")

    # columns
    put_line(column_line)

    # board
    @game.board.squares.size.times do |line_index|
      squares = @game.board.squares[line_index].map.with_index do |p, column_index|
        piece_str(p, [line_index, column_index])
      end
      put_board_row(line_index, squares)
    end

    # columns
    put_line(column_line)

    white_pieces = @game.board.captured_pieces.select(&:white?)
    black_pieces = @game.board.captured_pieces.select(&:black?)

    put_line "White has captured: " + black_pieces.map { |p| piece_str(p) }.join
    put_line "Black has captured: " + white_pieces.map { |p| piece_str(p) }.join
  end

  def column_line
    "    #{Board::COLUMN_INDEX.join('  ')}"
  end

  def piece_str(piece, coord = nil)
    str = piece ? p.class::ICONS[:black] : " "
    str = " #{str} "
    bg = background_color(coord) if coord
    color = piece&.color if coord
    str.colorize(background: bg, color: color)
  end

  def background_color(coord)
    if (coord[0] + coord[1]).even?
      :cyan
    else
      :light_red
    end
  end

  def put_board_row(index, arr)
    line_index = " #{Board::LINE_INDEX[index]} "
    puts line_index + arr.join + line_index
  end

  def put_line(str)
    puts str
  end
end
