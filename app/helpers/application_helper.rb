# frozen_string_literal: true

module ApplicationHelper

  def square_data(row, square)
    square_id = Helper.pt([row, square])
    {
      row: row, 
      row_str: square_id[1], 
      col: square, 
      col_str: square_id[0], 
      square: square_id,
      id: "square_#{square_id}"
    }
  end

  def translate_str(game, piece)
    last_move = game.board.moves.last
    return unless last_move
    return unless last_move.to_coord == piece.position
    
    row_diff = last_move.from_coord[0] - piece.position[0]
    col_diff = last_move.from_coord[1] - piece.position[1]

    x = col_diff * 60
    y = row_diff * 60

    "transform: translate(#{x}px, #{y}px); "
  end

end
