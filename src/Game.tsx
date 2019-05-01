import React, { Component } from "react";
import "./game.scss";

interface Props {}
interface State {
  board: Array<Array<Square>>,
  turn: Square,
  showHints: boolean
}

enum Square {
  EMPTY,
  WHITE,
  BLACK
}

class Game extends Component<Props, State> {
  private readonly BOARD_WIDTH : number = 6;
  private readonly BOARD_HEIGHT : number = 6;
  private readonly DIRECTIONS : {x: number, y: number}[] = [
    { x: 1, y: 0 }, // right
    { x: 1, y: -1 }, // up and right
    { x: 0, y: -1 }, // up
    { x: -1, y: -1 }, // up and left
    { x: -1, y: 0 }, // left
    { x: -1, y: 1 }, // down and left
    { x: 0, y: 1 }, // down
    { x: 1, y: 1 }, // down and right
  ];

  // private static isLegalMove : (x: number, y: number) => boolean;
  private static turnCount : (x: number, y: number, player: Square) => number;

  constructor(props: Props) {
    super(props);

    const board = this.getInitialBoard();

    this.state = {
      board,
      turn: Square.WHITE,
      showHints: false
    }
  }

  updateSquare = (x: number, y: number) => {
    const turnCount = this.turnCount(x, y, this.state.turn);

    const { board } = { ... this.state };

    if (turnCount && board[y][x] === Square.EMPTY) {
      this.setState(prevState => {
        let { turn } = prevState;

          board[y][x] = turn;

          turn = this.otherPlayer(turn);

        return { board, turn };
      }, () => turnCount ? this.turnPieces(x, y, this.otherPlayer(this.state.turn)) : null);
    }
  };

  computerMove = (player: Square) => {
    const possibleMoves = this.getMoves(player);
    if (possibleMoves.length) {
      possibleMoves.sort((a, b) => b.count - a.count);
      const chosenMove = possibleMoves[0];
      this.updateSquare(chosenMove.x, chosenMove.y);
    }
  };

  getMoves = (player: Square) => {
    //Build list of squares that can be moved in and their respective turn counts
    const { board } = this.state;
    const possibleMoves : {x: number, y: number, count: number}[] = [];
    board.forEach((row, y) => {
      row.forEach((square, x) => {
        if (board[y][x] === Square.EMPTY) {
          const squareTurnCount = this.turnCount(x, y, player);
          if (squareTurnCount) possibleMoves.push({x, y, count: squareTurnCount});
        }
      });
    });
    return possibleMoves;
  };

  turnCount = (x: number, y: number, player: Square) => {
    const { board } = this.state;
    const other = this.otherPlayer(player);
    const turnCoords : {x: number, y: number}[] = [];

    for (let direction of this.DIRECTIONS) {
      if ((x + direction.x) >= 0
        && (y + direction.y) >= 0
        && (x + direction.x) < this.BOARD_WIDTH
        && (y + direction.y) < this.BOARD_HEIGHT
        && board[y + direction.y][x + direction.x] === other) {
        for (let i=1; (
          (x + i * direction.x) >= 0
          && (y + i * direction.y) >= 0
          && (x + i * direction.x) < this.BOARD_WIDTH
          && (y + i * direction.y) < this.BOARD_HEIGHT
        ); i++) {
          let square = board[y + i * direction.y][x + i * direction.x];
          if (square === player) {
            for (let j = 0; j < i-1; j++) {
              turnCoords.push({ x: x + j * direction.x, y: y + j * direction.y });
            }
            break;
          } else if (square === Square.EMPTY) break;
        }
      }
    }

    return turnCoords.length;
  };

