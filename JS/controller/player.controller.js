const { add } = require('../model/player.model')

function addPlayer(id) {
    add({
        id: id
    });
}

module.exports = {
    addPlayer,
}