# frozen_string_literal: true

class ApplicationController < ActionController::Base
  before_action :set_user

  def current_user
    session[:user_id].to_i
  end

  def set_user
    session[:user_id] = rand(1_000_000_000) unless session[:user_id]
  end
end