  turnPieces = (x: number, y: number, player: Square) => {
    const { board } = this.state;
    const other = this.otherPlayer(player);
    const turnCoords : {x: number, y: number}[] = [];

    for (let direction of this.DIRECTIONS) {
      if ((x + direction.x) >= 0
        && (y + direction.y) >= 0
        && (x + direction.x) < this.BOARD_WIDTH
        && (y + direction.y) < this.BOARD_HEIGHT
        && board[y + direction.y][x + direction.x] === other) {
        for (let i=1; (
          (x + i * direction.x) >= 0
          && (y + i * direction.y) >= 0
          && (x + i * direction.x) < this.BOARD_WIDTH
          && (y + i * direction.y) < this.BOARD_HEIGHT
        ); i++) {
          let square = board[y + i * direction.y][x + i * direction.x];
          if (square === player) {
            for (let j = 0; j < i; j++) {
              turnCoords.push({ x: x + j * direction.x, y: y + j * direction.y });
            }
            break;
          } else if (square === Square.EMPTY) break;
        }
      }
    }

    this.setState(prevState => {
      const { board } = { ...prevState };
      turnCoords.forEach(coordSet => {
        board[coordSet.y][coordSet.x] = player;
      });
      return { board };
    });
  };

  otherPlayer = (player: Square) => {
    return (player === Square.WHITE) ? Square.BLACK : Square.WHITE;
  };

  renderSquare = (square: Square, x: number, y: number) => {
    const { turn, showHints } = this.state;
    const turnCount = this.turnCount(x, y, turn);

    switch (square) {
      case Square.EMPTY: return showHints ? <span className="turnCount">{turnCount ? turnCount : null}</span> : null;
      case Square.WHITE: return <div className="piece piece-white" />;
      case Square.BLACK: return <div className="piece piece-black" />;
      default: break;
    }
  };

  countSquares = (player: Square) => {
    let count = 0;
    const { board } = this.state;
    board.forEach(row => {
      row.forEach(square => {
        if (square === player) count++;
      });
    });
    return count;
  };

  toggleShowHints = () => {
    this.setState(prevState => ({ showHints: !prevState.showHints }));
  };

  isGameOver = () => {
    return this.getMoves(this.state.turn).length === 0;
  };

  getInitialBoard = () => {
    const board = new Array(this.BOARD_HEIGHT)
      .fill(null)
      .map(() => new Array(this.BOARD_WIDTH)
        .fill(null)
        .map(() => Square.EMPTY));

    const midWidth = Math.floor(this.BOARD_WIDTH / 2);
    const midHeight = Math.floor(this.BOARD_HEIGHT / 2);

    board[midHeight - 1][midWidth - 1] = Square.WHITE;
    board[midHeight - 1][midWidth] = Square.BLACK;
    board[midHeight][midWidth - 1] = Square.BLACK;
    board[midHeight][midWidth] = Square.WHITE;

    return board;
  };

  restartGame = () => {
    const board = this.getInitialBoard();

    this.setState({
      board,
      turn: Square.WHITE
    })
  };

  render() {
    const { board, turn, showHints } = this.state;

    const isGameOver = this.isGameOver();
    const squareCountWhite = this.countSquares(Square.WHITE);
    const squareCountBlack = this.countSquares(Square.BLACK);

    const boardDisplay = board.map((row: Array<Square>, y: number) =>
      <div key={y} className="row">
        {row.map((square: Square, x: number) => (
            <div key={String(y) + "-" + String(x)} className="square" onClick={() => this.updateSquare(x, y)}>{this.renderSquare(square, x, y)}</div>
        ))}
      </div>
    );

    return (
      <div id="game">
        <div id="heading">
          <div className={`squareCount` + ((turn === Square.WHITE) ? ` squareCountActive` : ``)}>{this.renderSquare(Square.WHITE, 0, 0)} {this.countSquares(Square.WHITE)}</div>
          <div className={`squareCount` + ((turn === Square.BLACK) ? ` squareCountActive` : ``)}>{this.renderSquare(Square.BLACK, 0, 0)} {this.countSquares(Square.BLACK)}</div>
          <div><button onClick={this.toggleShowHints}>{showHints ? "Hide" : "Show"} Hints</button></div>
          <div><button onClick={()=>this.computerMove(turn)}>Computer Move</button></div>
          <div><button onClick={this.restartGame}>Restart</button></div>
        </div>
        {boardDisplay}
        <div>{isGameOver ? "Game Over" : null}</div>
        <div>{isGameOver ? (squareCountWhite > squareCountBlack ? "Player 1 wins" : "Player 2 wins") : null}</div>
      </div>
    )
  }
}

export default Game;