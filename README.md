# othello-server
This is server for the board game Othello.<br />
I built this application to deepen my knowledge in Node.js and Socket.IO.

Check repository for [**client side application** (othello-client)](https://github.com/TsubasaFujii/othello-client)

## Server Events ##
|Event Name|Description|Data|
|---|---|---|
|``'user:ready'``|When client is connected to the server|``{ message: string }``|
|``'game:pending'``|When a user created a new game and waiting for an opponent to join|``{ message: string, code: string }``|
|``'game:not_found'``|When a game can't be found by the provided game code|``{ message: string }``|
|``'game:start'``|When a game has started|``{ board: array, order: array}``|
|``'game:ended'``|When a game has ended|``{ board: array }``|
|``'game:result'``|The result of the game|``{ result: string, hasWon: boolean }``|
|``'game:your_turn'``|When it's the user's turn|``{ board: array, available: array }``|
|``'game:opponent_turn'``|When it's the opponent's turn|``{ board: array }``|
|``'game:turn_skipped'``|When the user's turn is skipped because there is no place to put a disc |``{ board: array, message: string }``|
|``'user: disconnected'``|When the opponent is disconnected|``{ message: string }``|
|``'game:error'``|When an error occurs|``{ message: string }``|
||||


## Client Events ##
|Event Name|Description|Data|
|---|---|---|
|``'ready'``|When client is ready to connect to the server|---|
|``'new_game'``|When the user created a new game|---|
|``'join_game'``|When th user joins a game with game code|``{ code: string }``|
|``'ready_game'``|When the user is ready to play game|---|
|``'place_disc'``|When the user puts a disc|``{ row: number, col: number }``|
||||