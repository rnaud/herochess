# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
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
