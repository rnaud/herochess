# frozen_string_literal: true

class CreateGames < ActiveRecord::Migration[6.1]
  def change
    create_table :games do |t|
      t.text :game_object
      t.bigint :white_user_id
      t.bigint :black_user_id

      t.timestamps
    end
  end
end
