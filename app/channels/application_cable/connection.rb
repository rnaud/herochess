# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user
    attr_accessor :game_sessions

    def connect
      self.current_user = find_verified_user
      self.game_sessions = session["games"]
    end

    private

    def find_verified_user
      session["user_id"]
    end

    def session
      cookies.encrypted[Rails.application.config.session_options[:key]]
    end
  end
end
