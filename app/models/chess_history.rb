class ChessHistory < ApplicationRecord
  scope :black_won, -> { where(result: "0-1") }
  scope :white_won, -> { where(result: "1-0") }
  scope :drawn, -> { where(result: "1-0") }

  FIRST_WORD = /^([\S]+)/

  def self.best_options(pgn_prefix)
    all_histories = self.where("pgn LIKE :pgn", pgn: "#{pgn_prefix}%").black_won
    all_histories.inject({}) do |hash, history|
      hash[history.next_move(pgn_prefix)] ||= 0
      hash[history.next_move(pgn_prefix)] += 1
      hash
    end
  end

  def next_move(pgn_prefix)
    # use sub, not gsub, we just want to remove the beginning
    pgn.sub(pgn_prefix, "").strip[FIRST_WORD, 0]
  end

end
