# frozen_string_literal: true

module FEN
  MATCH = {
    r: [Rook, :black],
    R: [Rook, :white],
    b: [Bishop, :black],
    B: [Bishop, :white],
    p: [Pawn, :black],
    P: [Pawn, :white],
    n: [Knight, :black],
    N: [Knight, :white],
    q: [Queen, :black],
    Q: [Queen, :white],
    k: [King, :black],
    K: [King, :white]
  }.freeze
  INVERT_MATCH = MATCH.invert
end
