# frozen_string_literal: true

module ApplicationHelper
  def games
    GamesController.games
  end
end
