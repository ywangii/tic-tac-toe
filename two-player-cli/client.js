const socket = require('socket.io-client')('http://localhost:3000');
const prompt = require('prompt');

function printBoard(board) {
  console.log(`${board[0][0]} | ${board[0][1]} | ${board[0][2]}`);
  console.log(`--------`);
  console.log(`${board[1][0]} | ${board[1][1]} | ${board[1][2]}`);
  console.log(`--------`);
  console.log(`${board[2][0]} | ${board[2][1]} | ${board[2][2]}`);
}

function switchPlayer(player, cb) {
  console.log(`It's ${player}'s turn now, please choose your position`);

  prompt.get(['row', 'column'], (err, result) => {
    if (err) return console.error('Error happens when get the user input');

    return cb([result.row, result.column]);
  });
}

console.log('Let\'s start a new game!');
console.log('=======================\n');

prompt.start();


socket.on('connect', function(){
  console.log('Connecting to socket.io server');
});

socket.on('message', function(data){
  if (data.type === 'board') {
    printBoard(data.board);
  }

  if (data.type === 'mark') {
    switchPlayer(data.mark, function (pos) {
      socket.send({
        type: 'position',
        pos
      });
    });
  }

  if (data.type === 'error') {
    console.log(`Connection failed due to ${data.error}`);
  }
});

socket.on('disconnect', function(){});

