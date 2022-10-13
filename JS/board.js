const Square = require('./square');

class Board {
    MAX_ROW_NUM = 8;
    MAX_COL_NUM = 8;
    constructor() {
        const newBoard = [...Array(8)].map((_, rowNum) =>
            Array.from({ length: 8 }, (_, colNum) => new Square(rowNum, colNum))
        );
        this.values = newBoard;
    }

    setInitialValues(players) {
        // White begin with D4, E5
        this.values[3][3].setTakenBy(players[0]);
        this.values[4][4].setTakenBy(players[0]);
        // Black begin with E4, D5
        this.values[3][4].setTakenBy(players[1]);
        this.values[4][3].setTakenBy(players[1]);
    }

    getFlippers(opponent, origin) {

        function getAdjacentEnemySquares(board, originPosition) {
            const { row, col } = originPosition;
            return board.reduce((result, currentRow, rowNum) => {
                let adjacentSquares = [];
                if (rowNum === row - 1 || rowNum === row + 1) {
                    adjacentSquares = currentRow.filter((square, index) => 
                        index > col - 2 && index < col + 2 && square.takenBy === opponent
                    );
                } else if (rowNum === row) {
                    adjacentSquares =  currentRow.filter((square, index) => 
                        (index === col - 1 || index === col + 1) && square.takenBy === opponent
                    );
                }
                return result.concat(adjacentSquares);
            }, []);
        }

        const potentialSquares = getAdjacentEnemySquares(this.values, origin);
        const flippers = potentialSquares.reduce((result, potentialSquare) => {
            const startRowNum = potentialSquare.row;
            const startColNum = potentialSquare.col;
            const yDirection = startRowNum - origin.row;
            const xDirection = startColNum - origin.col;

            let r = startRowNum;
            let c = startColNum;
            const temp = [];
            while (0 <= r && r < this.MAX_ROW_NUM && 0 <= c && c < this.MAX_COL_NUM) {
                if (this.values[r][c].takenBy === null) {
                    break;
                } else if (this.values[r][c].takenBy === opponent) {
                    temp.push(this.values[r][c]);
                } else {
                    return result.concat(temp);
                } 
                r += yDirection;
                c += xDirection;
            }

            return result;
        }, []);

        return flippers;
    }

    getEmptySquares() {
        return this.values.map(row => row.filter(square => !square.takenBy)).flat();
    }

    flipDisc(newPosition, flippers, currentPlayer) {
        const {row, col} = newPosition;
        flippers.forEach(({row, col}) => 
            this.values[row][col].setTakenBy(currentPlayer)
        );
        this.values[row][col].setTakenBy(currentPlayer);
    }
}

module.exports = Board;