# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Games", type: :request do
  let(:game) { Game.create(white_user_id: 1, black_user_id: 2) }
  let(:game_without_black) { Game.create(white_user_id: 1) }

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

  describe "GET /games/:id" do
    it "assigns black user if there is none" do
      get game_path(game_without_black), params: {test_user_id: 2}
      expect(response).to have_http_status(:ok)
      expect(game_without_black.reload.black_user_id).to eq 2
    end
  end

  describe "PATCH /games" do
    it "moves the board properly" do
      params = {test_user_id: 1}
      params[:game] = {
        from: "d2",
        to: "d4"
      }
      patch game_path(game), params: params
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "PATCH /games" do
    it "cannot move when not your turn" do
      new_game = Game.create(white_user_id: 1, black_user_id: 2)
      params = {}
      params[:game] = {
        from: "e7",
        to: "e5",
        color: "black"
      }
      patch game_path(new_game), params: params
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "DELETE /games/:id" do
    it "can delete a game" do
      delete game_path(game)
      expect(response).to have_http_status(:found)
    end
  end
end
