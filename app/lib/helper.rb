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
      case color
      when :white
        :black
      when :black
        :white
      else
        # :nocov:
        raise "should not get here"
        # :nocov:
      end
    end
  end
end
