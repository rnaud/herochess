require "sinatra"
require "sinatra-websocket"
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
  uuid = SecureRandom.uuid
  @game = Game.new
  settings.games[uuid] = {game: @game, moves: [], sockets: []}

  redirect "/game/#{uuid}"
end

get "/game/:uuid" do
  find_game
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
      @move_result = @game.move(data["from"], data["to"])
      html = haml :game, layout: false

      EM.next_tick do
        @game_hash[:sockets].each do |s|
          s.send(html)
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