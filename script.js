const importButton = document.getElementById('import-btn');
const resetButton = document.getElementById('reset-btn');
const solveButton = document.getElementById('solve-btn');
const algoRadioButtons = document.querySelectorAll('input[name="algo-radio-group"]');

const difficultyText = document.getElementById('difficulty-text');
const emptyFieldsText = document.getElementById('empty-fields-text');
const slider = document.getElementById('slider');
const generateButton = document.getElementById('generate-btn');

const solveTimeText = document.getElementById('solve-time-text');
const stepsPerFieldText = document.getElementById('steps-per-field-text');
const backtracksText = document.getElementById('backtracks-text');

const sudokuTable = document.getElementById('sudokuTable');
const boardCells = sudokuTable.querySelectorAll('input[type="text"]');
const rows = sudokuTable.querySelectorAll('tr');
const pattern = /^[1-9]$/;

let board;
let rowData, colData, boxData;
let emptyFieldsCount, startTime, endTime, stepsCount, backtracksCount;
let rowBitmask, colBitmask, boxBitmask;

// Validate cell value on input (1-9)
boardCells.forEach((cell) => {
    cell.addEventListener('input', () => {
        if (!pattern.test(cell.value)) {
            cell.value = '';
        }
    })
})

// #region Import
importButton.addEventListener('click', () => {
    // Create an input element of type "file"
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv'; // Only accept CSV files

    // Open file input on click event
    fileInput.click();

    // Event listener for file input change event
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        // Event listener for file reader load event
        reader.addEventListener('load', processFile);

        // Read the file as text
        reader.readAsText(file);
    })
})

// Function to process the loaded file
function processFile(event) {
    const csvData = event.target.result;

    // Parse the CSV data
    const rows = csvData.split('\n');
    const sudokuData = rows.map(row => row.split(','));

    // Get all the input elements within the Sudoku table
    const inputElements = document.querySelectorAll('#sudokuTable input[type="text"]');

    // Iterate over each input element and assign the corresponding value from the Sudoku data
    for (let i = 0; i < inputElements.length; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const cellValue = sudokuData[row][col];
        inputElements[i].value = pattern.test(cellValue) ? cellValue : '';
    }
}
// #endregion

// #region Reset
resetButton.addEventListener('click', () => {
    const confirmation = confirm("Are you sure you want to reset the board?");
    if (confirmation) {
        boardCells.forEach((cell) => {
            cell.value = '';
        });
    }
})
// #endregion

// #region Solve
solveButton.addEventListener('click', () => {
    initBoard();
    if (!isValidSudoku()) {
        return;
    }

    solve();
    displayBoard();
})

function initBoard() {
    board = [];
    emptyFieldsCount = 81;
    rows.forEach((row) => {
        const rowCells = row.querySelectorAll('input[type="text"]');
        const rowData = [];

        rowCells.forEach((cell) => {
            if (cell.value) {
                rowData.push(parseInt(cell.value, 10));
                emptyFieldsCount--;
            } else {
                rowData.push(0);
            }
        });
        board.push(rowData);
    });
}

function isValidSudoku() {
    if (emptyFieldsCount == 0) {
        alert('Sudoku is already solved!');
        return false;
    }

    if (emptyFieldsCount > 64) {
        alert('Sudoku must have at least 17 filled cells!');
        return false;
    }

    for (let i = 0; i < 9; i++) {
        let row = new Set();
        let col = new Set();
        let box = new Set();

        for (let j = 0; j < 9; j++) {
            let rowCell = board[i][j];
            let colCell = board[j][i];
            let boxCell = board[3 * Math.floor(i / 3) + Math.floor(j / 3)][3 * (i % 3) + (j % 3)];

            if (rowCell != 0) {
                if (row.has(rowCell)) {
                    alert('Sudoku does not have an unique solution! Duplicate number in row!');
                    return false;
                }
                row.add(rowCell);
            }
            if (colCell != 0) {
                if (col.has(colCell)) {
                    alert('Sudoku does not have an unique solution! Duplicate number in column!');
                    return false;
                }
                col.add(colCell);
            }
            if (boxCell != 0) {
                if (box.has(boxCell)) {
                    alert('Sudoku does not have an unique solution! Duplicate number in box!');
                    return false;
                }
                box.add(boxCell);
            }
        }
    }
    return true;
}

