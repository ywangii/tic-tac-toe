// websocket (e.g. rpc) remote procedure call
// the server prints the board (talking to terminal)
const prompt = require('prompt');

// Set up the original board matrix
let board = [
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-'],
];

function updateBoard(pos, mark) {
  if (board[pos[0]][pos[1]] === '-') {
    board[pos[0]][pos[1]] = mark.toUpperCase();
    return true;
  }

  return false;
}

function printBoard() {
  console.log(`${board[0][0]} | ${board[0][1]} | ${board[0][2]}`);
  console.log(`--------`);
  console.log(`${board[1][0]} | ${board[1][1]} | ${board[1][2]}`);
  console.log(`--------`);
  console.log(`${board[2][0]} | ${board[2][1]} | ${board[2][2]}`);
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

function switchPlayer(player) {
  console.log('It\'s your turn now, please choose your position');
  // X
  // O
  printBoard();

  prompt.get(['row', 'column'], (err, result) => {
    if (err) return console.error('Error happens when get the user input');

    const isUpdated = updateBoard([result.row, result.column], player);

    if (!isUpdated) {
      console.log(`The position has a mark, please try again.`);
      return switchPlayer(player);
    }

    if (isWin(player)) {
      console.log(`${player} win the game!`);
      printBoard();
      process.exit();
    }

    if (boardFull()) {
      console.log('Tie game!');
      printBoard();
      process.exit();
    }

    player === 'X' ? switchPlayer('O') : switchPlayer('X');
  });
}

function startGame() {
  console.log('Let\'s start a new game!');
  console.log('=======================\n');

  prompt.start();

  switchPlayer('X');
}

startGame();

