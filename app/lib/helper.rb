# frozen_string_literal: true

# position_translated
class Helper
  class << self
    def pt(arg)
      if arg.is_a?(String)
        c = Board::COLUMN_INDEX.find_index(arg[0])
        l = Board::LINE_INDEX.find_index(arg[1])
        [l, c]
      elsif arg[0].present?
        c = Board::COLUMN_INDEX[arg[1]]
        l = Board::LINE_INDEX[arg[0]]
        c + l
      else
        "-"
      end
    end

    def invert_color(color)
      if color == :white
        :black
      elsif color == :black
        :white
      else
        raise "should not get here"
      end
    end
  end
end

class String
  def i?
    !!(self =~ /\A[-+]?[0-9]+\z/)
  end
end
