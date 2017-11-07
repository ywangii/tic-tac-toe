const express = require('express');
const app = express();
app.use(express.static('public'));
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Set up the original board matrix
let board = [
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
];

// game object
let gameObject = {
  currentMark: 'X',
  nextMark: 'O',
  socketObject: {
    X: null,
    O: null
  },
  board
};

function updateBoard(pos, currentGameObject) {
  let currentBoard = currentGameObject.board;
  const isValid = /^[0-2]$/.test(pos[0]) && /^[0-2]$/.test(pos[1]);

  if (!isValid) return false;
  if (currentBoard[pos[0]][pos[1]] === '-') {
    let temp = currentGameObject.currentMark;
    currentBoard[pos[0]][pos[1]] = temp.toUpperCase();

    // Swap the marks
    currentGameObject.currentMark = currentGameObject.nextMark;
    currentGameObject.nextMark = temp;
    return true;
  }

  return false;
}

function checkRows(mark, currentBoard) {
  mark = mark.toUpperCase();
  for (let row = 0; row < 3; row++) {
    if (currentBoard[row][0] === mark && currentBoard[row][1] === mark && currentBoard[row][2] === mark) {
      return true;
    }
  }

  return false;
}

function checkColumn(mark, currentBoard) {
  mark = mark.toUpperCase();
  for (let column = 0; column < 3; column++) {
    if (currentBoard[0][column] === mark && currentBoard[1][column] === mark && currentBoard[2][column] === mark) {
      return true;
    }
  }

  return false;
}

function checkDiagnonals(mark, currentBoard) {
  if (currentBoard[0][0] == mark && currentBoard[1][1] === mark && currentBoard[2][2] === mark) {
    return true;
  }

  if (currentBoard[0][2] === mark && currentBoard[1][1] === mark && currentBoard[2][0] == mark) {
    return true;
  }

  return false;
}

function isWin(mark, currentBoard) {
  return checkRows(mark, currentBoard) || checkColumn(mark, currentBoard) || checkDiagnonals(mark, currentBoard);
}

function boardFull(currentBoard) {
  for (let row = 0; row < currentBoard.length; row++) {
    for (let column = 0; column < currentBoard[0].length; column++) {
      if (currentBoard[row][column] === '-') {
        return false;
      }
    }
  }

  return true;
}

function sendResponse(socket, res) {
  return socket.send(res);
}

function disconnect(socket) {
  return socket.disconnect();
}

function requestTurn(currentGameObject, log1, log2) {
  const currentPlayer = currentGameObject.socketObject[currentGameObject.currentMark];
  const nextPlayer = currentGameObject.socketObject[currentGameObject.nextMark];
  sendResponse(currentPlayer, {
    type: 'mark',
    mark: currentGameObject.currentMark
  });
  sendResponse(currentPlayer, {
    type: 'log',
    log: log1
  });

  sendResponse(nextPlayer, {
    type: 'log',
    log: log2
  });
}

function playGame(currentGameObject) {
  const players = currentGameObject.socketObject;
  const log1 = 'It\'s your turn, please choose your position';
  const log2 = 'Waiting for the other play choosing his/her position.';
  // Send latest board to each player
  Object.keys(players).forEach(player => {
    sendResponse(players[player], {
      type: 'log',
      log: 'Let\'s start a new game!'
    });
    sendResponse(players[player], {
      type: 'board',
      board: currentGameObject.board
    });
  });

  // Game starts
  requestTurn(currentGameObject, log1, log2);

  Object.keys(players).forEach(player => {
    const socket = players[player];
    players[player].on('message', function (data) {
      if (data.type === 'position') {
        console.log(player + " - I received position");
        const mark = currentGameObject.currentMark;
        const isUpdated = updateBoard(data.pos, currentGameObject);
        sendResponse(players.X, {
          type: 'board',
          board: currentGameObject.board
        });

        sendResponse(players.O, {
          type: 'board',
          board: currentGameObject.board
        });

        if (!isUpdated) {
            console.log(`The position is invalid, please try again.`);
            sendResponse(socket, {
              type: 'log',
              log: 'The position is invalid, please try again.'
            });

            requestTurn(currentGameObject, log1, log2);
          }

          if (isWin(mark, currentGameObject.board)) {
            console.log(`${mark} win the game!`);
            sendResponse(players.X, {
              type: 'log',
              log: `${mark} win the game!`
            });
            sendResponse(players.O, {
              type: 'log',
              log: `${mark} win the game!`
            });
            sendResponse(players.X, {
              type: 'board',
              board: currentGameObject.board
            });
            sendResponse(players.O, {
              type: 'board',
              board: currentGameObject.board
            });

            disconnect(players.X);
            disconnect(players.O);

            return;
          }

          if (boardFull(currentGameObject.board)) {
            console.log('Tie game!');
            sendResponse(players.X, {
              type: 'log',
              log: `Tie game!`
            });
            sendResponse(players.O, {
              type: 'log',
              log: `Tie game!`
            });
            sendResponse(players.X, {
              type: 'board',
              board: currentGameObject.board
            });

            sendResponse(players.O, {
              type: 'board',
              board: currentGameObject.board
            });

            disconnect(players.X);
            disconnect(players.O);

            return;
          }

          sendResponse(players[currentGameObject.currentMark], {
            type: 'board',
            board: currentGameObject.board
          });


          requestTurn(currentGameObject, log1, log2);
        }
    });
  });
}


io.on('connection', function (socket) {
  // Repeatedly restart the connection
  // when board for O is failed to update.
  console.log('Socket.io server is running');
  // Assign mark for sockets
  let currentGameObject = gameObject;
  if (!currentGameObject.socketObject.X) {
    currentGameObject.socketObject.X = socket;
  } else if (!currentGameObject.socketObject.O){
    currentGameObject.socketObject.O = socket;
    playGame(currentGameObject);
    // reset the gameObject for different sessions
    gameObject = {
      currentMark: 'X',
      nextMark: 'O',
      socketObject: {
        X: null,
        O: null
      },
      board: [
        ['-', '-', '-'],
        ['-', '-', '-'],
        ['-', '-', '-']
      ]
    };
  } else {
    sendResponse(socket, {
      type: 'error',
      error: 'Game is full'
    });

    return disconnect(socket);
  }
});

server.listen(3000);

