# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Messages", type: :request do
  let(:game) { Game.create(white_user_id: 1) }

  describe "POST /messages" do
    it "creates a new message" do
      params = {}
      params[:message] = {
        message: "yo",
        game_id: game.id
      }
      post messages_path, params: params
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "DELETE /messages/:id" do
    it "can delete a message" do
      message = Message.create(message: "test", user_id: 1, game_id: game.id)
      delete message_path(message)
      expect(response).to have_http_status(:no_content)
    end
  end
end