function solve() {
    let selectedRadioId = null;
    for (const radioButton of algoRadioButtons) {
        if (radioButton.checked) {
            selectedRadioId = radioButton.id;
            break;
        }
    }

    initStats();
    switch (selectedRadioId) {
        case 'radio1':
            solveBrute(board);
            break;
        case 'radio2':
            solveBrute2(board, 0, 0);
            break;
        case 'radio3':
            initBitmasks(board);
            solveBitmask(board, 0, 0);
            break;
        default:
            break;
    }
    logStats();
}

function initStats() {
    startTime = performance.now();
    stepsCount = 0;
    backtracksCount = 0;
}

function logStats() {
    endTime = performance.now();
    solveTimeText.textContent = (endTime - startTime).toFixed(1) + 'ms';
    stepsPerFieldText.textContent = (stepsCount / emptyFieldsCount).toFixed(1);
    backtracksText.textContent = backtracksCount;
}

function displayBoard() {
    rows.forEach((row, rowIndex) => {
        const rowCells = row.querySelectorAll('input[type="text"]');

        rowCells.forEach((cell, columnIndex) => {
            cell.value = board[rowIndex][columnIndex].toString();
        });
    });
}
// #endregion

// #region Solving Algorithms

// #region solveBrute
function solveBrute(board) {
    const emptyCell = findEmptyCell(board);
    if (!emptyCell) {
        return true; // Sudoku solved
    }

    const [row, col] = emptyCell;
    // Try filling the current cell with a valid value
    for (let num = 1; num <= 9; num++) {
        if (isValidMove(row, col, num)) {
            board[row][col] = num;
            stepsCount++;

            if (solveBrute(board)) {
                return true; // If this placement leads to a solution
            }

            // If not, backtrack
            board[row][col] = 0;
            backtracksCount++;
        }
    }

    return false; // No valid value found -> backtrack
}

function findEmptyCell(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                return [row, col];
            }
        }
    }
    return null; // No empty cells
}
// #endregion

// #region solveBrute v2
function solveBrute2(board, row, col) {
    if (row == 9 - 1 && col == 9) { // End of board reached
        return true;
    }

    if (col == 9) { // End of row reached, move to the next
        col = 0;
        row++;
    }

    if (board[row][col] !== 0) { // Skip filled cells
        return solveBrute2(board, row, col + 1);
    }

    // Try filling the current cell with a valid value
    for (let num = 1; num <= 9; num++) {
        if (isValidMove(row, col, num)) {
            board[row][col] = num;
            stepsCount++;

            if (solveBrute2(board, row, col + 1)) {
                return true; // If this placement leads to a solution
            }

            board[row][col] = 0;
            backtracksCount++;
        }
    }

    return false; // No valid value found -> backtrack
}
// #endregion

// #region solveBitmask
// Set inital board into bitmask arrays
function initBitmasks(board) {
    rowBitmask = new Array(9);
    colBitmask = new Array(9);
    boxBitmask = new Array(9);

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            rowBitmask[row] |= 1 << board[row][col];
            colBitmask[col] |= 1 << board[row][col];
            boxBitmask[getBox(row, col)] |= 1 << board[row][col];
        }
    }
}

