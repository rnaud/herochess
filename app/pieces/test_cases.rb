
class TestCases

  def pawn_take
    @game = Game.new
    @game.move("d2", "d4")
    @game.move("c7", "c5")
    @game.move("d4", "d5")


    @game = Game.new
    @game.move("d2", "d4")
    @game.move("e7", "e5")
    @game.move("d4", "e5")
    @game.board.squares[3][4]
  end

  def castle_test_case
    @game = Game.new
    @game.move("d2", "d4")
    @game.move("e7", "e5")
    @game.move("c1", "d2")
    @game.move("h7", "h6")
    @game.move("d2", "h6")
    @game.move("a7", "a6")
    @game.move("b1", "c3")
    @game.move("e8", "e7")
    @game.move("d1", "d3")
    @game.move("d8", "e8")

    @game.move("e1", "c1") #queen side castle


    @game.board.find_piece(pt("e1"))&.possible_moves
    @game.render
  end

  def check_test_case
    @game = Game.new
    @game.move("d2", "d4")
    @game.move("e7", "e5")
    @game.move("e1", "d2")
    @game.move("d8", "g5")
    @game.board.in_check?(:white) # true
    @game.move("c2", "c3") #invalid move
    @game.move("c2", "c3") #valid move, get out of check
    @game.render
  end

  def checkmate_test_case
    @game = Game.new
    @game.move("f2", "f4")
    @game.move("e7", "e5")
    @game.move("g2", "g4")
    @game.move("d8", "h4")
    @game.board.in_check?(:white) # true

    king = @game.board.pieces.find { |p| p.color == :white && p.is_a?(King) }
    king.possible_moves
    @game.board.in_check_after_move?(king, [6, 5])

    @game.board.checkmate?(:white) # true
    @game.move("c2", "c3") #invalid move
    @game.render
  end

  def new_checkmate_test_case
    @game = Game.new(fen: "")
    @game.board.spawn(King, :black, "h8")
    @game.board.spawn(King, :white, "d1")
    @game.board.spawn(Queen, :black, "d2")
    @game.board.spawn(Rook, :black, "a2")
  end

  def fen_setup
    @game = Game.new(fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2")
    
  end

end