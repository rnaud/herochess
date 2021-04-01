# frozen_string_literal: true

class GamesController < ApplicationController
  before_action :set_game, only: %i[show destroy]
  before_action :find_or_set_player, only: [:show]

  def index
    @games = Game.all
  end

  def show
    redirect_to root_path unless @game
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

    if params[:color]
      @player = params[:color]
      
    else
      @player = @game.color?(current_user)
    end
    session[:games] ||= {}
    session[:games][@game.id] = @player
  end
end
