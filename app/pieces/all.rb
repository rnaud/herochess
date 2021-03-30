require_relative "king"
require_relative "queen"
require_relative "knight"
require_relative "pawn"
require_relative "bishop"
require_relative "rook"

def fen_class(initial)
  case initial
  when "r", "R"
    Rook
  when "b", "B"
    Bishop
  when "p", "P"
    Pawn
  when "n", "N"
    Knight
  when "q", "Q"
    Queen
  when "k", "K"
    King
  else
    raise "unkown initial #{initial}"
  end
end