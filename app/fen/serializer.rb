class FEN::Serializer
  def initialize(game)
    @game = game
  end

  def serialized
    lines = []
    @game.board.squares.each_with_index do |row|
      line = ""
      count = 0
      row.each_with_index do |piece, index|
        if !piece 
          count += 1
        end

        next if !piece && index < 7

        if count > 0
          line << count.to_s
          count = 0
        end
        if piece
          identifier = [piece.class, piece.color]
          line += FEN::INVERT_MATCH[identifier].to_s
        end
      end
      lines << line
    end
    lines.join("/") + " b KQkq - 1 2"
  end
end