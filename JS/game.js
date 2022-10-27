const Board = require('./board');

class Game {
    currentPlayer = null;

    constructor(code, player1) {
        this.board = new Board();
        this.code = code;
        this.players = [player1];
    }

    start() {
        this.board.setInitialValues(this.players);
        this.currentPlayer = this.players[0];
    }

    addPlayer(player) {
        this.players.push(player);
    }

    getCurrentPlayerId() {
        return this.currentPlayer.id;
    }

    getOpponentPlayerId() {
        return this.players.find(player => player.id !== this.getCurrentPlayerId()).id;
    }

    switchCurrentPlayer() {
        this.currentPlayer = this.currentPlayer === this.players[0] ?
            this.players[1] : this.players[0];
    }

    placeDisc(newPosition) {
        const opponent = this.currentPlayer === this.players[0] ? this.players[1] : this.players[0];
        const flippers = this.board.getFlippers(opponent, newPosition);
        this.board.flipDisc(newPosition, flippers, this.currentPlayer);
    }

    getPossibleSquares() {
        const emptySquares = this.board.getEmptySquares();
        return emptySquares.reduce((result, square) => {
            const coordinate = {
                row: square.row,
                col: square.col,
            };
            const opponent = this.currentPlayer === this.players[0] ? this.players[1] : this.players[0];
            const possibleFlippers = this.board.getFlippers(opponent, coordinate);
            if (possibleFlippers.length > 0) {
                result.push(square);
            }
            return result;
        }, []);
    }

    isEnded() {
        return this.board.getEmptySquares().length === 0;
    }

    getGameResult() {
        const [{id: player1}, {id: player2}] = this.players;
        const result = this.board.values.reduce((sum, row) => {
            row.forEach(({takenBy}) => sum[takenBy.id]++);
            return sum;
        }, {
            [player1]: 0,
            [player2]: 0,
        });

        if (result[player1] === result[player2]) {
            return {
                win: null,
                lose: null,
            }
        }

        return {
            win: result[player1] > result[player2] ? player1 : player2,
            lose: result[player1] > result[player2] ? player2 : player1,
        };
    }
}

module.exports = Game;