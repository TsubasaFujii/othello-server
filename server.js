const Player = require('./JS/player');
const Game = require('./JS/game');

const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 4000;
const OPTIONS = {
    cors: {
        origin: process.env.CLIENT_URL,
        method: ['GET', 'POST'],
    },
    pingTimeout: 300,
};
const httpServer = createServer(app);
const io = new Server(httpServer, OPTIONS);

let games = [];

/////////////////////

app.get('/', (_, res) => {
    res.send('<p>The server is working.</p>')
});

/////////////////////

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
        console.log('\x1b[32m%s\x1b[0m', `${player.id} has joined to the game ${providedCode}. The game has started.`);

        const { values } = targetGame.board;
        io.in(providedCode).emit('game:start', ({
            board: values,
            order: targetGame.players
        }));
    });

    function notifyTurn() {
        const game = games.find(game => game.players.some(p => p.id === id));
        const {values} = game.board;

        if (game.isEnded()) {
            const {code} = game;
            io.in(code).emit('game:ended', {
                board: values,
            });
            console.log('\x1b[32m%s\x1b[0m', `The game [code: ${code}] has ended.`);

            const result = game.getGameResult();
            if (!result.win) {
                io.in(code).emit('game:result', {
                    result: 'Draw!',
                    hasWon: false,
                });
            } else {
                io.to(result.win).emit('game:result', {
                    result: 'You won.',
                    hasWon: true,
                });
                io.to(result.lose).emit('game:result', {
                    result: 'You lost.',
                    hasWon: false,
                });
            }

            games = games.filter(game => game.code !== code);
            console.log('\x1b[32m%s\x1b[0m', `The game code [code: ${code}] has removed.`);
            io.socketsLeave(code);
            return;
        }

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
        const targetGameCode = game.code;
        socket.to(targetGameCode).emit('user: disconnected', ({
            message: 'Opponent lost connection',
        }));
        games = games.filter(game => game.code !== targetGameCode);
    });
});

httpServer.listen(PORT);
console.log('\x1b[32m%s\x1b[0m', `Server is running on ${PORT}`);