function getBox(row, col) {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function solveBitmask(board, row, col) {
    if (row == 9 - 1 && col == 9) { // End of board reached
        return true;
    }

    if (col == 9) { // End of row reached, move to the next
        col = 0;
        row++;
    }

    if (board[row][col] !== 0) { // Skip filled cells
        return solveBitmask(board, row, col + 1);
    }

    // Try filling the current cell with a valid value
    for (let num = 1; num <= 9; num++) {
        if (isValidMoveBitmask(row, col, num)) {
            board[row][col] = num;
            stepsCount++;

            // Add num to each bitmask
            rowBitmask[row] |= 1 << num;
            colBitmask[col] |= 1 << num;
            boxBitmask[getBox(row, col)] |= 1 << num;

            if (solveBitmask(board, row, col + 1)) {
                return true; // If this placement leads to a solution
            }

            board[row][col] = 0;
            backtracksCount++;

            // Remove num from each bitmask
            rowBitmask[row] &= ~(1 << num);
            colBitmask[col] &= ~(1 << num);
            boxBitmask[getBox(row, col)] &= ~(1 << num);
        }
    }

    return false; // No valid value found -> backtrack
}
// #endregion

// #region Validity Check
function isValidMove(row, col, num) {
    return (
        isRowValid(row, num) &&
        isColumnValid(col, num) &&
        isBoxValid(row - (row % 3), col - (col % 3), num)
    );
}

function isRowValid(row, num) {
    return !board[row].includes(num);
}

function isColumnValid(col, num) {
    return !board.map((row) => row[col]).includes(num);
}

function isBoxValid(startRow, startCol, num) {
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            if (board[row + startRow][col + startCol] === num) {
                return false;
            }
        }
    }
    return true;
}

// Check if number is present in row, column and box bitmasks
function isValidMoveBitmask(row, col, num) {
    return !((rowBitmask[row] >> num) & 1)
        && !((colBitmask[col] >> num) & 1)
        && !((boxBitmask[getBox(row, col)] >> num) & 1);
}
// #endregion

// #endregion

// #region Generate
slider.addEventListener('input', () => {
    const sliderValue = parseInt(slider.value);

    if (sliderValue <= 49) {
        difficultyText.textContent = 'Easy';  // 32 to 41 clues
    } else if (sliderValue <= 54) {
        difficultyText.textContent = 'Medium';  // 27 to 31 clues
    } else {
        difficultyText.textContent = 'Hard';  // 22 to 26 clues
    }
    emptyFieldsText.textContent = sliderValue;
})

generateButton.addEventListener('click', () => {
    // Set all board cells to 0
    board = Array.from({ length: 9 },
        () => Array.from({ length: 9 },
            () => 0));

    fillDiagonal();
    fillRemaining(0, 3);
    removeDigits();
    displayBoard();
})

// Fill the cells in all 3 diagonal boxes
function fillDiagonal() {
    for (let i = 0; i < 9; i += 3) {
        fillBox(i, i);
    }
}

function fillBox(row, col) {
    let numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    let index = 0; // To keep track of the shuffled numbers
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            board[row + i][col + j] = numbers[index++];
        }
    }
}

// Helper function to shuffle an array using the Fisher-Yates shuffle algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

function fillRemaining(row, col) {
    if (row === 9 - 1 && col === 9) { // End of board reached
        return true;
    }

    if (col === 9) { // End of row reached, move to the next
        row += 1;
        col = 0;
    }

    if (board[row][col] !== 0) {
        return fillRemaining(row, col + 1);
    }

    // Try filling the current cell with a valid value
    for (let num = 1; num <= 9; num++) {
        if (isValidMove(row, col, num)) {
            board[row][col] = num;
            if (fillRemaining(row, col + 1)) {
                return true;
            }
            board[row][col] = 0;
        }
    }

    return false; // No valid value found -> backtrack
}

function removeDigits() {
    let count = parseInt(slider.value);

    while (count !== 0) {
        // Set board[row][col] as empty
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);
        if (board[row][col] !== "") {
            board[row][col] = "";
            count--;
        }
    }
    return;
}
// #endregion