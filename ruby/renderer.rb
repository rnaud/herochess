class Renderer

  def initialize(board)
    @board = board
  end

  def display
    put_line(nil, Board::COLUMN_INDEX)
    log "    --------------------------------"
    @board.squares.size.times do |line_index|
      squares = @board.squares[line_index].map.with_index do |p, column_index|
        str = p&.icon || " " 
        str = " " + str + " "
        background = (column_index + line_index) % 2 == 0 ? :light_yellow : :light_red
        str.colorize( background: background, color: piece_color(p&.color))
      end
      put_line(line_index, squares)
    end
    log "    --------------------------------"
    put_line(nil, Board::COLUMN_INDEX)
  end

  def piece_color(color)
    if color == :white
      :green
    else
      :black
    end
  end

  def put_line(index, arr)
    line_index = index ? " #{Board::LINE_INDEX[index]} " : "   "
    separator = index ? "|" : "   "
    log line_index + separator + arr.join(separator) + separator + line_index
  end
end