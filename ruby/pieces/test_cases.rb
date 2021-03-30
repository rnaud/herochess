
class TestCases

  def test
    @game = Game.new ; 1
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

    @game.board.captured_pieces
  end
end