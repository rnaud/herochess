# frozen_string_literal: true

class Move
  attr_accessor :piece, :from, :to, :to_coord, :from_coord, :turn, :moves_count, :status

  def initialize(piece, from, to, turn, moves_count, status)
    @piece = piece
    @from = from
    @from_coord = Helper.pt(from)
    @to = to
    @to_coord = Helper.pt(to)
    @turn = turn
    @moves_count = moves_count
    @status = status
  end

  def to_s
    "#{moves_count} - #{turn} - #{piece.icon} - #{from} - #{to} - #{status}"
  end
end
