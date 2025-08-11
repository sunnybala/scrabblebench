// insecure for public deployment! use this to run locally.
const OPENROUTER_KEY = ''

function downloadJSON(obj, filename = 'players.json') {
    const jsonStr = JSON.stringify(obj, null, 2); // Pretty print with 2-space indentation
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
}

function getModelFromURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        model1: urlParams.get('model1'),
        model2: urlParams.get('model2'),
        model3: urlParams.get('model3'),
        model4: urlParams.get('model4')
    };
}

function getTournamentFromURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tournament') === 'True';
}

function hasModelParamsInURL() {
    const urlModels = getModelFromURLParams();
    return urlModels.model1 || urlModels.model2 || urlModels.model3 || urlModels.model4;
}

function getModelIcon(modelString) {
    const modelIcons = {
        'openai': 'static/img/chatgpt.png',
        'x-ai': 'static/img/grok.png',
        'anthropic': 'static/img/claude.png',
        'google': 'static/img/gemini.png', 
        'deepseek': 'static/img/deepseek.png',
        'openrouter': 'static/img/openrouter.png', //default
    };
    
    if (!modelString) {
        return modelIcons['openrouter']; // default fallback
    }
    
    // Extract company prefix (everything before the first '/')
    const company = modelString.split('/')[0];
    
    // Return the icon for the company, or default to openrouter if not found
    return modelIcons[company] || modelIcons['openrouter'];
}

function getModelTileColor(modelString, isTournamentMode = false) {
    if (!isTournamentMode) {
        // Return default colors when not in tournament mode
        const defaultColors = ['white', '#da8d00', 'black', 'dodgerblue'];
        return defaultColors;
    }
    
    const modelColors = {
        'x-ai': 'black',
        'openai': 'white',
        'google': 'dodgerblue',
        'anthropic': '#da8d00',
        'deepseek': 'purple',
        'openrouter': 'purple', // default fallback
    };
    
    if (!modelString) {
        return 'purple'; // default fallback
    }
    
    // Extract company prefix (everything before the first '/')
    const company = modelString.split('/')[0];
    
    // Return the color for the company, or default to purple if not found
    return modelColors[company] || 'purple';
}

// Seeded random number generator using LCG algorithm
class SeededRandom {
    constructor(seed = 12345) {
        this.seed = seed;
    }
    
    // Linear congruential generator
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % (2 ** 32);
        return this.seed / (2 ** 32);
    }
    
    // Generate random number between 0 and max-1
    nextInt(max) {
        return Math.floor(this.next() * max);
    }
}

async function captureMainSectionAsPNG(filename = 'game_board.png') {
    try {
        const element = document.querySelector('.main-section');
        if (!element) {
            console.error('Main section element not found');
            return;
        }

        // Use html2canvas to capture the element
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher resolution
            useCORS: true,
            allowTaint: true
        });

        // Convert canvas to blob and download
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');

        console.log('Main section captured and downloaded as PNG');
    } catch (error) {
        console.error('Error capturing main section:', error);
    }
}

async function captureMainSectionAsBlob() {
    try {
        const element = document.querySelector('.main-section');
        if (!element) {
            console.error('Main section element not found');
            return null;
        }

        // Use html2canvas to capture the element
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher resolution
            useCORS: true,
            allowTaint: true
        });

        // Convert canvas to blob and return it
        return new Promise(resolve => {
            canvas.toBlob(function(blob) {
                resolve(blob);
            }, 'image/png');
        });
    } catch (error) {
        console.error('Error capturing main section:', error);
        return null;
    }
}

class ScrabbleGame {
    constructor() {
        this.board = Array(15).fill(null).map(() => Array(15).fill(null));
        this.boardState = Array(15).fill(null).map(() => Array(15).fill(null));
        // var free_model = 'google/gemini-2.0-flash-exp:free';
        // let free_model = 'google/gemma-3n-e4b-it:free';
        let defaultModel = 'google/gemini-2.0-flash-lite-001';
        
        // Get models from URL parameters
        const urlModels = getModelFromURLParams();
        console.log('URL Models:', urlModels);
        
        // Determine models for each player
        const player1Model = urlModels.model1 || defaultModel;
        const player2Model = urlModels.model2 || defaultModel;
        const player3Model = urlModels.model3 || defaultModel;
        const player4Model = urlModels.model4 || defaultModel;
        
        // Check if tournament mode is enabled
        const isTournamentMode = getTournamentFromURLParams();
        
        // Get tile colors - either based on model companies (tournament mode) or default colors
        let tileColors;
        if (isTournamentMode) {
            tileColors = [
                getModelTileColor(player1Model, true),
                getModelTileColor(player2Model, true),
                getModelTileColor(player3Model, true),
                getModelTileColor(player4Model, true)
            ];
        } else {
            tileColors = ['white', '#da8d00', 'black', 'dodgerblue'];
        }
        
        this.players = [
            {name: 'Player 1', tiles: [], score: 0, img: getModelIcon(player1Model), tilecolor: tileColors[0], model: player1Model},
            {name: 'Player 2', tiles: [], score: 0, img: getModelIcon(player2Model), tilecolor: tileColors[1], model: player2Model},
            {name: 'Player 3', tiles: [], score: 0, img: getModelIcon(player3Model), tilecolor: tileColors[2], model: player3Model},
            {name: 'Player 4', tiles: [], score: 0, img: getModelIcon(player4Model), tilecolor: tileColors[3], model: player4Model}
        ];
        
        console.log('Player models assigned:', this.players.map(p => ({ name: p.name, model: p.model })));
        
        // Initialize seeded random number generator for consistent tile dealing
        // Fixed seed for reproducible games
        this.rng = new SeededRandom(42); // self play seed
        
        this.currentPlayer = 0;
        this.tileBag = this.initializeTileBag();
        this.specialSquares = this.initializeSpecialSquares();
        this.placedTilesThisTurn = [];
        this.isFirstTurn = true;
        this.actionList = [];
        this.turnCount = 0;
        this.passCount =0;
        this.exportData = [];
        this.isTournamentMode = isTournamentMode;
        this.gameImages = {};
        
        this.init();
    }
    
