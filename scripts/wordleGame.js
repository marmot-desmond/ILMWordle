import { supabase } from "./supabaseClient.js";

const gameState = {
    answer: null,
    puzzleDate: null,
    currentGuess: "",
    currentRow: 0,
    maxGuesses: 6,
    wordLength: 5,
    guesses: [],
    results: [],
    canGuess: false,
    startTime: null,
    endTime: null,
    outcome: null,
    letterStatuses: {}
};

function getDailyStorageKey(puzzleDate) {
    return `ilmwordle-${puzzleDate}`;
}

const gameStatus = document.querySelector("#game-status");

async function loadDailyPuzzle(){
    gameState.canGuess = false;

    const { data, error } = await supabase.rpc("get_or_create_daily_puzzle");

    if (error) {
        console.error(error);

        if (gameStatus) {
            gameStatus.textContent = "Could not load today's puzzle. Please ping Shaggy in the Discord.";
        }

        return;
    }

    if (!data || data.length === 0) {
        if (gameStatus) {
            gameStatus.textContent = "No daily puzzle found";
        }

        return;
    }

    const puzzle = data[0];

    gameState.answer = puzzle.word.toLowerCase();
    gameState.puzzleDate = puzzle.puzzle_date;

    const restored = restoreDailyProgress(gameState.puzzleDate);

    if (!restored){
        gameState.canGuess = true;
    }

    if (gameStatus) {
        gameStatus.textContent = `Daily puzzle ${puzzle.puzzle_date}`;
    }

}

const board = document.querySelector(".game-board");

const gameMessage = document.querySelector("#game-message");
const messageTitle = document.querySelector("#message-title");
const messageAnswer = document.querySelector("#message-answer");
const messageStats = document.querySelector("#message-stats");
const title = document.querySelector("#site-title");

const keyboard = document.querySelector(".keyboard");

const keyboardRows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "Backspace"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "Enter"],
    ["z", "x", "c", "v", "b", "n", "m"]
];

for (let row = 0; row < gameState.maxGuesses; row++){
    const guessRow = document.createElement("div");
    guessRow.classList.add("guess-row");

    for (let col = 0; col < gameState.wordLength; col++){
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.dataset.row = row;
        tile.dataset.col = col;
        guessRow.appendChild(tile);
    }

    board.appendChild(guessRow);
}

for (let keyRow = 0; keyRow < keyboardRows.length; keyRow++){
    const keyboardRow = document.createElement("div");
    keyboardRow.classList.add("keyboard-row");

    for (let i = 0; i < keyboardRows[keyRow].length; i++){
        const keyValue = keyboardRows[keyRow][i]
        const key = document.createElement("button");
        key.classList.add("key");
        key.dataset.key = keyValue;
        key.textContent = keyValue;

        key.addEventListener("mousedown", () => {
            handleInput(keyValue);
        });

        keyboardRow.appendChild(key);
    }

    keyboard.appendChild(keyboardRow);
}

loadDailyPuzzle();

function saveDailyProgress() {
    if (!gameState.puzzleDate) {
        return;
    }

    const saveData = {
        puzzleDate: gameState.puzzleDate,
        guesses: gameState.guesses,
        results:gameState.results,
        currentRow: gameState.currentRow,
        canGuess: gameState.canGuess,
        startTime: gameState.startTime,
        endTime: gameState.endTime,
        outcome: gameState.outcome
    };

    localStorage.setItem(
        getDailyStorageKey(gameState.puzzleDate),
        JSON.stringify(saveData)
    );
}

