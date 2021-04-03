# frozen_string_literal: true

class ApplicationController < ActionController::Base
  before_action :test_set_session if Rails.env.test?
  before_action :set_user

  def current_user
    session[:user_id].to_i
  end

  def test_set_session
    session[:user_id] = params[:test_user_id]
  end

  def set_user
    session[:user_id] = rand(1_000_000_000) unless session[:user_id]
  end
end
