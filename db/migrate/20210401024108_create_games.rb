# frozen_string_literal: true

class CreateGames < ActiveRecord::Migration[6.1]
  def change
    create_table :games do |t|
      t.text :serialized_board
      t.string :state
      t.string :turn, default: "white"
      t.integer :moves_count, default: 0
      t.integer :half_moves_count, default: 0
      t.bigint :white_user_id
      t.bigint :black_user_id

      t.timestamps
    end
  end
end