    updateGameLog() {
        const gameLogElement = document.getElementById('game-log');
        if (!gameLogElement) return;
        
        gameLogElement.innerHTML = '';
        [...this.actionList].reverse().forEach((action, idx) => {
            const entry = document.createElement('div');
            entry.className = 'game-log-entry';
            if (idx === 0) entry.classList.add('latest-log');
            entry.textContent = action;
            gameLogElement.appendChild(entry);
        });
        
        // Auto-scroll to top
        gameLogElement.scrollTop = 0;
    }
    
    initializeTileBag() {
        const tiles = [];
        const letterDistribution = {
            'A': {'count': 9, 'points': 1},
            'B': {'count': 2, 'points': 3},
            'C': {'count': 2, 'points': 3},
            'D': {'count': 4, 'points': 2},
            'E': {'count': 12, 'points': 1},
            'F': {'count': 2, 'points': 4},
            'G': {'count': 3, 'points': 2},
            'H': {'count': 2, 'points': 4},
            'I': {'count': 9, 'points': 1},
            'J': {'count': 1, 'points': 8},
            'K': {'count': 1, 'points': 5},
            'L': {'count': 4, 'points': 1},
            'M': {'count': 2, 'points': 3},
            'N': {'count': 6, 'points': 1},
            'O': {'count': 8, 'points': 1},
            'P': {'count': 2, 'points': 3},
            'Q': {'count': 1, 'points': 10},
            'R': {'count': 6, 'points': 1},
            'S': {'count': 4, 'points': 1},
            'T': {'count': 6, 'points': 1},
            'U': {'count': 4, 'points': 1},
            'V': {'count': 2, 'points': 4},
            'W': {'count': 2, 'points': 4},
            'X': {'count': 1, 'points': 8},
            'Y': {'count': 2, 'points': 4},
            'Z': {'count': 1, 'points': 10},
            ' ': {'count': 2, 'points': 0}
        };
        
        for (const [letter, data] of Object.entries(letterDistribution)) {
            for (let i = 0; i < data.count; i++) {
                tiles.push({ letter, points: data.points });
            }
        }
        
        return this.shuffle(tiles);
    }
    
    initializeSpecialSquares() {
        const special = {};
        
        // Triple Word Score
        const tripleWord = [[0,0], [0,7], [0,14], [7,0], [7,14], [14,0], [14,7], [14,14]];
        tripleWord.forEach(([row, col]) => {
            special[`${row}-${col}`] = 'triple-word';
        });
        
        // Double Word Score
        const doubleWord = [[1,1], [2,2], [3,3], [4,4], [1,13], [2,12], [3,11], [4,10], 
                           [13,1], [12,2], [11,3], [10,4], [13,13], [12,12], [11,11], [10,10]];
        doubleWord.forEach(([row, col]) => {
            special[`${row}-${col}`] = 'double-word';
        });
        
        // Triple Letter Score
        const tripleLetter = [[1,5], [1,9], [5,1], [5,5], [5,9], [5,13], [9,1], [9,5], 
                             [9,9], [9,13], [13,5], [13,9]];
        tripleLetter.forEach(([row, col]) => {
            special[`${row}-${col}`] = 'triple-letter';
        });
        
        // Double Letter Score
        const doubleLetter = [[0,3], [0,11], [2,6], [2,8], [3,0], [3,7], [3,14], [6,2], 
                             [6,6], [6,8], [6,12], [7,3], [7,11], [8,2], [8,6], [8,8], 
                             [8,12], [11,0], [11,7], [11,14], [12,6], [12,8], [14,3], [14,11]];
        doubleLetter.forEach(([row, col]) => {
            special[`${row}-${col}`] = 'double-letter';
        });
        
        // Center star
        special['7-7'] = 'center';
        
        return special;
    }
    
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.rng.nextInt(i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    drawTiles(player, count) {
        const tiles = [];
        for (let i = 0; i < count && this.tileBag.length > 0; i++) {
            tiles.push(this.tileBag.pop());
        }
        return tiles;
    }
    
    init() {
        this.createBoard();
        this.initializePlayers();
        this.setupDragAndDrop();
        this.setupEndTurnButton();
        this.setupStartGameButton();
        this.updateCurrentPlayerDisplay();
    }
    
    createBoard() {
        const boardElement = document.getElementById('scrabble-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const specialType = this.specialSquares[`${row}-${col}`];
                if (specialType) {
                    cell.classList.add(specialType);
                    if (specialType === 'center') {
                        cell.textContent = '★';
                    } else if (specialType === 'triple-word') {
                        cell.textContent = '3W';
                    } else if (specialType === 'double-word') {
                        cell.textContent = '2W';
                    } else if (specialType === 'triple-letter') {
                        cell.textContent = '3L';
                    } else if (specialType === 'double-letter') {
                        cell.textContent = '2L';
                    }
                }
                
                boardElement.appendChild(cell);
            }
        }
    }
    
    initializePlayers() {
        this.players.forEach((player, index) => {
            const playerArea = document.querySelectorAll('.player-area')[index];
            const playerName = playerArea.querySelector('.player-name');
            const playerPortrait = playerArea.querySelector('.player-portrait');
            const scoreIndicator = playerArea.querySelector('.score-indicator');
            
            playerName.textContent = player.name;
            playerPortrait.style.backgroundImage = `url('${player.img}')`;
            playerPortrait.style.backgroundSize = 'cover';
            playerPortrait.style.backgroundPosition = 'center';
            // playerPortrait.style.borderColor = player.tilecolor;
            scoreIndicator.style.backgroundColor = player.tilecolor;
            
            player.tiles = this.drawTiles(player, 7);
            this.renderPlayerTiles(index);
        });
    }
    
