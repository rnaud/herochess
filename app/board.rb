require_relative "errors"
require_relative "pieces/all"

class Board
  BOARD_SIZE = 8
  COLUMN_INDEX = ("a".."h").to_a
  LINE_INDEX = ("1".."8").to_a.reverse

  attr_reader :squares
  attr_reader :captured_pieces
  attr_reader :pieces
  attr_accessor :castling_priviledges

  def initialize
    @squares = Array.new(BOARD_SIZE)
    BOARD_SIZE.times do |i|
      @squares[i] = Array.new(BOARD_SIZE)
    end

    @pieces = []
    @captured_pieces = []
    @castling_priviledges = {
      black: {
        left: true,
        right: true
      },
      white: {
        left: true,
        right: true
      }
    }
  end

  def move(from, to, color_to_play)
    raise MoveInvalidError.new("Invalid from") unless valid_input?(from)
    raise MoveInvalidError.new("Invalid to") unless valid_input?(to)

    start_coord = pt(from)
    end_coord = pt(to)

    # verify move
    piece = find_piece(start_coord)
    other_piece = find_piece(end_coord)

    raise MoveInvalidError.new("Could not find a piece here") if piece.nil?
    raise MoveInvalidError.new("This piece does not belong to you") if piece.color != color_to_play
    raise MoveInvalidError.new("You already have a piece there") if other_piece && other_piece.color == piece.color
    raise MoveInvalidError.new("This piece cannot go here") unless piece.valid_move?(end_coord)
    raise MoveInvalidError.new("Checkmate! #{invert_color(color_to_play)} wins") if checkmate?(color_to_play)
    raise MoveInvalidError.new("Drawn game") if drawn?(color_to_play)
    raise MoveInvalidError.new("You are still in check") if in_check?(color_to_play) && in_check_after_move?(piece, end_coord)
    raise MoveInvalidError.new("This would put you in check") if in_check_after_move?(piece, end_coord)

    status = piece.move_to!(end_coord)
    return piece, status
  end

  def valid_input?(str)
    return false if str.nil?
    return false if str.empty?
    return false if str.length != 2
    arr = str.split("")
    return false unless COLUMN_INDEX.include?(arr[0])
    return false unless LINE_INDEX.include?(arr[1])
    true
  end

  def valid_coord?(coord)
    coord[0].between?(0, BOARD_SIZE - 1) && coord[1].between?(0, BOARD_SIZE - 1)
  end

  def place_piece!(piece, coord)
    return unless valid_coord?(coord)
    @squares[coord[0]][coord[1]] = piece
  end

  def remove_piece!(coord)
    return unless valid_coord?(coord)
    piece = @squares[coord[0]][coord[1]]
    @squares[coord[0]][coord[1]] = nil
    piece
  end

  def find_piece(coord)
    return unless valid_coord?(coord)
    @squares[coord[0]][coord[1]]
  end

  def find_king(color)
    @pieces.find { |p| p.is_a?(King) && p.color == color }
  end

  def square_attacked?(color, coord)
    pieces.any? do |p|
      p.color == color && p.possible_moves(type: :attack).include?(coord)
    end
  end

  def piece_captured!(piece)
    @pieces.delete(piece)
    @captured_pieces.push(piece)
  end

  def pieces_with(color: nil)
    return @pieces if color.nil?
    @pieces.select { |p| p.color == color }
  end

  def in_check?(color)
    king = find_king(color)
    other_team_pieces = pieces_with(color: invert_color(color))
    other_team_pieces.any? do |piece|
      piece.possible_moves(type: :attack).include?(king.position)
    end
  end

  def in_check_after_move?(piece, end_position)
    original_position = piece.position
    remove_piece!(piece.position)
    piece_on_end_position = remove_piece!(end_position)
    place_piece!(piece, end_position)
    piece.position = end_position
    
    result = in_check?(piece.color)
    
    # reset the piece
    remove_piece!(end_position)
    place_piece!(piece, original_position)
    piece.position = original_position
    place_piece!(piece_on_end_position, end_position) if piece_on_end_position

    result
  end

  def cant_get_out(color)
    team_pieces = pieces_with(color: color)
    cant_get_out = true
    team_pieces.each do |p|
      p.possible_moves(type: :attack).each do |coord|
        unless in_check_after_move?(p, coord)
          cant_get_out = false
        end
      end
    end
    cant_get_out
  end

  def checkmate?(color)
    in_check?(color) && cant_get_out(color)
  end

  def drawn?(color)
    !in_check?(color) && cant_get_out(color)
  end

  def spawn_pieces!
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
    coords = [coords] if coords.is_a?(String)
    coords.each do |coord|
      coord = pt(coord) if coord.is_a?(String)
      @pieces << @squares[coord[0]][coord[1]] = klass.new(color: color, position: coord, board: self)
    end
  end
end