require "sinatra"
require "sinatra/reloader" if development?
require "pry"

require_relative "lib/game"
require_relative "lib/helper"

configure do
  set :games, {}
end

set :haml, format: :html5

get "/" do
  haml :index
end

get "/new" do
  uuid = SecureRandom.uuid
  @game = Game.new
  settings.games[uuid] = @game

  redirect "/game/#{uuid}"
end

get "/game/:uuid" do
  find_game
  haml :show
end

post "/game/:uuid" do
  find_game
  @move_result = @game.move(params[:from], params[:to])
  haml :show
end

get "/reset_server" do
  games = {}
end

def find_game
  @game = settings.games[params[:uuid]]
  redirect "/" unless @game
end