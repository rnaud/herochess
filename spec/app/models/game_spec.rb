# frozen_string_literal: true

require "spec_helper"

describe Game do
  it "can create a new board" do
    game = Game.new
    expect(game.state).to eq :play
    expect(game.turn).to eq :white
    expect(game.moves_count).to eq 0
    expect(game.board.pieces.size).to eq 32
    expect(game.board.captured_pieces).to eq []

    first_piece = game.board.squares[0][0]
    expect(first_piece.col).to eq 0
    expect(first_piece.row).to eq 0

    last_piece = game.board.squares[7][7]
    expect(last_piece.col).to eq 7
    expect(last_piece.row).to eq 7

    expect(game.board.score).to eq 0
  end

  it "can render a board" do
    game = Game.new
    game.render
  end

  it "can play with an AI" do
    game = Game.new(versus: :ai)
    game.move(from: "d2", to: "d4")
    # black moved already
    expect(game.turn).to eq :white
  end

  it "capture with white pawn" do
    game = Game.new
    game.move(from: "d2", to: "d4")
    game.move(from: "e7", to: "e5")
    game.move(from: "d4", to: "e5")
    expect(game.state).to be :play
    expect(game.board.score).to eq 10
    game.render
  end

  it "block the king from moving when in check" do
    game = Game.new
    game.move(from: "d2", to: "d4")
    game.move(from: "e7", to: "e5")
    game.move(from: "e1", to: "d2")
    game.move(from: "d8", to: "g5")
    expect(game.board.in_check?(:white)).to be true
  end

  it "returns checkmates when king is stuck" do
    game = Game.new
    game.move(from: "f2", to: "f4")
    game.move(from: "e7", to: "e5")
    game.move(from: "g2", to: "g4")
    game.move(from: "d8", to: "h4")
    expect(game.board.in_check?(:white)).to be true
    expect(game.board.checkmate?(:white)).to be true
    expect(game.state).to eq :checkmate
  end

  it "returns checkmate" do
    game = Game.new(fen_initial: "7k/8/8/8/8/8/r2q4/3K4 w KQkq - 0 0")
    expect(game.state).to eq :checkmate
  end

  it "can move the black queen" do
    game = Game.new(fen_initial: "rnb1kbnr/pp2q1pp/5p2/3P4/8/5N2/PPP1QPPP/RNB1KB1R b KQkq - 6 1", white_user_id: 1)
    expect(game.state).to eq :play
    expect(game.turn).to eq :black

    game.move(from: "e7", to: "e2")
    expect(game.state).to eq :check
  end

  it "can left castle" do
    game = Game.new
    game.move(from: "e2", to: "e4") # move a white pawn
    game.move(from: "e7", to: "e5") # move a black pawn
    game.move(from: "f1", to: "c4") # move the white bishop
    game.move(from: "a7", to: "a5") # move a black pawn
    game.move(from: "g1", to: "f3") # move the white knight
    game.move(from: "b7", to: "b5") # move a black pawn
    # still has castling priviledges
    expect(game.fen).to eq "rnbqkbnr/2pp1ppp/8/pp2p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq b5 3 0"
    game.move(from: "e1", to: "g1") # move the white king to castle

    # white side no longer has castling priviledges
    expect(game.fen).to eq "rnbqkbnr/2pp1ppp/8/pp2p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 3 1"
  end

  it "can right castle" do
    game = Game.new(white_user_id: 1)
    game.move(from: "e2", to: "e4") # move a white pawn
    game.move(from: "e7", to: "e5") # move a black pawn
    game.move(from: "d2", to: "d4") # move a white pawn
    game.move(from: "e5", to: "d4") # take with black pawn
    game.move(from: "c1", to: "f4") # move the white bishop
    game.move(from: "d7", to: "d5") # move a black pawn
    game.move(from: "b1", to: "a3") # move the white knight
    game.move(from: "b7", to: "b5") # move a black pawn
    game.move(from: "d1", to: "d2") # move the white queen
    game.move(from: "d8", to: "d7") # move a black pawn
    # still has castling priviledges
    expect(game.fen).to eq "rnb1kbnr/p1pq1ppp/8/1p1p4/3pPB2/N7/PPPQ1PPP/R3KBNR w KQkq - 5 2"

    # move too far, king cannot go to b1
    game.move(from: "e1", to: "b1")
    expect(game.state).to eq :play
    expect(game.turn).to eq :white

    # move the white king to castle
    game.move(from: "e1", to: "c1")
    expect(game.state).to eq :play
    expect(game.turn).to eq :black

    # white side no longer has castling priviledges
    expect(game.fen).to eq "rnb1kbnr/p1pq1ppp/8/1p1p4/3pPB2/N7/PPPQ1PPP/2KR1BNR b kq - 5 3"
  end

  it "can promote a pawn" do
    game = Game.new(fen_initial: "k7/4P3/8/8/8/8/8/K7 w - - 10 0")
    game.move(from: "e7", to: "e8")
    expect(game.fen).to eq "k3Q3/8/8/8/8/8/8/K7 b - e8 10 0" # the pawn is now a queen
    expect(game.state).to eq :check

    game.undo_last_move!

    expect(game.fen).to eq "k7/4P3/8/8/8/8/8/K7 w - e8 10 0" # pawn is back, white to play
    game.move(from: "e7", to: "e8")
    expect(game.fen).to eq "k3Q3/8/8/8/8/8/8/K7 b - e8 10 0" # the pawn is now a queen
    expect(game.state).to eq :check
  end

  it "can drawn" do
    game = Game.new(fen_initial: "8/5KBk/8/8/8/8/8/8 b - - 10 0")
    expect(game.state).to eq :drawn
  end

  it "can parse fen" do
    array = [
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2"
    ]
    array.each do |fen|
      game = Game.new(fen_initial: fen)
      expect(game.fen).to eq fen
    end
  end

  context "model persistence" do
    it "is invalid without a user_d" do
      game = Game.new
      expect(game).to_not be_valid
      expect(game.errors.messages[:white_user_id]).to eq ["can't be blank"]
    end

    it "can create with a user_id" do
      game = Game.create(white_user_id: 1)
      expect(game.valid?).to be true
    end

    it "can make a move and save it to the db" do
      game = Game.create(white_user_id: 1)
      expect(game.valid?).to be true
      game.update(from: "d2", to: "d4")
    end
  end
end