    renderPlayerTiles(playerIndex) {
        // console.log(`Rendering tiles for player ${playerIndex}:`, this.players[playerIndex].tiles);
        const playerArea = document.querySelectorAll('.player-area')[playerIndex];
        const tileRack = playerArea.querySelector('.tile-rack');
        tileRack.innerHTML = '';
        
        this.players[playerIndex].tiles.forEach((tile, tileIndex) => {
            const tileElement = document.createElement('div');
            tileElement.className = 'tile';
            tileElement.draggable = playerIndex === this.currentPlayer;
            tileElement.dataset.letter = tile.letter;
            tileElement.dataset.points = tile.points;
            tileElement.dataset.player = playerIndex;
            tileElement.dataset.tileIndex = tileIndex;
            
            if (playerIndex !== this.currentPlayer) {
                tileElement.style.opacity = '0.6';
                tileElement.style.cursor = 'not-allowed';
            }
            
            const letterSpan = document.createElement('span');
            letterSpan.textContent = tile.letter === '_' ? '?' : tile.letter;
            tileElement.appendChild(letterSpan);
            
            if (tile.points > 0) {
                const scoreSpan = document.createElement('span');
                scoreSpan.className = 'tile-score';
                scoreSpan.textContent = tile.points;
                tileElement.appendChild(scoreSpan);
            }
            
            tileRack.appendChild(tileElement);
        });
        
        // Update player score display
        const scoreElement = playerArea.querySelector('.player-score span');
        if (scoreElement) {
            scoreElement.textContent = this.players[playerIndex].score;
        }
    }
    
    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('tile') && e.target.draggable) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    letter: e.target.dataset.letter,
                    points: e.target.dataset.points,
                    player: e.target.dataset.player,
                    tileIndex: e.target.dataset.tileIndex
                }));
            }
        });
        
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('tile')) {
                e.target.classList.remove('dragging');
            }
        });
        
        document.addEventListener('dragover', (e) => {
            if (e.target.classList.contains('board-cell') && !e.target.classList.contains('occupied')) {
                e.preventDefault();
                e.target.classList.add('drop-target');
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('board-cell')) {
                e.target.classList.remove('drop-target');
            }
        });
        
        document.addEventListener('drop', (e) => {
            if (e.target.classList.contains('board-cell') && !e.target.classList.contains('occupied')) {
                e.preventDefault();
                e.target.classList.remove('drop-target');
                
                const tileData = JSON.parse(e.dataTransfer.getData('text/plain'));
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                this.placeTile(row, col, tileData);
            }
        });
    }
    
    placeTile(row, col, tileData) {
        // Only allow current player to place tiles
        if (parseInt(tileData.player) !== this.currentPlayer) {
            return;
        }
        
        // Update board state
        this.board[row][col] = {
            letter: tileData.letter,
            points: parseInt(tileData.points),
            player: parseInt(tileData.player)
        };
        
        // Update board representation (use actual letter, not underscore)
        const displayLetter = tileData.letter === '_' ? '?' : tileData.letter;
        this.boardState[row][col] = displayLetter;
        
        // Track placed tiles for this turn
        this.placedTilesThisTurn.push({
            row, col, 
            letter: displayLetter,
            points: parseInt(tileData.points)
        });
        
        // Update board display
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('occupied');
        cell.innerHTML = '';
        
        console.log('placing tile...')
        const tileElement = document.createElement('div');
        tileElement.className = 'tile';
        tileElement.classList.add('new-tile');
        console.log(tileElement);
        const playerColor = this.players[parseInt(tileData.player)].tilecolor;
        tileElement.innerHTML = `
            <span>${displayLetter}</span>
            ${tileData.points > 0 ? `<span class="tile-score">${tileData.points}</span>` : ''}
            <div class="player-indicator" style="background-color: ${playerColor}; border-color: ${playerColor};"></div>
        `;
        cell.appendChild(tileElement);
        
        // Remove tile from player's rack
        const playerIndex = parseInt(tileData.player);
        const originalTileIndex = parseInt(tileData.tileIndex);
        
        // Remove the specific tile element from DOM first (prevents visual shuffle)
        const draggedElement = document.querySelector(`[data-player="${playerIndex}"][data-tile-index="${originalTileIndex}"]`);
        if (draggedElement) {
            draggedElement.remove();
        }
        
        // Find and remove the tile from the array by content
        const tileIndex = this.players[playerIndex].tiles.findIndex(tile => 
            tile.letter === tileData.letter && 
            tile.points === parseInt(tileData.points)
        );
        
        if (tileIndex !== -1) {
            this.players[playerIndex].tiles.splice(tileIndex, 1);
        }
        
        // Update the remaining tiles' indices in the DOM
        const playerArea = document.querySelectorAll('.player-area')[playerIndex];
        const remainingTiles = playerArea.querySelectorAll('.tile');
        remainingTiles.forEach((tileElement, index) => {
            tileElement.dataset.tileIndex = index;
        });
    }
    
    setupEndTurnButton() {
        const endTurnBtn = document.getElementById('end-turn-btn');
        endTurnBtn.addEventListener('click', () => {
            this.endTurn();
        });
    }
    
    setupStartGameButton() {
        const startGameBtn = document.getElementById('start-game-btn');
        startGameBtn.addEventListener('click', () => {
            startGame();
        });
    }
    
    endTurn() {
        this.renderPlayerTiles(this.currentPlayer);

        // Move to next player
        this.currentPlayer = (this.currentPlayer + 1) % 4;
        
        // Update displays
        this.updateCurrentPlayerDisplay();
        console.log(`Current player is now: ${this.players[this.currentPlayer].name}`);
        this.updatePlayerDisplays();
        if (this.isFirstTurn) {
            this.isFirstTurn = false;
        }
    }
    
    updateCurrentPlayerDisplay() {
        const currentPlayerName = document.getElementById('current-player-name');
        currentPlayerName.textContent = this.players[this.currentPlayer].name;
        
        const bagTilesCount = document.getElementById('bag-tiles-count');
        bagTilesCount.textContent = this.tileBag.length;
        
        // Update active player styling
        document.querySelectorAll('.player-area').forEach((area, index) => {
            if (index === this.currentPlayer) {
                area.classList.add('active');
            } else {
                area.classList.remove('active');
            }
        });
    }
    
    getWinner() {
        // Find the player with the highest score
        let maxScore = -1;
        let winnerIndex = 0;
        
        this.players.forEach((player, index) => {
            if (player.score > maxScore) {
                maxScore = player.score;
                winnerIndex = index;
            }
        });
        
        return winnerIndex;
    }
    
    highlightWinner() {
        const winnerIndex = this.getWinner();
        const currentPlayerName = document.getElementById('current-player-name');
        currentPlayerName.textContent = `${this.players[winnerIndex].name} WINS!`;
        
        // Remove all active classes and add winner class to the winner
        document.querySelectorAll('.player-area').forEach((area, index) => {
            area.classList.remove('active');
            if (index === winnerIndex) {
                area.classList.add('winner');
            } else {
                area.classList.remove('winner');
            }
        });
        
        console.log(`Winner: ${this.players[winnerIndex].name} with ${this.players[winnerIndex].score} points`);
    }
    
    updatePlayerDisplays() {
        this.players.forEach((player, index) => {
            this.renderPlayerTiles(index);
        });
    }

    shuffleTiles(tilesToExchange) {
        // Validate input
        if (!Array.isArray(tilesToExchange)) {
            console.log('Error: tilesToExchange must be an array');
            return false;
        }
        
        if (tilesToExchange.length === 0) {
            console.log('Error: Must specify at least one tile to exchange');
            return false;
        }
        
        if (tilesToExchange.length > this.players[this.currentPlayer].tiles.length) {
            console.log('Error: Cannot exchange more tiles than player has');
            return false;
        }
        
        // Check if tile bag has enough tiles for exchange
        if (tilesToExchange.length > this.tileBag.length) {
            console.log('Error: Not enough tiles remaining in bag for exchange');
            return false;
        }
        
        // Validate that player has all the tiles they want to exchange
        const currentPlayerTiles = this.players[this.currentPlayer].tiles.map(tile => tile.letter);
        const playerTilesCopy = [...currentPlayerTiles];
        
        for (const tileToExchange of tilesToExchange) {
            const tileIndex = playerTilesCopy.indexOf(tileToExchange);
            if (tileIndex === -1) {
                console.log(`Error: Player does not have tile: ${tileToExchange}`);
                return false;
            }
            playerTilesCopy.splice(tileIndex, 1);
        }
        
        // Perform the exchange
        const removedTiles = [];
        
        // Remove tiles from player's hand
        for (const tileToExchange of tilesToExchange) {
            const tileIndex = this.players[this.currentPlayer].tiles.findIndex(tile => tile.letter === tileToExchange);
            if (tileIndex !== -1) {
                const removedTile = this.players[this.currentPlayer].tiles.splice(tileIndex, 1)[0];
                removedTiles.push(removedTile);
            }
        }
        
        // Draw new tiles
        const newTiles = this.drawTiles(this.players[this.currentPlayer], tilesToExchange.length);
        this.players[this.currentPlayer].tiles.push(...newTiles);
        
        // Return exchanged tiles to bag and shuffle
        this.tileBag.push(...removedTiles);
        this.tileBag = this.shuffle(this.tileBag);
        
        console.log(`Successfully exchanged ${tilesToExchange.length} tiles: [${tilesToExchange.join(', ')}]`);
        
        // Update display
        this.renderPlayerTiles(this.currentPlayer);
        
        // End turn automatically
        this.currentPlayer = (this.currentPlayer + 1) % 4;
        this.updateCurrentPlayerDisplay();
        this.updatePlayerDisplays();
        
        return true;
    }
    
    playWord(start_x, start_y, word, direction) {
        // Validate direction
        if (direction !== 'right' && direction !== 'down') {
            console.log('Error: Direction must be "right" or "down"');
            return false;
        }
        
        // Validate word length and bounds
        if (direction === 'right' && start_x + word.length > 15) {
            console.log('Error: Word extends beyond board boundary');
            return false;
        }
        if (direction === 'down' && start_y + word.length > 15) {
            console.log('Error: Word extends beyond board boundary');
            return false;
        }
        
        // Check if player has required tiles
        const currentPlayerTiles = this.players[this.currentPlayer].tiles.map(tile => tile.letter);
        const requiredTiles = [];
        
        for (let i = 0; i < word.length; i++) {
            const letter = word[i].toUpperCase();
            let row = start_y;
            let col = start_x;
            
            if (direction === 'right') {
                col += i;
            } else {
                row += i;
            }
            
            // If position is already occupied, we don't need a tile for it
            if (this.boardState[row][col] !== null) {
                // Verify the existing letter matches what we need
                if (this.boardState[row][col] !== letter) {
                    console.log(`Error: Letter mismatch at position (${col}, ${row}). Expected ${letter}, found ${this.boardState[row][col]}`);
                    return false;
                }
            } else {
                console.log(`Adding required tile for letter "${letter}" at position (${col}, ${row})`);
                requiredTiles.push(letter);
            }
        }

        console.log(`Required tiles for word "${word}":`, requiredTiles);
        
        // Check if player has all required tiles
        const playerTilesCopy = [...currentPlayerTiles];
        for (const requiredLetter of requiredTiles) {
            const tileIndex = playerTilesCopy.indexOf(requiredLetter);
            if (tileIndex === -1) {
                // Check for blank tile
                const blankIndex = playerTilesCopy.indexOf(' ');
                if (blankIndex === -1) {
                    console.log(`Error: Player does not have required tile: ${requiredLetter}`);
                    return false;
                } else {
                    playerTilesCopy.splice(blankIndex, 1);
                }
            } else {
                playerTilesCopy.splice(tileIndex, 1);
            }
        }
        
        // Check intersection and adjacency rules
        let intersectsOrAdjacentToExistingTile = false;
        let touchesCenterOnFirstTurn = false;
        
        for (let i = 0; i < word.length; i++) {
            let row = start_y;
            let col = start_x;
            
            if (direction === 'right') {
                col += i;
            } else {
                row += i;
            }
            
            // Check if this position intersects an existing tile
            if (this.boardState[row][col] !== null) {
                intersectsOrAdjacentToExistingTile = true;
            } else {
                // Check if this tile position is adjacent to any existing tile
                const adjacentPositions = [
                    [row - 1, col],     // above
                    [row + 1, col],     // below
                    [row, col - 1],     // left
                    [row, col + 1]      // right
                ];
                
                for (const [adjRow, adjCol] of adjacentPositions) {
                    if (adjRow >= 0 && adjRow < 15 && adjCol >= 0 && adjCol < 15) {
                        if (this.boardState[adjRow][adjCol] !== null) {
                            intersectsOrAdjacentToExistingTile = true;
                            break;
                        }
                    }
                }
            }
            
            // Check if word touches center tile (7,7) on first turn
            if (this.isFirstTurn && row === 7 && col === 7) {
                touchesCenterOnFirstTurn = true;
            }
        }
        
        // Validate intersection rules
        if (this.isFirstTurn && !touchesCenterOnFirstTurn) {
            console.log('Error: First word must pass through the center tile (7,7)');
            return false;
        }
        
        if (!this.isFirstTurn && !intersectsOrAdjacentToExistingTile) {
            console.log('Error: Word must intersect with or be adjacent to at least one existing tile');
            return false;
        }
        
        // If we get here, the word is valid - place the tiles
        const turnScore = this.placeWordOnBoard(start_x, start_y, word, direction, requiredTiles);
        this.endTurn();
        return turnScore;
    }
    
    placeWordOnBoard(start_x, start_y, word, direction, requiredTiles) {
        document.querySelectorAll('.new-tile').forEach(el => el.classList.remove('new-tile'));
        const currentPlayerTiles = [...this.players[this.currentPlayer].tiles];
        let requiredTileIndex = 0;
        
        for (let i = 0; i < word.length; i++) {
            const letter = word[i].toUpperCase();
            let row = start_y;
            let col = start_x;
            
            if (direction === 'right') {
                col += i;
            } else {
                row += i;
            }
            
            // Only place tile if position is empty
            if (this.boardState[row][col] === null) {
                const requiredLetter = requiredTiles[requiredTileIndex];
                requiredTileIndex++;
                
                // Find and remove the tile from player's hand
                let tileToRemove = currentPlayerTiles.findIndex(tile => tile.letter === requiredLetter);
                if (tileToRemove === -1) {
                    // Use blank tile
                    tileToRemove = currentPlayerTiles.findIndex(tile => tile.letter === ' ');
                }
                
                const removedTile = currentPlayerTiles.splice(tileToRemove, 1)[0];
                
                // Update board state
                this.boardState[row][col] = letter;
                this.board[row][col] = {
                    letter: letter,
                    points: removedTile.points,
                    player: this.currentPlayer
                };
                
                // Update visual board
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.classList.add('occupied');
                cell.innerHTML = '';
                
                const tileElement = document.createElement('div');
                tileElement.className = 'tile';
                tileElement.classList.add('new-tile');
                const playerColor = this.players[this.currentPlayer].tilecolor;
                tileElement.innerHTML = `
                    <span>${letter}</span>
                    ${removedTile.points > 0 ? `<span class="tile-score">${removedTile.points}</span>` : ''}
                    <div class="player-indicator" style="background-color: ${playerColor}; border-color: ${playerColor};"></div>
                `;
                cell.appendChild(tileElement);
                
                // Track for scoring
                this.placedTilesThisTurn.push({
                    row, col,
                    letter: letter,
                    points: removedTile.points
                });
            }
        }
        
        // Update player's tiles (array was already modified in-place above)
        this.players[this.currentPlayer].tiles = currentPlayerTiles;
        
        // Re-render tiles to update the display with new indices
        // this.renderPlayerTiles(this.currentPlayer);
        
        // Calculate and add score immediately
        const turnScore = this.calculateTurnScore();
        this.players[this.currentPlayer].score += turnScore;
        
        // Update score display
        this.updatePlayerDisplays();
        
        // Draw new tiles to replace placed ones
        const tilesToDraw = this.placedTilesThisTurn.length;
        const newTiles = this.drawTiles(this.players[this.currentPlayer], tilesToDraw);
        this.players[this.currentPlayer].tiles.push(...newTiles);
        
        // Clear placed tiles for this turn
        this.placedTilesThisTurn = [];
        
        // Mark that first turn is complete
        if (this.isFirstTurn) {
            this.isFirstTurn = false;
        }

        return turnScore;
    }
    
    calculateTurnScore() {
        console.log('Calculating turn score...');
        console.log('Placed tiles this turn:', this.placedTilesThisTurn);
        
        if (this.placedTilesThisTurn.length === 0) {
            console.log('No tiles placed, returning 0');
            return 0;
        }
        
        // Find all words that contain newly placed tiles
        const wordsFormed = this.findWordsFormedThisTurn();
        // console.log('Words formed:', wordsFormed);
        
        let totalScore = 0;
        
        wordsFormed.forEach(word => {
            const wordScore = this.calculateWordScore(word);
            console.log(`Word score for "${word.tiles.map(t => t.letter).join('')}": ${wordScore}`);
            totalScore += wordScore;
        });
        
        // Bonus for using all 7 tiles (Bingo)
        if (this.placedTilesThisTurn.length === 7) {
            totalScore += 50;
            console.log('Bingo bonus: +50');
        }
        
        console.log('Total turn score:', totalScore);
        return totalScore;
    }
    
    findWordsFormedThisTurn() {
        const words = [];
        const newTilePositions = this.placedTilesThisTurn.map(tile => ({row: tile.row, col: tile.col}));
        const processedWords = new Set();
        
        // Check horizontal and vertical words for each newly placed tile
        console.log('newTilePositions:', newTilePositions);
        newTilePositions.forEach(pos => {
            // Check horizontal word
            // console.log(`Checking horizontal word at (${pos.row}, ${pos.col})`);
            const horizontalWord = this.getWordAtPosition(pos.row, pos.col, 'horizontal');
            // console.log('Horizontal word found:', horizontalWord, horizontalWord.tiles.length);
            if (horizontalWord.tiles.length > 1) {
                const wordKey = `${horizontalWord.startRow}-${horizontalWord.startCol}-horizontal`;
                if (!processedWords.has(wordKey)) {
                    words.push(horizontalWord);
                    processedWords.add(wordKey);
                }
            }
            
            // Check vertical word
            // console.log(`Checking vertical word at (${pos.row}, ${pos.col})`);
            const verticalWord = this.getWordAtPosition(pos.row, pos.col, 'vertical');
            // console.log('vertical word found:', verticalWord, verticalWord.tiles.length);
            if (verticalWord.tiles.length > 1) {
                const wordKey = `${verticalWord.startRow}-${verticalWord.startCol}-vertical`;
                if (!processedWords.has(wordKey)) {
                    words.push(verticalWord);
                    processedWords.add(wordKey);
                }
            }
        });
        
        return words;
    }
    
    getWordAtPosition(row, col, direction) {
        const word = {
            tiles: [],
            startRow: row,
            startCol: col,
            direction: direction
        };
        
        // Find start of word
        if (direction === 'horizontal') {
            while (word.startCol > 0 && this.boardState[row][word.startCol - 1] !== null) {
                word.startCol--;
            }
        } else {
            while (word.startRow > 0 && this.boardState[word.startRow - 1][col] !== null) {
                word.startRow--;
            }
        }
        
        // Collect all tiles in the word
        let currentRow = word.startRow;
        let currentCol = word.startCol;
        
        while (currentRow < 15 && currentCol < 15 && this.boardState[currentRow][currentCol] !== null) {
            const isNewTile = this.placedTilesThisTurn.some(tile => 
                tile.row === currentRow && tile.col === currentCol
            );
            
            word.tiles.push({
                row: currentRow,
                col: currentCol,
                letter: this.boardState[currentRow][currentCol],
                points: this.board[currentRow][currentCol] ? this.board[currentRow][currentCol].points : 1,
                isNew: isNewTile
            });
            
            if (direction === 'horizontal') {
                currentCol++;
            } else {
                currentRow++;
            }
        }
        
        return word;
    }
    
    calculateWordScore(word) {
        let wordScore = 0;
        let wordMultiplier = 1;
        
        word.tiles.forEach(tile => {
            let letterScore = tile.points;
            
            // Apply letter multipliers only for newly placed tiles
            if (tile.isNew) {
                const specialSquare = this.specialSquares[`${tile.row}-${tile.col}`];
                // console.log(`Tile at (${tile.row}, ${tile.col}) has special square: ${specialSquare}`);
                if (specialSquare === 'triple-letter') {
                    letterScore *= 3;
                } else if (specialSquare === 'double-letter') {
                    letterScore *= 2;
                } else if (specialSquare === 'triple-word') {
                    wordMultiplier *= 3;
                } else if (specialSquare === 'double-word'|| specialSquare === 'center') {
                    wordMultiplier *= 2;
                }
            }
            // console.log(`Adding letter score for ${tile.letter}: ${letterScore}`);
            wordScore += letterScore;
        });
        
        return wordScore * wordMultiplier;
    }
    
    async captureAndStoreGameImage(roundKey) {
        if (!this.isTournamentMode) return;
        
        try {
            console.log(`Capturing game image for round ${roundKey}`);
            const blob = await captureMainSectionAsBlob();
            if (blob) {
                this.gameImages[roundKey] = blob;
                console.log(`Image stored for round ${roundKey}`);
            }
        } catch (error) {
            console.error(`Error capturing image for round ${roundKey}:`, error);
        }
    }
    
    async downloadAllGameImages() {
        if (!this.isTournamentMode || Object.keys(this.gameImages).length === 0) return;
        
        console.log(`Converting ${Object.keys(this.gameImages).length} game images to base64`);
        
        const imagesBase64 = {};
        
        for (const [roundKey, blob] of Object.entries(this.gameImages)) {
            try {
                // Convert blob to base64
                const base64 = await this.blobToBase64(blob);
                imagesBase64[roundKey] = base64;
                console.log(`Converted round ${roundKey} image to base64`);
            } catch (error) {
                console.error(`Error converting round ${roundKey} image to base64:`, error);
            }
        }
        
        // Create JSON object with all images
        const gameImagesData = {
            tournament_images: imagesBase64,
            image_count: Object.keys(imagesBase64).length,
            timestamp: new Date().toISOString(),
            game_info: {
                total_turns: this.turnCount,
                players: this.players.map(p => ({ name: p.name, model: p.model, score: p.score }))
            }
        };
        
        // Download as JSON
        const timestamp = getTimestampStr();
        downloadJSON(gameImagesData, `${timestamp}_tournament_images.json`);
        
        console.log('All game images downloaded as JSON with base64 encoding');
    }
    
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
}

