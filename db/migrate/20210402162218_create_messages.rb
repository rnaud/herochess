class CreateMessages < ActiveRecord::Migration[6.1]
  def change
    create_table :messages do |t|
      t.bigint :game_id
      t.bigint :user_id
      t.text :message
      t.jsonb :data

      t.timestamps
    end
  end
end
