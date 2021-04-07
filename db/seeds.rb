records = Dir.glob("chessdb/**/*")

file = records[0]

# double quote regexp
REGEXP = /"(.*?)"/

ChessHistory.delete_all

def import_arr(arr)
  game = arr[0].split("\n")
  pgn = arr[1].gsub("\n", " ")
  attrs = {
    event: game[0][REGEXP, 1],
    white_user: game[3][REGEXP, 1],
    black_user: game[4][REGEXP, 1],
    result: game[5][REGEXP, 1],
    white_elo: game[6][REGEXP, 1],
    black_elo: game[7][REGEXP, 1],
    opening: game[9][REGEXP, 1],
    termination: game[13][REGEXP, 1],
    pgn: pgn
  }
  ChessHistory.create(attrs)
end

records.each do |file|
  data = File.read(file).split(/\n{2,}/).each_slice(2)
  data.each do |arr|
    import_arr(arr)
  end
end