# frozen_string_literal: true

class Board
  class MoveInvalidError < StandardError; end

  BOARD_SIZE = 8
  COLUMN_INDEX = ("a".."h").to_a
  LINE_INDEX = ("1".."8").to_a.reverse

  attr_reader :squares, :captured_pieces, :pieces, :game, :promoted_pieces
  attr_accessor :castling_priviledges, :moves, :debug

  def initialize(game:)
    @squares = Array.new(BOARD_SIZE)
    BOARD_SIZE.times do |i|
      @squares[i] = Array.new(BOARD_SIZE)
    end

    @game = game
    @moves = []
    @pieces = []
    @captured_pieces = []
    @promoted_pieces = []
    @debug = false
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

  def move(from, to, color_to_play, who_is_playing)
    raise MoveInvalidError, "Not your turn to play" if color_to_play != who_is_playing
    raise MoveInvalidError, "Invalid from" unless valid_input?(from)
    raise MoveInvalidError, "Invalid to" unless valid_input?(to)

    start_coord = Helper.pt(from)
    end_coord = Helper.pt(to)

    # verify move
    piece = find_piece(start_coord)
    other_piece = find_piece(end_coord)

    raise MoveInvalidError, "Could not find a piece here" if piece.nil?
    raise MoveInvalidError, "This piece does not belong to you" if piece.color != color_to_play
    raise MoveInvalidError, "You already have a piece there" if other_piece && other_piece.color == piece.color
    raise MoveInvalidError, "This piece cannot go here" unless piece.valid_move?(end_coord)
    raise MoveInvalidError, "Checkmate! #{Helper.invert_color(color_to_play)} wins" if checkmate?(color_to_play)
    raise MoveInvalidError, "Drawn game" if drawn?(color_to_play)
    raise MoveInvalidError, "You are still in check" if in_check?(color_to_play) && in_check_after_move?(piece, end_coord)
    raise MoveInvalidError, "This would put you in check" if in_check_after_move?(piece, end_coord)

    status = piece.move_to!(end_coord)
    @moves << Move.new(piece, from, to, color_to_play, 0, status)
    [piece, status]
  end

  def valid_input?(str)
    return false if str.nil?
    return false if str.empty?
    return false if str.length != 2

    arr = str.chars
    return false unless COLUMN_INDEX.include?(arr[0])
    return false unless LINE_INDEX.include?(arr[1])

    true
  end

  def valid_coord?(coord)
    coord[0].between?(0, BOARD_SIZE - 1) && coord[1].between?(0, BOARD_SIZE - 1)
  end

  def remove_piece!(coord)
    return unless valid_coord?(coord)

    piece = @squares[coord[0]][coord[1]]

    @squares[coord[0]][coord[1]] = nil
    piece
  end

  def place_piece!(piece, coord)
    return unless valid_coord?(coord)

    Rails.logger.debug "placing piece : #{piece.inspect} at #{Helper.pt(coord)} from #{caller}"

    @squares[coord[0]][coord[1]] = piece
  end

  def find_piece(coord)
    return unless valid_coord?(coord)

    @squares[coord[0]][coord[1]]
  end

  def find_king(color)
    @pieces.find { |p| p.is_a?(Piece::King) && p.color == color }
  end

  def square_attacked?(color, coord)
    pieces.any? do |p|
      p.color == color && p.possible_moves(type: :attack).include?(coord)
    end
  end

  def possible_moves(color)
    team_pieces = pieces_with(color: color)
    team_pieces.map do |piece|
      piece.possible_moves.map do |move|
        [piece.position, move]
      end
    end.flatten(1)
  end

  def pawn_promoted!(pawn, new_piece)
    @pieces.push(new_piece)
    @pieces.delete(pawn)
    @promoted_pieces.push(pawn)
  end

  def pawn_unpromoted!(pawn, new_piece)
    @promoted_pieces.delete(pawn)
    @pieces.delete(new_piece)
    @pieces.push(pawn)
  end

  def piece_captured!(piece)
    @pieces.delete(piece)
    @captured_pieces.push(piece)
  end

  def piece_uncaptured!(piece)
    @captured_pieces.delete(piece)
    @pieces.push(piece)
  end

  def pieces_with(color: nil)
    return @pieces if color.nil?

    @pieces.select { |p| p.color == color }
  end

  def in_check?(color)
    king = find_king(color)
    other_team_pieces = pieces_with(color: Helper.invert_color(color))
    other_team_pieces.any? do |piece|
      piece.possible_moves(type: :attack).include?(king.position)
    end
  end

  def in_check_after_move?(piece, end_position)
    piece.move_to!(end_position)

    result = in_check?(piece.color)

    piece.undo_last_move!

    result
  end

  def cant_get_out?(color)
    team_pieces = pieces_with(color: color)
    cant_get_out = true
    team_pieces.each do |p|
      p.possible_moves(type: :attack).each do |coord|
        cant_get_out = false unless in_check_after_move?(p, coord)
      end
    end
    cant_get_out
  end

  def checkmate?(color)
    in_check?(color) && cant_get_out?(color)
  end

  def drawn?(color)
    !in_check?(color) && cant_get_out?(color)
  end

  def spawn_pieces!
    spawn(Piece::Pawn, :black, (0..7).to_a.map { |i| [1, i] })
    spawn(Piece::Pawn, :white, (0..7).to_a.map { |i| [6, i] })

    spawn(Piece::Rook, :black, [[0, 0], [0, 7]])
    spawn(Piece::Rook, :white, [[7, 0], [7, 7]])

    spawn(Piece::Knight, :black, [[0, 1], [0, 6]])
    spawn(Piece::Knight, :white, [[7, 1], [7, 6]])

    spawn(Piece::Bishop, :black, [[0, 2], [0, 5]])
    spawn(Piece::Bishop, :white, [[7, 2], [7, 5]])

    spawn(Piece::Queen, :black, [[0, 3]])
    spawn(Piece::Queen, :white, [[7, 3]])

    spawn(Piece::King, :black, [[0, 4]])
    spawn(Piece::King, :white, [[7, 4]])
  end

  def spawn(klass, color, coords)
    coords = [coords] if coords.is_a?(String)
    coords.each do |coord|
      coord = Helper.pt(coord) if coord.is_a?(String)
      @pieces << @squares[coord[0]][coord[1]] =
                   klass.new(color: color, position: coord, board: self)
    end
  end
end
