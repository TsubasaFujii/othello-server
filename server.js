const Player = require('./JS/player');
const Game = require('./JS/game');

const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;
const options = {
    cors: {
        origin: [process.env.CLIENT_URL],
        method: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 300,
};
const games = [];

const httpServer = createServer();
const io = new Server(httpServer, options);

io.on('connection', (socket) => {
    const id = socket.id;
    const player = new Player(id);

    socket.on('ready', () => {
        console.log('\x1b[32m%s\x1b[0m', `A new player is connected. [id: ${id}]`);
        socket.emit('user:ready', {
            message: 'You are connected to the server'
        })
    });

    // Comes in as first player
    socket.on('new_game', () => {
        let newCode;
        do {
            newCode = Math.floor(1000 + Math.random() * 9000).toString();
        } while (games.some(game => game.code === newCode))

        const game = new Game(newCode, player);
        games.push(game);
        socket.join(newCode);
        console.log('\x1b[32m%s\x1b[0m', `A new game is created by ${id}. [code: ${newCode}]`);

        socket.emit('game:pending', {
            message: 'Waiting for the opponent',
            code: newCode
        });
    });

    // Comes in as second player with a game code
    socket.on('join_game', (data) => {
        if (!data?.code) {
            socket.emit('game:error', {
                message: 'Expected game code but didn\'t receive it.'
            });
        }

        const providedCode = data.code;
        const targetGame = games.find(game => game.code === providedCode);
        if (!targetGame) {
            socket.emit('game:not_found', {
                message: 'Couldn\'t find the game with the provided code.'
            });
            return;
        }

        targetGame.addPlayer(player);
        targetGame.start();
        socket.join(providedCode);

        const { values } = targetGame.board;
        io.in(providedCode).emit('game:start', ({
            board: values,
            order: targetGame.players
        }));
    });

    function notifyTurn() {
        const game = games.find(game => game.players.some(p => p.id === id));
        if (game.isEnded()) {
            io.in(game.code).emit('game:ended', ({
                result: game.getGameResult()  
            }));
        }

        const {values} = game.board;
        
        io.to(game.getOpponentPlayerId()).emit('game:opponent_turn', {
            board: values,
        });

        const potentials = game.getPossibleSquares();
        const currentPlayerId = game.getCurrentPlayerId();
        if (potentials.length === 0) {
            io.to(currentPlayerId).emit('game:turn_skipped', {
                board: values,
                message: 'There is no squares that you can place a disc. Your turn will be skipped.',
            });
            // should wait for event emit from the user
            game.switchCurrentPlayer();
            notifyTurn();
        } else {
            io.to(currentPlayerId).emit('game:your_turn', {
                board: values,
                available: potentials,
            });
        }
    }

    socket.on('ready_game', () => {
        notifyTurn();
    });

    socket.on('place_disc', (newPosition) => {
        const game = games.find(game => game.players.some(p => p.id === id));
        if (!game) {
            socket.emit('game:error', {
                message: 'Server error. Please start a new game.'
            });
        }
        const currentPlayer = game.getCurrentPlayerId();
        if (id !== currentPlayer) {
            socket.emit('game:error', {
                message: 'It\s your opponent\s turn.'
            });
        } else {
            game.placeDisc(newPosition);
            game.switchCurrentPlayer();
            notifyTurn();
        }
    });

    socket.on('disconnect', () => {
        const game = games.find(game => game.players.some(p => p.id === id));
        if (!game) return;
        const targetGameCode =game.code;
        socket.to(targetGameCode).emit('user: disconnected', ({
            message: 'Opponent lost connection',
        }));
        games.splice(games.indexOf(game => game.code === targetGameCode), 1);
        
    });
});

httpServer.listen(PORT);
console.log('\x1b[32m%s\x1b[0m', `Server is running on ${PORT}`);