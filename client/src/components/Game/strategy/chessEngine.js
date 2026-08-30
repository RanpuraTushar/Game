// chessEngine.js - High Performance Chess Evaluation & Minimax Engine

// Piece values in centipawns
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Piece-Square Tables (from White's perspective)
const PST_PAWN = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const PST_KNIGHT = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const PST_BISHOP = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const PST_ROOK = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

const PST_QUEEN = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const PST_KING_MIDDLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

const PST_TABLES = {
  p: PST_PAWN,
  n: PST_KNIGHT,
  b: PST_BISHOP,
  r: PST_ROOK,
  q: PST_QUEEN,
  k: PST_KING_MIDDLE
};

// Evaluate static position
export function evaluateBoard(game) {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -99999 : 99999;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
    return 0;
  }

  let totalEvaluation = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const type = piece.type;
        const color = piece.color;
        const baseValue = PIECE_VALUES[type];
        
        // Table index for White vs Black
        const tableIdx = color === 'w' ? (r * 8 + c) : ((7 - r) * 8 + c);
        const positionalBonus = PST_TABLES[type] ? PST_TABLES[type][tableIdx] : 0;

        const pieceTotal = baseValue + positionalBonus;
        if (color === 'w') {
          totalEvaluation += pieceTotal;
        } else {
          totalEvaluation -= pieceTotal;
        }
      }
    }
  }

  return totalEvaluation;
}

// Move ordering for Alpha-Beta efficiency
function orderMoves(game, moves) {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Capture score (MVV-LVA)
    if (a.captured) {
      scoreA += (PIECE_VALUES[a.captured] * 10) - PIECE_VALUES[a.piece];
    }
    if (b.captured) {
      scoreB += (PIECE_VALUES[b.captured] * 10) - PIECE_VALUES[b.piece];
    }

    if (a.promotion) scoreA += 800;
    if (b.promotion) scoreB += 800;

    return scoreB - scoreA;
  });
}

// Minimax with Alpha-Beta Pruning
function minimax(game, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const rawMoves = game.moves({ verbose: true });
  const moves = orderMoves(game, rawMoves);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false);
      game.undo();

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Beta cut-off
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true);
      game.undo();

      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha cut-off
    }
    return minEval;
  }
}

// Find best move based on chosen difficulty
export function getBestChessMove(game, difficulty = 'MEDIUM') {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  // 1. Easy: Fast & fun (Depth 1 with 30% random blunder chance)
  if (difficulty === 'EASY') {
    if (Math.random() < 0.35) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    return getMinimaxMove(game, 1);
  }

  // 2. Medium: Solid Club Player (Depth 2 Minimax)
  if (difficulty === 'MEDIUM') {
    return getMinimaxMove(game, 2);
  }

  // 3. Hard / Grandmaster: Depth 3 Minimax + Positional evaluation
  if (difficulty === 'HARD') {
    return getMinimaxMove(game, 3);
  }

  return getMinimaxMove(game, 2);
}

function getMinimaxMove(game, depth) {
  const isWhite = game.turn() === 'w';
  const rawMoves = game.moves({ verbose: true });
  const moves = orderMoves(game, rawMoves);

  let bestMove = moves[0];
  let bestValue = isWhite ? -Infinity : Infinity;

  for (const move of moves) {
    game.move(move);
    const value = minimax(game, depth - 1, -Infinity, Infinity, !isWhite);
    game.undo();

    if (isWhite) {
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    } else {
      if (value < bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }
  }

  return bestMove;
}
