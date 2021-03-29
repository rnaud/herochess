class King < Piece
  ICONS = {
    white: "♔",
    black: "♚",
  }

  def directions(type:)
    h = {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1],
      nw: [-1, -1],
      ne: [-1, 1],
      sw: [1, -1],
      se: [1, 1],
    }

    h[:castle_left] = [0, -2] if type == :all && can_castle?(:left)
    h[:castle_right] = [0, 2] if type == :all && can_castle?(:right)
    h
  end

  def can_castle?(side)
    return false if has_moved?
    line = self.position[0]
    
    # check if rook has moved
    rook_column = side == :left ? Rook::LEFT_COL : Rook::RIGHT_COL
    rook = @board.find_piece([line, rook_column])
    return false if !rook || rook.has_moved?

    # check that the squares in between are empty and not currently attacked
    if side == :left
      squares_to_check = (1..3)
    else
      squares_to_check = (5..6)
    end
    squares_to_check.each do |i|
      coord = [line, i]
      return false if @board.square_attacked?(invert_color(self.color), coord)
      return false if @board.find_piece(coord)
    end
  end

  def move_to!(end_position)
    original_position = self.position
    super(end_position)

    line = original_position[0]
    # the king moved to 2 squares to the left, move the rook as well
    if original_position[1] - end_position[1] == 2 
      left_rook = @board.find_piece([line, Rook::LEFT_COL])
      left_rook.move_to!([line, 3])
    # the king moved to 2 squares to the right, move the rook as well
    elsif original_position[1] - end_position[1] == -2
      right_rook = @board.find_piece([line, Rook::RIGHT_COL])
      right_rook.move_to!([line, 5])
    end
  end

end