class Renderer

  def initialize(board)
    @board = board
  end

  def display
    put_line(nil, column_padded)
    @board.squares.size.times do |line_index|
      squares = @board.squares[line_index].map.with_index do |p, column_index|
        str = piece_str(p)
        str = " " + str + " "
        bg = background_color(column_index, line_index)
        str.colorize( background: bg, color: piece_color(p&.color))
      end
      put_line(line_index, squares)
    end
    put_line(nil, column_padded)
  end

  def column_padded
    Board::COLUMN_INDEX.map {|c| " #{c} "}
  end

  def piece_str(p)
    return " " unless p
    #force black since we are overriding the font color, it's more legible
    p.class::ICONS[:black] 
  end

  def background_color(column_index, line_index)
    if (column_index + line_index) % 2 == 0 
      :cyan
    else
     :light_red
    end
  end

  def piece_color(color)
    if color == :white
      :white
    else
      :black
    end
  end

  def put_line(index, arr)
    line_index = index ? " #{Board::LINE_INDEX[index]} " : "   "
    log line_index + arr.join("") + line_index
  end
end