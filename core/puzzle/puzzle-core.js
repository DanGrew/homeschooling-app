export function derivePieces(grid) {
  const pieces = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      pieces.push({ id: `p_r${r}_c${c}`, correct: { row: r, col: c } });
    }
  }
  return pieces;
}

export function shufflePieces(pieces) {
  const arr = [...pieces];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function checkPlacement(piece, cell) {
  return piece.correct.row === cell.row && piece.correct.col === cell.col;
}

export function isComplete(placements, total) {
  return Object.values(placements).filter(p => p.correct).length === total;
}

if (typeof module !== 'undefined') module.exports = { derivePieces, shufflePieces, checkPlacement, isComplete };
