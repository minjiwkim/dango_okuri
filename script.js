const startButton = document.getElementById("startButton");
const titleScreen = document.getElementById("titleScreen");
const gameContainer = document.getElementById("gameContainer");

const track = document.getElementById("track");

const judgement = document.getElementById("judgement");

const scoreText = document.getElementById("score");

const bgm = document.getElementById("bgm");
const bgmToggle = document.getElementById("bgmToggle");
const volumeSlider = document.getElementById("volumeSlider");

const timerBar = document.getElementById("timerBar");

const endingScreen = document.getElementById("endingScreen");
const endingImage = document.getElementById("endingImage");
const endingText = document.getElementById("endingText");

const resetButton = document.getElementById("resetButton");
const endingResetButton = document.getElementById("endingResetButton");

let score = 0;

let notes = [];

let gameStarted = false;

let timerInterval;

let judgeTimeout;

const GAME_TIME = 60;
const TARGET_SCORE = 1000;

let timeLeft = GAME_TIME;

bgm.loop = true;

const noteSpeed = 0.6;

const targetPositions = {};

startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);
endingResetButton.addEventListener("click", resetGame);

volumeSlider.addEventListener("input", () => {
    bgm.volume = volumeSlider.value;
});

bgmToggle.addEventListener("change", () => {

    if (bgmToggle.checked) {

        bgm.play();

    } else {

        bgm.pause();
    }
});

function startGame() {

    titleScreen.style.display = "none";

    gameContainer.classList.remove("hidden");

    gameStarted = true;

    bgm.volume = volumeSlider.value;

    cacheTargetPositions();

    if (bgmToggle.checked) {

        bgm.play().catch(() => {
            console.log("bgm blocked");
        });
    }

    setTimeout(spawnNextNote, 1000);

    startTimer();

    requestAnimationFrame(update);
}

function cacheTargetPositions() {

    ["pink", "green", "white"].forEach(color => {

        targetPositions[color] = getTargetPosition(color);

    });
}

function spawnNextNote() {

    if (!gameStarted) return;

    const colors = ["pink", "green", "white"];

    const randomColor =
        colors[Math.floor(Math.random() * colors.length)];

    createNote(randomColor);
}

function startTimer() {

    timerInterval = setInterval(() => {

        timeLeft--;

        const percent = (timeLeft / GAME_TIME) * 100;

        timerBar.style.width = percent + "%";

        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            endGame();
        }

    }, 1000);
}

function createNote(color) {

    const note = document.createElement("div");

    note.classList.add("dango");

    if (color === "pink") {
        note.style.backgroundImage =
            'url("assets/dango_pink.png")';
    }

    if (color === "green") {
        note.style.backgroundImage =
            'url("assets/dango_green.png")';
    }

    if (color === "white") {
        note.style.backgroundImage =
            'url("assets/dango_white.png")';
    }

    note.style.backgroundSize = "contain";
    note.style.backgroundRepeat = "no-repeat";
    note.style.backgroundPosition = "center";

    track.appendChild(note);

    const noteData = {
        element: note,
        color: color,
        x: 0,
        hit: false
    };

    notes.push(noteData);
}

function update() {

    if (!gameStarted) return;

    for (let i = notes.length - 1; i >= 0; i--) {

        const note = notes[i];

        note.x += noteSpeed;

        note.element.style.left = `calc(${note.x}% - 22.5px)`;

        const targetX = targetPositions[note.color];

        const missLimit =
            note.color === "white"
                ? 100
                : targetX + 4;

        if (note.x > missLimit && !note.hit) {

            showJudge("MISS");

            note.element.remove();

            notes.splice(i, 1);

            setTimeout(spawnNextNote, 1000);
        }
    }

    requestAnimationFrame(update);
}

function getTargetPosition(color) {

    const target =
        document.querySelector(`.target[data-color="${color}"]`);

    const trackRect = track.getBoundingClientRect();

    const targetRect = target.getBoundingClientRect();

    const targetCenter =
        targetRect.left + (targetRect.width / 2);

    const percent =
        ((targetCenter - trackRect.left) / trackRect.width) * 100;

    return percent;
}

window.addEventListener("keydown", (e) => {

    if (!gameStarted) return;

    if (e.code !== "Space") return;

    if (notes.length <= 0) return;

    const firstNote = notes[0];

    const targetX = targetPositions[firstNote.color];

    const distance = Math.abs(firstNote.x - targetX);

    judgeNote(firstNote, distance);
});

function judgeNote(note, distance) {

    let result = "MISS";

    if (distance < 1) {

        result = "PERFECT";

        score += 100;

    } else if (distance < 2.5) {

        result = "GREAT";

        score += 50;

    } else if (distance < 4) {

        result = "GOOD";

        score += 30;
    }

    note.hit = true;

    note.element.remove();

    notes = notes.filter(n => n !== note);

    scoreText.textContent = score;

    showJudge(result);

    setTimeout(spawnNextNote, 1000);
}

function showJudge(text) {

    if (text === "PERFECT") {
        judgement.src = "assets/perfect.png";
    }

    if (text === "GREAT") {
        judgement.src = "assets/great.png";
    }

    if (text === "GOOD") {
        judgement.src = "assets/good.png";
    }

    if (text === "MISS") {
        judgement.src = "assets/miss.png";
    }

    clearTimeout(judgeTimeout);

    judgement.classList.remove("judgeShow");

    void judgement.offsetWidth;

    judgement.classList.add("judgeShow");

    judgeTimeout = setTimeout(() => {

        judgement.classList.remove("judgeShow");

    }, 300);
}

function endGame() {

    gameStarted = false;

    if (score >= TARGET_SCORE) {

        endingText.innerHTML =
            `성공!<br>FINAL SCORE : ${score}`;

        endingImage.src = "assets/ending1.png";

    } else {

        endingText.innerHTML =
            `실패...<br>FINAL SCORE : ${score}`;

        endingImage.src = "assets/ending2.png";
    }

    endingScreen.classList.remove("hidden");

    endingScreen.classList.add("showEnding");
}

function resetGame() {

    gameStarted = false;

    clearInterval(timerInterval);

    clearTimeout(judgeTimeout);

    bgm.pause();

    bgm.currentTime = 0;

    notes.forEach((note) => {
        note.element.remove();
    });

    notes = [];

    score = 0;

    scoreText.textContent = 0;

    timeLeft = GAME_TIME;

    timerBar.style.width = "100%";

    judgement.classList.remove("judgeShow");

    endingScreen.classList.add("hidden");
    endingScreen.classList.remove("showEnding");

    gameContainer.classList.add("hidden");

    titleScreen.style.display = "flex";
}