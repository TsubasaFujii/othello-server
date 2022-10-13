const db = require('../../db/knex');

async function add(id) {
    //db('Player').insert(id, ['id']);
    db('Player').insert(id);
}

module.exports = {
    add
}