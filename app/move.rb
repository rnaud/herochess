class Move
  attr_accessor :piece
  attr_accessor :from
  attr_accessor :to
  attr_accessor :turn
  attr_accessor :turn_count
  attr_accessor :status

  def initialize(piece, from, to, turn, turn_count, status)
    @piece = piece
    @from = from
    @to = to
    @turn = turn
    @turn_count = turn_count
    @status = status
  end

  def to_s
    "#{turn_count} - #{turn} - #{piece.icon} - #{from} - #{to} - #{status}"
  end

  def to_json
    {
      piece: piece.class.name,
      from: from,
      to: to,
      turn: turn,
      turn_count: turn_count,
      status: status,
    }
  end
end