# frozen_string_literal: true

module Fen
  class Constants
    MATCH = {
      r: [Piece::Rook, :black],
      R: [Piece::Rook, :white],
      b: [Piece::Bishop, :black],
      B: [Piece::Bishop, :white],
      p: [Piece::Pawn, :black],
      P: [Piece::Pawn, :white],
      n: [Piece::Knight, :black],
      N: [Piece::Knight, :white],
      q: [Piece::Queen, :black],
      Q: [Piece::Queen, :white],
      k: [Piece::King, :black],
      K: [Piece::King, :white],
      y: [Piece::Hero::DoubleKnight, :black],
      Y: [Piece::Hero::DoubleKnight, :white]
    }.freeze
    INVERT_MATCH = MATCH.invert
  end
end