function restoreDailyProgress(puzzleDate) {
    const saved = localStorage.getItem(getDailyStorageKey(puzzleDate));

    if (!saved) {
        return false;
    }

    const saveData = JSON.parse(saved);

    if (saveData.puzzleDate !== puzzleDate) {
        return false;
    }

    gameState.guesses = saveData.guesses || [];
    gameState.results = saveData.results || [];
    gameState.currentRow = saveData.currentRow || 0;
    gameState.startTime = saveData.startTime || null;
    gameState.endTime = saveData.endTime || null;
    gameState.outcome = saveData.outcome || null;
    // fallback
    if (!gameState.outcome){
        const solved = gameState.guesses.includes(gameState.answer);

        if (solved) {
            gameState.outcome = "win";
        } else if (gameState.guesses.length >= gameState.maxGuesses) {
            gameState.outcome = "fail";
        }
    }
    gameState.currentGuess = "";
    gameState.letterStatuses = {};

    for (let row = 0; row < gameState.guesses.length; row++){
        const guess = gameState.guesses[row];
        const result = gameState.results[row];

        for (let col = 0; col < guess.length; col++) {
            const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

            tile.textContent = guess[col].toUpperCase();
            tile.classList.add(result[col]);
        }

        updateKeyboardStatus(guess, result);
    }

    if (gameState.outcome === "win" || gameState.outcome === "fail"){
        gameState.canGuess = false;

        const secondsTaken = Math.floor((gameState.endTime - gameState.startTime) / 1000);

        showEndMessage(
            gameState.outcome,
            gameState.answer,
            gameState.guesses.length,
            secondsTaken
        );
    } else {
        gameState.canGuess = true;
    }

    return true;
}

function addLetter(key){
    if (gameState.outcome){
        return;
    }
    if (!gameState.canGuess){
        return;
    }
    if (gameState.currentGuess.length === gameState.wordLength) {
        return;
    }
    const colPosition = gameState.currentGuess.length;
    const rowPosition = gameState.currentRow;
    const currentTile = document.querySelector(`[data-row="${rowPosition}"][data-col="${colPosition}"]`);

    currentTile.textContent = key.toUpperCase();
    gameState.currentGuess += key.toLowerCase();
}

function removeLetter(){
    if (gameState.outcome){
        return;
    }
    if (!gameState.canGuess){
        return;
    }
    if (gameState.currentGuess.length === 0){
        return;
    }

    const colDelete = gameState.currentGuess.length - 1;
    const rowDelete = gameState.currentRow;
    const tileDelete = document.querySelector(`[data-row="${rowDelete}"][data-col="${colDelete}"]`);

    tileDelete.textContent = "";

    gameState.currentGuess = gameState.currentGuess.slice(0, -1);
}

function clearRow() {
    for (let col = 0; col < gameState.currentGuess.length; col++) {
        const tile = document.querySelector(
            `[data-row="${gameState.currentRow}"][data-col="${col}"]`
        );

        tile.textContent = "";
    }

    gameState.currentGuess = "";
}

function checkGuess(guess, answer){
    const result = Array(answer.length).fill("wrong");
    const usedAnswerIndexes = [];

    // correct
    for (let i = 0; i < guess.length; i++){
        if (guess[i] === answer[i]){
            result[i] = "correct";
            usedAnswerIndexes.push(i);
        }
    }

    // present
    for (let i = 0; i < guess.length; i++){
        if (result[i] === "correct"){
            continue;
        }

        for (let j = 0; j < answer.length; j++){
            if (answer[j] === guess[i] && !usedAnswerIndexes.includes(j)){
                result[i] = "present";
                usedAnswerIndexes.push(j);
                break;
            }
        }
    }

    return result;
}

function colorRow(row, result){
    for (let col = 0; col < result.length; col++){
        const tileColor = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

        tileColor.classList.add(result[col]);
    }
}

function createDialog() {
    const dialog = document.createElement("dialog");
    dialog.classList.add("title-dialog");

    dialog.innerHTML = `
        <form id="title-form" class="title-form">
            <label for="title-input">?</label>
            <input id="title-input" type="text" maxlength="24" autocomplete="off" required>

            <div class="title-dialog-buttons">
                <button type="button" id="title-cancel">Cancel</button>
                <button type="submit">Confirm</button>
            </div>
        </form>
    `;

    document.body.appendChild(dialog);
    return dialog;
}

function renderTitle(userTitle) {
    while (title.firstChild) {
        title.removeChild(title.lastChild);
    }

    for (let i = 0; i < userTitle.length; i++){
        const titleLetter = document.createElement("span");

        titleLetter.textContent = userTitle[i] === " " ? "\u00A0" : userTitle[i].toUpperCase();

        title.appendChild(titleLetter);
    }

    setupTitleCursorEffect();
}

