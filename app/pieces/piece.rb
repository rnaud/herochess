class Piece
  attr_reader :color
  attr_reader :has_moved
  attr_reader :captured
  attr_accessor :position
  attr_accessor :original_position
  attr_reader :was

  def initialize(color:, position:, board:, was: nil)
    @color = color
    @position = position
    @original_position = position
    @board = board
    @has_moved = false
    @captured = false
    @was = was
  end

  def capture!
    log "captured #{self.class} #{pt self.position}"
    @position = [nil, nil]
    @captured = true
    @board.piece_captured!(self)
  end

  def white?
    @color == :white
  end

  def black?
    @color == :black
  end

  def icon
    self.class::ICONS[@color]
  end

  def directions(type: :all)
    raise DirectionsUndefinedError
  end

  def possible_moves(type: :all)
    moves = []
    directions(type: type).each do | direction, vector |
      moves << valid_options(vector)
    end
    moves.flatten!(1)
    log "possible_moves - #{self.inspect} - #{moves.map {|a| pt(a)}.join(", ")}"
    moves
  end

  def valid_options(vector)
    options = []
    exploring = [(@position[0] + vector[0]), (@position[1] + vector[1])]

    other_piece = @board.find_piece(exploring)
    ennemy_piece = other_piece && other_piece.color != self.color
    valid_coord = @board.valid_coord?(exploring)
    
    if valid_coord && (other_piece.nil? || ennemy_piece)
      options << exploring
    end

    options
  end

  def valid_move?(end_position)
    log "end_position: #{pt(end_position)}"
    possible_moves.include?(end_position)
  end

  def move_to!(end_position)
    # remove piece from current location
    @board.remove_piece!(self.position)

    # capture end position piece
    old_piece = @board.remove_piece!(end_position)
    old_piece.capture! if old_piece

    # set piece in the new location
    @board.place_piece!(self, end_position)
    @position = end_position
    @has_moved = true

    old_piece ? :captured : "#{self.name}_moved".to_sym
  end

  def has_moved?
    @has_moved
  end

  def inspect
    "#{self.class.name} - #{self.color} - #{pt self.position}"
  end

  def name
    self.class.name.downcase
  end

  def id
    "#{name}-#{object_id}"
  end
end