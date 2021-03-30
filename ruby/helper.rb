def pt(arg) #position_translated
  if arg.is_a?(String)
    c = Board::COLUMN_INDEX.find_index(arg[0])
    l = Board::LINE_INDEX.find_index(arg[1])
    [l, c]
  else
    c = Board::COLUMN_INDEX[arg[1]]
    l = Board::LINE_INDEX[arg[0]]
    c + l
  end
end

def invert_color(color)
  if color == :white
    :black
  else
    :white
  end
end

def reload!
  Dir.glob('./**/*.rb') { |f| load f }
end

def log(text)
  return unless @verbose
  puts "#{Time.now} - #{text}"
end

@verbose = false