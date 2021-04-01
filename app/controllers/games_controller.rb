# frozen_string_literal: true

class GamesController < ApplicationController
  cattr_accessor :games
  self.games = {}

  before_action :find_game, only: [:show]
  before_action :find_or_set_player, only: [:show]

  def index
    @games = games
  end

  def show
    redirect_to root_path unless @game
  end

  def new
    uuid = SecureRandom.hex(4)
    white_uuid = SecureRandom.hex(4)
    black_uuid = SecureRandom.hex(4)
    cookies[uuid] = white_uuid

    @game = Game.new

    games[uuid] = {
      game: @game,
      sockets: [],
      colors: {
        white: white_uuid,
        black: black_uuid
      },
      invitation_accepted: false
    }

    redirect_to game_path(uuid)
  end

  def destroy; end

  def find_game
    @uuid = params[:id]
    @game_hash = games[@uuid]
    @game = @game_hash[:game] if @game_hash
  end

  def find_or_set_player
    return unless @game_hash

    if cookies[@uuid]
      @player = :white if @game_hash[:colors][:white] == cookies[@uuid]
      @player = :black if @game_hash[:colors][:black] == cookies[@uuid]
    else
      cookies[@uuid] = @game_hash[:colors][:black]
      @player = :black
    end
  end
end