function printMatrix(matrix) {
  return matrix
    .map(row => row.map(cell => cell === null ? '-' : cell).join(' '))
    .join('\n');
}

async function getAIAction(priorAttempts=[]) {
    console.log('getAIAction called with prior attempts:', priorAttempts);
    if (priorAttempts.length > 5) {
        console.log('Too many prior attempts, forcing player to pass.');
        
        // Force pass turn
        let currentPlayer = window.game.currentPlayer;
        let initialTiles = [...window.game.players[currentPlayer].tiles];
        let playerName = window.game.players[currentPlayer].name;
        const isoTimestamp = new Date().toISOString();
        const preScore = window.game.players[window.game.currentPlayer].score;
        
        game.actionList.push(`Turn ${window.game.turnCount}| ${playerName} passed (too many attempts).`);
        game.updateGameLog();
        game.passCount += 1;
        
        // Add to export data
        game.exportData.push({
            player: playerName,
            initial_tiles: initialTiles.map(t => t.letter),
            action: 'pass',
            attempts: [...priorAttempts],
            timestamp: isoTimestamp,
            playerScorePre: preScore,
            actionScore: 0,
            wordPercentile: null, 
        });
        
        window.game.renderPlayerTiles(window.game.currentPlayer);

        // End turn automatically
        window.game.currentPlayer = (window.game.currentPlayer + 1) % 4;
        window.game.updateCurrentPlayerDisplay();
        window.game.updatePlayerDisplays();

        return 0;
    }

    let currentPlayer = window.game.currentPlayer;
    let initialTiles = [...window.game.players[currentPlayer].tiles];
    let prompt = buildPrompt(priorAttempts);
    let possibleWords = await getPossibleWords(currentPlayer);
    console.log('Possible words for AI:', Object.keys(possibleWords).length);

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${OPENROUTER_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: window.game.players[currentPlayer].model,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                reasoning: {"effort":"high", "enabled":true}
            }),
        });
        console.log('Response status:', response.status, 'OK:', response.ok);
        
        // Check if response is successful
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Check if response has content
        console.log('checking if there is text')
        const responseText = await response.text();
        if (!responseText) {
            throw new Error('Empty response from API');
        }
        
        // Try to parse JSON
        console.log('trying to parse json')
        let data;
        try {
            data = JSON.parse(responseText);
            console.log(data);
        } catch (parseError) {
            console.error('JSON parse error. Response text:', responseText);
            throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
        
        // Validate response structure
        if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid response structure:', data);
            throw new Error('API response missing expected structure');
        }
        let msg = data.choices[0].message.content.trim();
        console.log(`${window.game.players[currentPlayer].model} Response:`, msg);
        // msg = (msg.split('\n').slice(-3,)).join('\n');
        if (msg.includes('---')){
            msg = msg.split('----').slice(1).join('').trim()
        }
        console.log('AI Truncated Response:', msg);
        console.log('Possible words for AI #2:', Object.keys(possibleWords).length);
        let playerName = window.game.players[currentPlayer].name;

        const isoTimestamp = new Date().toISOString();
        const preScore = window.game.players[window.game.currentPlayer].score;

        if (msg.includes('playword')) {
            // let word_attempt = msg.split('playword')[1].trim().split('\n')[0].toLowerCase();
            let match = msg.match(/playword\s+(\w+)/);
            let word_attempt = match ? match[1] : null;
            if (possibleWords[word_attempt.toLowerCase()]) {
                let tiles = possibleWords[word_attempt.toLowerCase()].cells;
                console.log(`AI chose to play word: ${word_attempt} using`, tiles);
                let startx = tiles[0].x;
                let starty = tiles[0].y;
                let endx = tiles[tiles.length - 1].x;
                let endy = tiles[tiles.length - 1].y;
                let direction = (startx === endx) ? 'down' : 'right';

                // Calculate percentile based on possible words scores
                const allScores = Object.values(possibleWords).map(w => w.points).sort((a, b) => a - b);
                const playedWordScore = possibleWords[word_attempt.toLowerCase()].points;
                const rank = allScores.filter(score => score < playedWordScore).length;
                const percentile = allScores.length > 1 ? rank / (allScores.length - 1) : 1.0;
                
                const turnScore = playWord(startx, starty, word_attempt, direction);
                game.actionList.push(`Turn ${window.game.turnCount}| ${playerName} played word: ${word_attempt.toUpperCase()}.`);
                game.updateGameLog();
                game.passCount = 0;

                // Add to export data
                game.exportData.push({
                    player: playerName,
                    initial_tiles: initialTiles.map(t => t.letter),
                    action: `playword ${word_attempt}`,
                    attempts: [...priorAttempts],
                    timestamp: isoTimestamp,
                    playerScorePre: preScore,
                    actionScore: turnScore,
                    wordPercentile: percentile,
                    numPossibleWords: Object.keys(possibleWords).length, 
                });
                
                return 0;
            } else {
                console.log(`AI chose to play word: ${word_attempt}, but it is not a valid word.`);
                game.actionList.push(`Turn ${window.game.turnCount}| ${playerName} tried invalid word: ${word_attempt}.`);
                game.updateGameLog();
                priorAttempts.push(word_attempt);
                return await getAIAction(priorAttempts); // Retry with the new attempt
            }
        } else if (msg.includes('exchange')) {
            const exchangeMatch = msg.match(/exchange\s+([A-Z,]+)/i);
            if (exchangeMatch && exchangeMatch[1]) {
                const tilesToExchange = exchangeMatch[1].split(',').map(t => t.trim().toUpperCase());
                const playerLetters = window.game.players[currentPlayer].tiles.map(t => t.letter.toUpperCase());
                const validTilesToExchange = tilesToExchange.filter(letter => playerLetters.includes(letter));
                shuffleTiles(validTilesToExchange);
                game.actionList.push(`Turn ${window.game.turnCount}| ${playerName} exchanged: ${validTilesToExchange.join(',')}.`);
                game.updateGameLog();
                game.passCount = 0;
                
                // Add to export data
                game.exportData.push({
                    player: playerName,
                    initial_tiles: initialTiles.map(t => t.letter),
                    action: `exchange ${validTilesToExchange.join(',')}`,
                    attempts: [...priorAttempts],
                    timestamp: isoTimestamp,
                    playerScorePre: preScore,
                    actionScore: 0,
                    wordPercentile: null,
                    numPossibleWords: Object.keys(possibleWords).length,
                });
                
                return 0;
            }
        } else if (msg.includes('pass')) {
            game.actionList.push(`Turn ${window.game.turnCount}| ${playerName} passed.`);
            game.updateGameLog();
            game.passCount += 1;
            
            // Add to export data
            game.exportData.push({
                player: playerName,
                initial_tiles: initialTiles.map(t => t.letter),
                action: 'pass',
                attempts: [...priorAttempts],
                timestamp: isoTimestamp,
                playerScorePre: preScore,
                actionScore: 0,
                wordPercentile: null, 
                numPossibleWords: Object.keys(possibleWords).length,
            });
            
            window.game.renderPlayerTiles(window.game.currentPlayer);

            // End turn automatically
            window.game.currentPlayer = (window.game.currentPlayer + 1) % 4;
            window.game.updateCurrentPlayerDisplay();
            window.game.updatePlayerDisplays();

            return 0;
        }
    } catch (error) {
        console.error('API Error:', error);
        // if (response) {
        //     console.log('Response status:', response.status);
        //     console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        // }

        // Count API failures as invalid attempts
        priorAttempts.push(`API_ERROR'}`);
        console.log(`API error treated as invalid attempt. Prior attempts: ${priorAttempts.length}`);
        
        // Retry with the API error counted as an attempt
        return await getAIAction(priorAttempts);
    }
}

