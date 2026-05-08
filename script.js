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
let lastTime = 0;

const GAME_TIME = 60;
const TARGET_SCORE = 1000;

let timeLeft = GAME_TIME;

bgm.loop = true;

/* =========================
   SPEED (비율 기반)
========================= */
const noteSpeed = 0.5; // 트랙 width 기준 초당 60%

/* =========================
   TRACK / TARGET
========================= */
let trackRect = null;
const targetPositions = {};

/* =========================
   INIT EVENTS
========================= */
startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);
endingResetButton.addEventListener("click", resetGame);

volumeSlider.addEventListener("input", () => {
    bgm.volume = volumeSlider.value;
});

bgmToggle.addEventListener("change", () => {
    if (bgmToggle.checked) bgm.play();
    else bgm.pause();
});

/* =========================
   RESIZE 대응
========================= */
window.addEventListener("resize", updateTrackMetrics);

function updateTrackMetrics() {
    trackRect = track.getBoundingClientRect();
    cacheTargetPositions();
}

/* =========================
   START GAME
========================= */
function startGame() {
    titleScreen.style.display = "none";
    gameContainer.classList.remove("hidden");

    gameStarted = true;

    bgm.volume = volumeSlider.value;

    updateTrackMetrics();

    if (bgmToggle.checked) {
        bgm.play().catch(() => {});
    }

    setTimeout(spawnNextNote, 800);

    startTimer();

    lastTime = performance.now();

    requestAnimationFrame(update);
}

/* =========================
   TARGET CACHE
========================= */
function cacheTargetPositions() {
    ["pink", "green", "white"].forEach(color => {
        targetPositions[color] = getTargetPositionPx(color);
    });
}

function getTargetPositionPx(color) {
    const target = document.querySelector(`.target[data-color="${color}"]`);

    const trackRect = track.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    return (targetRect.left - trackRect.left) + (targetRect.width / 2);
}

/* =========================
   NOTE SPAWN
========================= */
function spawnNextNote() {
    if (!gameStarted) return;

    const colors = ["pink", "green", "white"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    createNote(color);
}

function createNote(color) {
    const note = document.createElement("div");
    note.classList.add("dango");

    note.style.backgroundImage = `url("assets/dango_${color}.png")`;
    note.style.backgroundSize = "contain";
    note.style.backgroundRepeat = "no-repeat";
    note.style.backgroundPosition = "center";

    track.appendChild(note);

    notes.push({
        element: note,
        color,
        x: 0,
        hit: false
    });
}

/* =========================
   UPDATE LOOP
========================= */
function update(currentTime) {
    if (!gameStarted) return;

    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    const move = trackRect.width * noteSpeed * deltaTime;

    for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];

        note.x += move;
        note.element.style.left = note.x + "px";

        const noteCenter = note.x + (note.element.offsetWidth / 2);
        const targetX = targetPositions[note.color];

        if (noteCenter > targetX + 60 && !note.hit) {
            showJudge("MISS");

            note.element.remove();
            notes.splice(i, 1);

            setTimeout(spawnNextNote, 800);
        }
    }

    requestAnimationFrame(update);
}

/* =========================
   INPUT
========================= */
window.addEventListener("keydown", (e) => {
    if (!gameStarted) return;
    if (e.repeat) return;
    if (e.code !== "Space") return;
    if (notes.length === 0) return;

    const note = notes[0];

    const noteCenter = note.x + (note.element.offsetWidth / 2);
    const targetX = targetPositions[note.color];

    const distance = Math.abs(noteCenter - targetX);

    judgeNote(note, distance);
});

/* =========================
   TOUCH INPUT (MOBILE)
========================= */
window.addEventListener("touchstart", (e) => {
    if (!gameStarted) return;
    if (notes.length === 0) return;

    const note = notes[0];

    const noteCenter = note.x + (note.element.offsetWidth / 2);
    const targetX = targetPositions[note.color];

    const distance = Math.abs(noteCenter - targetX);

    judgeNote(note, distance);
}, { passive: true });

/* =========================
   JUDGE
========================= */
function judgeNote(note, distance) {
    let result = "MISS";

    if (distance < 10) {
        result = "PERFECT";
        score += 100;
    } else if (distance < 25) {
        result = "GREAT";
        score += 50;
    } else if (distance < 45) {
        result = "GOOD";
        score += 30;
    }

    note.hit = true;
    note.element.remove();

    notes = notes.filter(n => n !== note);

    scoreText.textContent = score;

    showJudge(result);

    setTimeout(spawnNextNote, 800);
}

function showJudge(text) {
    const map = {
        PERFECT: "assets/perfect.png",
        GREAT: "assets/great.png",
        GOOD: "assets/good.png",
        MISS: "assets/miss.png"
    };

    judgement.src = map[text];

    clearTimeout(judgeTimeout);

    judgement.classList.remove("judgeShow");
    void judgement.offsetWidth;
    judgement.classList.add("judgeShow");

    judgeTimeout = setTimeout(() => {
        judgement.classList.remove("judgeShow");
    }, 300);
}

/* =========================
   TIMER
========================= */
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;

        timerBar.style.width = (timeLeft / GAME_TIME) * 100 + "%";

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

/* =========================
   END / RESET
========================= */
function endGame() {
    gameStarted = false;

    endingScreen.classList.remove("hidden");
    endingScreen.classList.add("showEnding");

    if (score >= TARGET_SCORE) {
        endingText.innerHTML = `SUCCESS!<br>FINAL SCORE : ${score}`;
        endingImage.src = "assets/ending1.png";
    } else {
        endingText.innerHTML = `FAIL...<br>FINAL SCORE : ${score}`;
        endingImage.src = "assets/ending2.png";
    }
}

function resetGame() {
    gameStarted = false;

    clearInterval(timerInterval);
    clearTimeout(judgeTimeout);

    bgm.pause();
    bgm.currentTime = 0;

    notes.forEach(n => n.element.remove());
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