class Square {
    constructor (row, col) {
        this.row = row;
        this.col = col;
        this.takenBy = null;
    }
    setTakenBy(value) {
        this.takenBy = value;
    }
}

module.exports = Square;