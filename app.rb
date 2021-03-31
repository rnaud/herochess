require "sinatra"
require "sinatra-websocket"
require "sinatra/cookies"
require "sinatra/reloader" if development?
require "pry"
require "json"

require_relative "app/game"
require_relative "app/helper"

set :sockets, []
set :games, {}
set :haml, format: :html5

get "/" do
  haml :index
end

get "/new" do
  uuid = SecureRandom.hex(4)
  white_uuid = SecureRandom.hex(4)
  black_uuid = SecureRandom.hex(4)
  cookies[:color_uuid] = white_uuid
  @game = Game.new
  
  settings.games[uuid] = {
    game: @game,
    sockets: [],
    colors: {
      white: white_uuid,
      black: black_uuid
    },
    invitation_accepted: false
  }

  redirect "/game/#{uuid}"
end

get "/game/:uuid" do
  find_game
  find_or_set_player

  if !request.websocket?
    haml :show
  else
    websocket_handler
  end
end

def websocket_handler
  request.websocket do |ws|
    ws.onopen do
      # ws.send("Hello World!")
      @game_hash[:sockets] << ws
    end
    ws.onmessage do |msg|
      data = JSON.parse(msg)
      @move_result = @game.move(data["from"], data["to"], @player)
      
      EM.next_tick do
        @game_hash[:sockets].each do |s|
          s.send(@game.to_json)
        end
      end
    end
    ws.onclose do
      # warn("websocket closed")
      @game_hash[:sockets].delete(ws)
    end
  end
end

def find_game
  @uuid = params[:uuid]
  @game_hash = settings.games[params[:uuid]]
  redirect "/" unless @game_hash
  @game = @game_hash[:game]
end

def find_or_set_player
  if cookies[:color_uuid]
    @player = :white if @game_hash[:colors][:white] == cookies[:color_uuid]
    @player = :black if @game_hash[:colors][:black] == cookies[:color_uuid]
  else
    cookies[:color_uuid] = @game_hash[:colors][:black]
    @player = :black
  end
end



