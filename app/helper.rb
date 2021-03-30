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
  Dir.glob("#{File.dirname(__FILE__)}/**/*.rb") { |f| load f }
end

class Logger
  @@level = :error

  def self.level=(level)
    @@level = level
  end

  def self.level
    @@level
  end
end

def log(text)
  return unless Logger.level == :verbose
  puts "#{Time.now} - #{text}"
end