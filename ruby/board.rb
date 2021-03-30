class Board
  BOARD_SIZE = 8
  COLUMN_INDEX = ("a".."h").to_a
  LINE_INDEX = ("1".."8").to_a.reverse

  attr_reader :squares
  attr_reader :pieces

  def initialize
    @squares = Array.new(BOARD_SIZE)
    BOARD_SIZE.times do |i|
      @squares[i] = Array.new(BOARD_SIZE)
    end

    @pieces = []

    spawn_pieces
  end

  def move(from, to, color_to_play)
    start_coord = pt(from)
    end_coord = pt(to)

    # verify move
    piece = find_piece(start_coord)
    other_piece = find_piece(end_coord)

    raise MoveInvalidError.new("Could not find a piece here") if piece.nil?
    raise MoveInvalidError.new("This piece does not belong to you") if piece.color != color_to_play
    raise MoveInvalidError.new("You already have a piece there") if other_piece && other_piece.color == piece.color
    raise MoveInvalidError.new("You are in check") if in_check? && in_check_after_move?    
    raise MoveInvalidError.new("This piece cannot go here") unless piece.valid_move?(end_coord)

    piece.move_to!(end_coord)
  end

  def valid_coord?(coord)
    coord[0].between?(0, BOARD_SIZE - 1) && coord[1].between?(0, BOARD_SIZE - 1)
  end

  def place_piece!(piece, coord)
    return unless valid_coord?(coord)
    current_piece = @squares[coord[0]][coord[1]]
    current_piece.capture! if current_piece
    @squares[coord[0]][coord[1]] = piece
  end

  def remove_piece!(coord)
    return unless valid_coord?(coord)
    @squares[coord[0]][coord[1]] = nil
  end

  def find_piece(coord)
    return unless valid_coord?(coord)
    @squares[coord[0]][coord[1]]
  end

  def square_attacked?(color, coord)
    pieces.any? do |p|
      p.color == color && p.possible_moves(type: :attack).include?(coord)
    end
  end

  def captured_pieces
    pieces.select { |p| p.captured }
  end

  def in_check?
    false
  end

  def in_check_after_move?
    false
  end

  def spawn_pieces
    spawn(Pawn, :black, (0..7).to_a.map { |i| [1, i] })
    spawn(Pawn, :white, (0..7).to_a.map { |i| [6, i] })

    spawn(Rook, :black, [[0, 0], [0, 7]])
    spawn(Rook, :white, [[7, 0], [7, 7]])

    spawn(Knight, :black, [[0, 1], [0, 6]])
    spawn(Knight, :white, [[7, 1], [7, 6]])

    spawn(Bishop, :black, [[0, 2], [0, 5]])
    spawn(Bishop, :white, [[7, 2], [7, 5]])
    
    spawn(Queen, :black, [[0, 3]])
    spawn(Queen, :white, [[7, 3]])

    spawn(King, :black, [[0, 4]])
    spawn(King, :white, [[7, 4]])
  end

  def spawn(klass, color, coords)
    coords.each do |coord|
      @pieces << @squares[coord[0]][coord[1]] = klass.new(color: color, position: coord, board: self)
    end
  end
end