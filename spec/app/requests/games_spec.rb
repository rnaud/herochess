# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Games", type: :request do
  let(:game) { Game.create(white_user_id: 1) }

  describe "GET /games" do
    it "returns games" do
      get games_path
      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET /games/new" do
    it "returns games" do
      get new_game_path
      expect(response).to have_http_status(:found)
    end
  end

  describe "GET /games/:id" do
    it "returns the right game" do
      get game_path(game)
      expect(response).to have_http_status(:ok)
    end
  end

  describe "PATCH /games" do
    it "moves the board properly" do
      params = {}
      params[:game] = {
        from: "d2",
        to: "d4",
        color: "white"
      }
      patch game_path(game), params: params
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "DELETE /games/:id" do
    it "can delete a game" do
      delete game_path(game)
      expect(response).to have_http_status(:found)
    end
  end
end
