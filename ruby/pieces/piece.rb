class Piece
  attr_reader :color
  attr_reader :has_moved
  attr_reader :killed
  attr_reader :position

  def initialize(color:, position:, board:)
    @color = color
    @position = position
    @board = board
    @has_moved = false
    @killed = false
  end

  def kill!
    puts "killed #{self.class} #{pt self.position}"
    @killed = true
  end

  def white?
    @color == :white
  end

  def icon
    self.class::ICONS[@color]
  end

  def directions
    raise DirectionsUndefinedError
  end

  def possible_moves
    moves = []
    directions.each do | direction, vector |
      moves << valid_options(vector)
    end
    moves.flatten!(1)
    puts "possible_moves: #{moves.map {|a| pt(a)}}"
    moves
  end

  def valid_options(vector)
    options = []
    exploring = [(@position[0] + vector[0]), (@position[1] + vector[1])]
    
    options << exploring
    options
  end

  def valid_move?(end_position)
    puts "possibles moves for #{self.class.name} #{pt(@position)}"
    
    puts "end_position: #{pt(end_position)}"
    possible_moves.include?(end_position)
  end

  def move_to!(end_position)
    # remove piece from current location
    @board.remove_piece!(@position)

    # set piece in the new location
    @board.place_piece!(self, end_position)
    @position = end_position
    @has_moved = true
  end

  def has_moved?
    @has_moved
  end
end