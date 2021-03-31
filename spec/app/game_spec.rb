# frozen_string_literal: true

require "spec_helper"

describe Game do
  it "can create a new board" do
    game = Game.new
    expect(game.state).to eq "white to play"
    expect(game.turn).to eq :white
    expect(game.turn_count).to eq 0
    expect(game.board.pieces.size).to eq 32
    expect(game.board.captured_pieces).to eq []
  end

  it "block the king from moving when in check" do
    game = Game.new
    game.move("d2", "d4")
    game.move("e7", "e5")
    game.move("e1", "d2")
    game.move("d8", "g5")
    expect(game.board.in_check?(:white)).to be true
    expect(game.move("d2", "e3")).to eq "in check, white to play - You are still in check"
    expect(game.board.in_check?(:white)).to be true
  end

  it "returns checkmates when king is stuck" do
    game = Game.new
    game.move("f2", "f4")
    game.move("e7", "e5")
    game.move("g2", "g4")
    game.move("d8", "h4")
    expect(game.board.in_check?(:white)).to be true
    expect(game.board.checkmate?(:white)).to be true
    expect(game.move("c2", "c3")).to eq "black wins by checkmate - Checkmate! black wins"
  end

  it "returns checkmate" do
    game = Game.new(fen: "7k/8/8/8/8/8/r2q4/3K4 w KQkq - 0 0")
    expect(game.state).to eq "black wins by checkmate"
  end

  it "can parse fen" do
    array = [
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2"
    ]
    array.each do |fen|
      game = Game.new(fen: fen)
      expect(game.fen).to eq fen
    end
  end
end
