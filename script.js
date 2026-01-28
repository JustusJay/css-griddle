/**
 * Slide Puzzle Game Logic
 * Handles grid state, movement, timer, and win conditions.
 */

class SlidePuzzle {
    constructor() {
        this.boardSize = 4;
        this.tiles = []; // 1-15, 0 representing empty
        this.emptyIndex = 15;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.isPlaying = false;

        // DOM Elements
        this.boardEl = document.getElementById('game-board');
        this.moveCountEl = document.getElementById('move-count');
        this.timerEl = document.getElementById('timer');
        this.resetBtn = document.getElementById('reset-btn');
        this.winModal = document.getElementById('win-modal');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.finalMovesEl = document.getElementById('final-moves');
        this.finalTimeEl = document.getElementById('final-time');

        this.init();
    }

    init() {
        this.bindEvents();
        this.startNewGame();
    }

    bindEvents() {
        this.resetBtn.addEventListener('click', () => this.startNewGame());
        this.playAgainBtn.addEventListener('click', () => {
            this.hideWinModal();
            this.startNewGame();
        });
    }

    startNewGame() {
        this.resetState();
        this.generateSolvedBoard();
        this.shuffleBoard();
        this.renderBoard();
        this.startTimer();
    }

    resetState() {
        this.moves = 0;
        this.timer = 0;
        this.isPlaying = true;
        this.updateStats();
        this.stopTimer();
    }

    generateSolvedBoard() {
        this.tiles = Array.from({ length: 16 }, (_, i) => (i + 1) % 16);
        this.emptyIndex = 15; // The last position is empty (0)
    }

    // Shuffle by simulating random valid moves to ensure solvability
    shuffleBoard() {
        let previousIndex = -1;
        const shuffleMoves = 1000;

        for (let i = 0; i < shuffleMoves; i++) {
            const validMoves = this.getValidMoves();
            // Try to avoid undoing the immediate last move for better shuffling
            const nextMoves = validMoves.filter(idx => idx !== previousIndex);
            
            // Fallback if we're stuck (shouldn't happen in open grid)
            const targetIndex = nextMoves.length > 0 
                ? nextMoves[Math.floor(Math.random() * nextMoves.length)]
                : validMoves[Math.floor(Math.random() * validMoves.length)];

            this.swapTiles(targetIndex, true); // true = silent (no sound/anim)
            previousIndex = this.emptyIndex; // The empty tile moves to targetIndex
        }
    }

    getValidMoves() {
        const moves = [];
        const row = Math.floor(this.emptyIndex / this.boardSize);
        const col = this.emptyIndex % this.boardSize;

        // Check Up
        if (row > 0) moves.push(this.emptyIndex - this.boardSize);
        // Check Down
        if (row < this.boardSize - 1) moves.push(this.emptyIndex + this.boardSize);
        // Check Left
        if (col > 0) moves.push(this.emptyIndex - 1);
        // Check Right
        if (col < this.boardSize - 1) moves.push(this.emptyIndex + 1);

        return moves;
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        
        this.tiles.forEach((value, index) => {
            const tile = document.createElement('div');
            
            // Common classes
            let classes = [
                'tile', 
                'flex', 'items-center', 'justify-center', 
                'text-xl', 'sm:text-2xl', 'font-bold', 
                'rounded-xl', 'cursor-pointer', 'select-none'
            ];

            if (value === 0) {
                // Empty tile
                classes.push('bg-transparent');
                tile.dataset.empty = 'true';
            } else {
                // Numbered tile
                classes.push(
                    'bg-white', 
                    'text-slate-700', 
                    'shadow-[0_2px_0_0_rgba(203,213,225,1)]', // shadow-slate-300
                    'border', 'border-slate-200',
                    'hover:-translate-y-0.5', 'hover:shadow-[0_4px_0_0_rgba(203,213,225,1)]'
                );
                tile.textContent = value;
                
                // Add correct position indicator (optional subtle visual cue)
                const correctIndex = (value - 1);
                if (index === correctIndex) {
                    classes.push('text-blue-600');
                }
            }

            tile.className = classes.join(' ');
            tile.onclick = () => this.handleTileClick(index);
            
            this.boardEl.appendChild(tile);
        });
    }

    handleTileClick(index) {
        if (!this.isPlaying) return;

        if (this.isAdjacent(index, this.emptyIndex)) {
            this.swapTiles(index);
            this.moves++;
            this.updateStats();
            this.renderBoard();
            this.checkWin();
        }
    }

    isAdjacent(idx1, idx2) {
        const row1 = Math.floor(idx1 / this.boardSize);
        const col1 = idx1 % this.boardSize;
        const row2 = Math.floor(idx2 / this.boardSize);
        const col2 = idx2 % this.boardSize;

        return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
    }

    swapTiles(targetIndex, silent = false) {
        [this.tiles[this.emptyIndex], this.tiles[targetIndex]] = 
        [this.tiles[targetIndex], this.tiles[this.emptyIndex]];
        this.emptyIndex = targetIndex;
    }

    checkWin() {
        const isWin = this.tiles.every((val, index) => {
            // Last tile should be 0, others should be index + 1
            if (index === 15) return val === 0;
            return val === index + 1;
        });

        if (isWin) {
            this.gameWon();
        }
    }

    gameWon() {
        this.isPlaying = false;
        this.stopTimer();
        this.showWinModal();
    }

    startTimer() {
        this.stopTimer();
        const startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const delta = Math.floor((Date.now() - startTime) / 1000);
            this.timer = delta;
            this.updateStats();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateStats() {
        this.moveCountEl.textContent = this.moves;
        this.timerEl.textContent = this.formatTime(this.timer);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showWinModal() {
        this.finalMovesEl.textContent = this.moves;
        this.finalTimeEl.textContent = this.formatTime(this.timer);
        
        this.winModal.classList.remove('hidden');
        this.winModal.classList.add('flex');
        
        // Small delay for animation
        setTimeout(() => {
            this.winModal.classList.remove('opacity-0');
            this.winModal.querySelector('div').classList.remove('scale-95');
            this.winModal.querySelector('div').classList.add('scale-100');
        }, 10);
    }

    hideWinModal() {
        this.winModal.classList.add('opacity-0');
        this.winModal.querySelector('div').classList.remove('scale-100');
        this.winModal.querySelector('div').classList.add('scale-95');
        
        setTimeout(() => {
            this.winModal.classList.remove('flex');
            this.winModal.classList.add('hidden');
        }, 300);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SlidePuzzle();
});