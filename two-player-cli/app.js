const app = require('express')();
const server = require('http').createServer();
const io = require('socket.io')(server);

// Set up the original board matrix
let board = [
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-'],
];

// game object
let gameObject = {
  currentMark: 'X',
  nextMark: 'O',
  socketObject: {
    X: null,
    O: null
  }
};

function updateBoard(pos, mark) {
  if (pos[0] >= board.length || pos[1] >= board[0].length) return false;
  if (board[pos[0]][pos[1]] === '-') {
    board[pos[0]][pos[1]] = mark.toUpperCase();

    // Swap the marks
    gameObject.currentMark = gameObject.nextMark;
    gameObject.nextMark = mark;
    return true;
  }

  return false;
}

function checkRows(mark) {
  mark = mark.toUpperCase();
  for (let row = 0; row < 3; row++) {
    if (board[row][0] === mark && board[row][1] === mark && board[row][2] === mark) {
      return true;
    }
  }

  return false;
}

function checkColumn(mark) {
  mark = mark.toUpperCase();
  for (let column = 0; column < 3; column++) {
    if (board[0][column] === mark && board[1][column] === mark && board[2][column] === mark) {
      return true;
    }
  }

  return false;
}

function checkDiagnonals(mark) {
  if (board[0][0] == mark && board[1][1] === mark && board[2][2] === mark) {
    return true;
  }

  if (board[0][2] === mark && board[1][1] === mark && board[2][0] == mark) {
    return true;
  }

  return false;
}

function isWin(mark) {
  return checkRows(mark) || checkColumn(mark) || checkDiagnonals(mark);
}

function boardFull() {
  for (let row = 0; row < board.length; row++) {
    for (let column = 0; column < board[0].length; column++) {
      if (board[row][column] === '-') {
        return false;
      }
    }
  }

  return true;
}

function sendResponse(socket, res) {
  console.dir(socket);
  return socket.send(res);
}

function disconnect(socket) {
  return socket.disconnect();
}

function playGame() {
  const players = gameObject.socketObject;
  // Send latest board to each player
  Object.keys(players).forEach(player => {
    sendResponse(players[player], {
      type: 'baord',
      board
    });
  });

  // Game starts
  sendResponse(players[gameObject.currentMark], {
    type: 'mark',
    mark: gameObject.currentMark
  });

  Object.keys(players).forEach(player => {
    const socket = players[player];

    players[player].on('message', function (data) {
      if (data.type === 'position') {
        const mark = gameObject.currentMark;
        const isUpdated = updateBoard(data.pos, gameObject.currentMark);
        sendResponse(socket, {
          type: 'board',
          board
        });

        if (!isUpdated) {
            console.log(`The position is invalid, please try again.`);
            sendResponse(socket, {
              type: 'mark',
              mark: gameObject.currentMark
            });
          }

          if (isWin(mark)) {
            console.log(`${mark} win the game!`);
            sendResponse(players.X, {
              type: 'board',
              board
            });

            sendResponse(players.O, {
              type: 'board',
              board
            });

            disconnect(players.X);
            disconnect(players.O);

            return;
          }

          if (boardFull()) {
            console.log('Tie game!');
            sendResponse(players.X, {
              type: 'board',
              board
            });

            sendResponse(players.O, {
              type: 'board',
              board
            });

            disconnect(players.X);
            disconnect(players.O);

            return;
          }

          sendResponse(players[gameObject.currentMark], {
            type: 'board',
            board
          });

          sendResponse(players[gameObject.currentMark], {
              type: 'mark',
              mark: gameObject.currentMark
            });
        }
    });
  });
}


io.on('connection', function (socket) {
  console.log('Socket.io server is running');
  // Assign mark for sockets
  if (!gameObject.socketObject.X) {
    gameObject.socketObject.X = socket;
  } else if (!gameObject.socketObject.O){
    gameObject.socketObject.O = socket;
    playGame();
  } else {
    sendResponse(socket, {
      type: 'error',
      error: 'Game is full'
    });

    return disconnect(socket);
  }
});

server.listen(3000);

