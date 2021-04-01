# frozen_string_literal: true

class Game
  include ActiveModel::Model
  attr_accessor :game_instance, :uuid, :white_uuid, :black_uuid

  def initialize
    @game_instance = GameEngine.new
    @uuid = SecureRandom.hex(4)
    @white_uuid = SecureRandom.hex(4)
    @black_uuid = SecureRandom.hex(4)
  end

  def dump
    Marshal.dump(self)
  end
end