function titleEasterEgg(){    
    clearRow();

    const dialog = createDialog();
    const form = dialog.querySelector("#title-form");
    const input = dialog.querySelector("#title-input");
    const cancel = dialog.querySelector("#title-cancel");

    dialog.showModal();
    input.focus();

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const userTitle = input.value.trim();

        if (userTitle !== ""){
            renderTitle(userTitle);
        }

        dialog.close();
    });

    cancel.addEventListener("click", () => {
        dialog.close();
    })

    dialog.addEventListener("close", () => {
        dialog.remove();
    }, {once: true});
}

function submitGuess(){
    if (gameState.outcome){
        return;
    }
    if (!gameState.answer){
        return;
    }

    if (gameState.currentGuess.toLowerCase() === "title"){
        titleEasterEgg();
        return;
    }
    if (!gameState.canGuess){
        return;
    }
    if (gameState.currentGuess.length !== gameState.wordLength){
        return false;
    }

    if (gameState.startTime === null){
        gameState.startTime = Date.now();
    }

    const result = checkGuess(gameState.currentGuess, gameState.answer);

    colorRow(gameState.currentRow, result);
    updateKeyboardStatus(gameState.currentGuess, result);

    gameState.guesses.push(gameState.currentGuess);
    gameState.results.push(result);


    // win
    if (gameState.currentGuess === gameState.answer){
        gameState.canGuess = false;
        gameState.outcome = "win";
        gameState.endTime = Date.now();
        const secondsTaken = Math.floor((gameState.endTime - gameState.startTime) / 1000);

        saveDailyProgress();

        showEndMessage("win", gameState.answer, gameState.guesses.length, secondsTaken)
        return result;
    }

    gameState.currentRow++;

    //lose
    if (gameState.currentRow === gameState.maxGuesses){
        gameState.canGuess = false;
        gameState.outcome = "fail";
        gameState.endTime = Date.now();
        const secondsTaken = Math.floor((gameState.endTime - gameState.startTime) / 1000);

        saveDailyProgress();

        showEndMessage("fail", gameState.answer, gameState.guesses.length, secondsTaken)
        return result;
    }

    gameState.currentGuess = "";

    saveDailyProgress();

    return result;
}

function updateKeyboardStatus(guess, result){
    const statusRank = {
        wrong: 1,
        present: 2,
        correct: 3
    };
    for (let i = 0; i < guess.length; i++){
        const letter = guess[i];
        const newStatus = result[i];
        const oldStatus = gameState.letterStatuses[letter];

        if (!oldStatus || statusRank[newStatus] > statusRank[oldStatus]){
            gameState.letterStatuses[letter] = newStatus;
            const key = document.querySelector(`[data-key="${letter}"]`);

            key.classList.remove("wrong", "present", "correct");
            key.classList.add(newStatus);
        }
    }
}

function showEndMessage(type, answer, guessesUsed, secondsTaken){
    gameMessage.classList.remove("win", "fail", "hidden");
    gameMessage.classList.add(type);
    if (type === "fail"){
        messageTitle.textContent = "You failed.";
        messageAnswer.textContent = `The word was ${answer.toUpperCase()}`;
        messageStats.textContent = `${guessesUsed} guesses | Time elapsed: ${secondsTaken}s`;
    } else if (type === "win"){
        messageTitle.textContent = "You won!";
        messageAnswer.textContent = `The word was ${answer.toUpperCase()}`;
        messageStats.textContent = `${guessesUsed} guesses | Solved in ${secondsTaken}s`;
    }
}

function handleInput(key){
    switch (key) {
        case "Enter":
            submitGuess();
            break;

        case "Backspace":
            removeLetter();
            break;

        default:
            if (/^[a-zA-Z]$/.test(key)){
                addLetter(key);
            }
            break;
    }
}

document.addEventListener("keydown", (event) => {
    if (event.target.closest("dialog")) {
        return;
    }

    handleInput(event.key);
});