async function getPossibleWords(player) {
    let solverBoardState = window.game.boardState.map((row, y) =>
        row.map((cell, x) => ({
            y,
            x,
            isEmpty: cell === null,
            tile: cell === null ? null : {'character': cell.toLowerCase(), isBlank: false}
        }))
    );

    let playerLetters = window.game.players[player].tiles.map(t => t.letter.toLowerCase());
    
    try {
        const response = await fetch('/api/solver', {
            method: 'POST',
            headers: {
                'sec-ch-ua-platform': '"macOS"',
                'Referer': 'https://scrabble-solver.org/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
                'Content-Type': 'application/json',
                'sec-ch-ua-mobile': '?0'
            },
            body: JSON.stringify({
                'board': solverBoardState,
                'characters': playerLetters,
                'game': 'scrabble',
                'locale': 'en-US'
            })
        });
        const data = await response.json();
        let possibleWords = {};
        if (Array.isArray(data)) {
            data.forEach((item, idx) => {
                let word = item.cells.map(cell => cell.tile.character);
                word = word.join('');
                if (possibleWords[word] && (possibleWords[word].points > item.points)){
                    return;
                }
                possibleWords[word] = {
                    'points': item.points,
                    'cells': item.cells
                };
            });
            console.log('Possible Words:', possibleWords);
        } else {
            console.log('Solver response is not an array:', data);
        }
        return possibleWords;
    } catch (error) {
        console.error('Error fetching solver response:', error);
        return {};
    }
}

