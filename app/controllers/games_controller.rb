# frozen_string_literal: true

class GamesController < ApplicationController
  cattr_accessor :games
  self.games = {}

  def index
    @games = {}
  end

  def show
    @game = 1
  end

  def new; end
end
