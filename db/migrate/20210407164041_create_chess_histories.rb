class CreateChessHistories < ActiveRecord::Migration[6.1]
  def change
    create_table :chess_histories do |t|
      t.string :event
      t.text :pgn
      t.string :white_user
      t.string :black_user
      t.datetime :played_at
      t.bigint :white_elo
      t.bigint :black_elo
      t.text :opening
      t.string :termination
      t.string :result

      t.timestamps
    end

    add_index :chess_histories, :pgn, order: {name: :text_pattern_ops}
  end
end