function groupByValue(obj) {
  const result = {};
  for (const [coord, value] of Object.entries(obj)) {
    if (!result[value]) {
      result[value] = [];
    }
    result[value].push(coord);
  }
  return result;
}

async function startGame(){
    // Capture initial game state (round 0) if in tournament mode
    await window.game.captureAndStoreGameImage(0);
    
    while (true){
        let res = await getAIAction();
        if (res === 1){
            console.log('AI action failed!');
            break;
        } else {
        }
        
        window.game.turnCount += 1;
        
        // Capture and store game image after the turn if in tournament mode
        await window.game.captureAndStoreGameImage(window.game.turnCount);
        

        if (window.game.passCount >= 4){
            console.log('Game over due to 4 consecutive passes.');
            window.game.actionList.push(`Game Over: 4 consecutive passes.`);
            window.game.updateGameLog();
            
            // Highlight the winner before downloading
            window.game.highlightWinner();
            
            // Small delay to ensure UI updates before screenshot
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Capture final game image with round+1 as key
            await window.game.captureAndStoreGameImage(window.game.turnCount + 1);
            
            await downloadGameData();
            break;
        }

        if (window.game.turnCount >= 60){
            console.log('Game over due to too many turns.');
            window.game.actionList.push(`Game Over: over 60 turns.`);
            window.game.updateGameLog();
            
            // Highlight the winner before downloading
            window.game.highlightWinner();
            
            // Small delay to ensure UI updates before screenshot
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Capture final game image with round+1 as key
            await window.game.captureAndStoreGameImage(window.game.turnCount + 1);
            
            await downloadGameData();
            break;
        }
    }    
}

