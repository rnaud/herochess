# frozen_string_literal: true

class GamesController < ApplicationController
  before_action :set_game, only: %i[show destroy update]
  before_action :find_or_set_player, only: %i[show destroy update]

  def index
    @games = Game.all
  end

  def show
    redirect_to root_path unless @game
  end

  def update
    @game.update(game_params)
  end

  def new
    @game = Game.create(white_user_id: current_user)
    redirect_to game_path(@game)
  end

  def destroy; end

  def set_game
    @game = Game.find(params[:id])
  end

  def find_or_set_player
    return unless @game

    if @game.white_user_id != current_user && @game.black_user_id.nil?
      @game.black_user_id = current_user
      @game.save
    end

    @player = params[:color] || @game.color?(current_user)
    session[:games] ||= {}
    session[:games][@game.id] = @player
  end

  def game_params
    params.require(:game).permit(:from, :to, :color)
  end
end
