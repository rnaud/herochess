# frozen_string_literal: true

class Move
  attr_accessor :piece, :from, :to, :turn, :moves_count, :status

  def initialize(piece, from, to, turn, moves_count, status)
    @piece = piece
    @from = from
    @to = to
    @turn = turn
    @moves_count = moves_count
    @status = status
  end

  def to_s
    "#{moves_count} - #{turn} - #{piece.icon} - #{from} - #{to} - #{status}"
  end

  def to_json(*_args)
    {
      piece: piece.class.name,
      from: from,
      to: to,
      turn: turn,
      moves_count: moves_count,
      status: status
    }
  end
end