function getTimestampStr() {
    const now = new Date();

    const pad = (num) => String(num).padStart(2, '0');

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);  // Months are zero-indexed
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

async function downloadGameData(){
        let ts = getTimestampStr();
        let output = {};
        output['players'] = window.game.players;
        output['actions'] = window.game.exportData;
        downloadJSON(output, ts+'_game.json');
        
        // Also capture the game board as PNG
        await captureMainSectionAsPNG(ts+'_game_board.png');
        
        // Download all game images if in tournament mode
        if (window.game.isTournamentMode) {
            window.game.downloadAllGameImages();
        }
}

function downloadExportData(){
        downloadJSON(window.game.exportData, 'game_export_data.json');
}

function buildPrompt(priorAttempts=[]){
    const game = window.game;
    const fullRules = `

You are playing Scrabble and it is your turn. The rules are:

2 to 4 players try to score the most points by forming words on a 15x15 board.

Players draw 7 tiles and take turns forming words.

There are 100 tiles: 98 letter tiles with points, and 2 blank wild tiles worth 0 points.

Letter point values:
0: blank
1: A, E, I, L, N, O, R, S, T, U
2: D, G
3: B, C, M, P
4: F, H, V, W, Y
5: K
8: J, X
10: Q, Z

Bonuses apply only the first time a tile is placed on them.
First player is the one who draws the letter closest to "A" (blank beats all). Tiles are then returned to the bag.
First word must go through the center star (double word score).

On a turn, a player can:
Play a word
Exchange tiles (turn ends)
Pass (turn ends; two passes in a row ends the game)

After playing, draw tiles to return to 7.
Using all 7 tiles in one turn earns a 50 point bonus.

Game ends when:
No tiles remain and four players pass consecutively.

Scoring:
Valid words are those found in a standard dictionary or Official Scrabble Dictionary.
Invalid words include abbreviations, prefixes/suffixes, capitalized words, and words with hyphens or apostrophes.
    `
    let prompt = fullRules+`\n\nCurrent Board:\n${printMatrix(game.boardState)}\n\n`;
    let placementRule = 'Must connect to existing words, and any words created by those connections must be valid.';
    if (game.isFirstTurn){
        placementRule = 'Must pass through the center tile (7,7) on first turn.';
    }

    let exchangeCommand = 'exchange A,B,C  (minimum 1 letter, maximum 7 letters, do not put spaces between commas)';
    let exchangeRule = `Exchange Tiles:
Swap any number of tiles from your rack with new ones from the bag. However, you forfeit your turn and earn 0 points.
`
    if (game.tileBag.length < 5){
        exchangeRule = `Pass Turn:
You may forfeit your turn.`;
        exchangeCommand = 'pass';
    }
    // prompt += `${JSON.stringify(this.game.boardState)}\n\n`;
    prompt += `Scores: ${game.players.map((p, i) => `Player ${i+1}: ${p.score}`).join(', ')}.\n`;
    prompt += `You are player ${game.currentPlayer+1}\n`;
    prompt += `Your Letters: ${game.players[game.currentPlayer].tiles.map(t => t.letter === ' ' ? 'blank' : t.letter).join(', ')}\n`;
    prompt += `Tile Bag: ${game.tileBag.length} tiles remaining.\n\n`;
    prompt += `Special Squares: ${JSON.stringify(groupByValue(game.specialSquares))}\n`;
    prompt += `The board indexes as col,row with 0,0 at the top left corner and 7,7 at the center.`;
    prompt += `

On Your Turn, You Can:
Play a Word:
Use 1 or more tiles from your rack to form a word in a straight line (horizontally or vertically).
${placementRule}
Score points for the word and any additional words formed.
${exchangeRule}
    `
    if (priorAttempts.length > 0){
        prompt += `\nInvalid Words:\n`;
        priorAttempts.forEach((attempt, index) => {
            prompt += `${attempt}\n`;
        });
    }

    prompt +=`
Only respond with a one brief three sentence justification and your best action in the following format, including dashes:
-------------------------
${exchangeCommand}
or
playword hello    (write the full word created)
-------------------------
    `;
    console.log(prompt);
    return prompt;
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ScrabbleGame();

    // Expose playWord and shuffleTiles functions globally for console access
    window.playWord = (start_x, start_y, word, direction) => {
        return window.game.playWord(start_x, start_y, word, direction);
    };
    
    window.shuffleTiles = (tilesToExchange) => {
        return window.game.shuffleTiles(tilesToExchange);
    };
    
    // Auto-start game if URL parameters are present
    if (hasModelParamsInURL()) {
        console.log('URL parameters detected, auto-starting game...');
        startGame();
    }
});