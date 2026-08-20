const gameArea = document.getElementById("gameArea");
const catLayer = document.getElementById("catLayer");
const player = document.getElementById("player");
const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const bestScoreText = document.getElementById("bestScore");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const finalScore = document.getElementById("finalScore");
const finalBestScore = document.getElementById("finalBestScore");
const countdown = document.getElementById("countdown");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");

const keys = { left: false, right: false };
const cats = [];
const bestScoreKey = "catBasketBestScore";

let score = 0;
let lives = 3;
let bestScore = Number(localStorage.getItem(bestScoreKey)) || 0;
let playerX = 0;
let playerSpeed = 7;
let catSpeed = 80;
let spawnDelay = 1500;
let lastSpawnTime = 0;
let lastFrameTime = 0;
let animationId = null;
let gameRunning = false;
let gameAreaWidth = 0;
let gameAreaHeight = 0;

bestScoreText.textContent = bestScore;

function updateGameSize() {
  gameAreaWidth = gameArea.clientWidth;
  gameAreaHeight = gameArea.clientHeight;
  playerX = Math.min(playerX || gameAreaWidth / 2, gameAreaWidth - player.offsetWidth / 2);
  movePlayerTo(playerX);
}

function resetGame() {
  score = 0;
  lives = 3;
  catSpeed = 80;
//  catSpeed = 10;
  spawnDelay = 1500;
  lastSpawnTime = 0;
  cats.splice(0).forEach((cat) => cat.element.remove());
  playerX = gameArea.clientWidth / 2;
  updateHud();
  updateGameSize();
}

function updateHud() {
  scoreText.textContent = score;
  livesText.textContent = lives;
  bestScoreText.textContent = bestScore;
}

function movePlayerTo(nextX) {
  const halfWidth = player.offsetWidth / 2;
  playerX = Math.max(halfWidth, Math.min(gameAreaWidth - halfWidth, nextX));
  player.style.left = `${playerX}px`;
}

function movePlayer() {
  if (keys.left) movePlayerTo(playerX - playerSpeed);
  if (keys.right) movePlayerTo(playerX + playerSpeed);
}

function createCat() {
  const element = document.createElement("div");
  element.className = "cat";
  element.textContent = Math.random() > 0.5 ? "🐱" : "😺";
  const size = 52;
  const x = Math.random() * (gameAreaWidth - size);
  const cat = { element, x, y: -size, size };
  element.style.left = `${x}px`;
  element.style.top = `${cat.y}px`;
  catLayer.appendChild(element);
  cats.push(cat);
}

function rectanglesOverlap(first, second) {
  return !(
    first.right < second.left ||
    first.left > second.right ||
    first.bottom < second.top ||
    first.top > second.bottom
  );
}

function catchCat(index) {
  const cat = cats[index];
  cat.element.remove();
  cats.splice(index, 1);
  score += 10;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(bestScoreKey, bestScore);
  }
  player.classList.add("catch");
  setTimeout(() => player.classList.remove("catch"), 220);
  updateHud();
}

function missCat(index) {
  const cat = cats[index];
  cat.element.remove();
  cats.splice(index, 1);
  lives -= 1;
  updateHud();
  if (lives <= 0) endGame();
}

function increaseDifficulty(deltaTime) {
  catSpeed += 1.8 * deltaTime;
  spawnDelay = Math.max(800, spawnDelay - 18 * deltaTime);
}

function updateCats(deltaTime) {
  const playerBox = player.getBoundingClientRect();
  for (let index = cats.length - 1; index >= 0; index -= 1) {
    const cat = cats[index];
    cat.y += catSpeed * deltaTime;
    cat.element.style.top = `${cat.y}px`;

    const catBox = cat.element.getBoundingClientRect();
    if (rectanglesOverlap(catBox, playerBox)) {
      catchCat(index);
    } else if (cat.y > gameAreaHeight - 34) {
      missCat(index);
    }
  }
}

function gameLoop(timeStamp) {
  if (!gameRunning) return;
  if (!lastFrameTime) lastFrameTime = timeStamp;

  const deltaTime = Math.min((timeStamp - lastFrameTime) / 1000, 0.05);

  movePlayer();
  updateCats(deltaTime);
  increaseDifficulty(deltaTime);

  if (timeStamp - lastSpawnTime > spawnDelay) {
    createCat();
    lastSpawnTime = timeStamp;
  }

  lastFrameTime = timeStamp;
  animationId = requestAnimationFrame(gameLoop);
}

function showCountdown() {
  return new Promise((resolve) => {
    const steps = ["3", "2", "1", "시작!"];
    let index = 0;
    countdown.classList.add("show");
    countdown.textContent = steps[index];

    const timer = setInterval(() => {
      index += 1;
      if (index >= steps.length) {
        clearInterval(timer);
        countdown.classList.remove("show");
        countdown.textContent = "";
        resolve();
        return;
      }
      countdown.classList.remove("show");
      void countdown.offsetWidth;
      countdown.textContent = steps[index];
      countdown.classList.add("show");
    }, 750);
  });
}

async function startGame() {
  cancelAnimationFrame(animationId);
  resetGame();
  startScreen.classList.remove("overlay-visible");
  gameOverScreen.classList.remove("overlay-visible");
  await showCountdown();
  gameRunning = true;
  lastFrameTime = 0;
  animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  finalScore.textContent = score;
  finalBestScore.textContent = bestScore;
  gameOverScreen.classList.add("overlay-visible");
}

function setDirection(direction, isPressed) {
  keys[direction] = isPressed;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") setDirection("left", true);
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") setDirection("right", true);
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") setDirection("left", false);
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") setDirection("right", false);
});

leftButton.addEventListener("pointerdown", () => setDirection("left", true));
leftButton.addEventListener("pointerup", () => setDirection("left", false));
leftButton.addEventListener("pointerleave", () => setDirection("left", false));
rightButton.addEventListener("pointerdown", () => setDirection("right", true));
rightButton.addEventListener("pointerup", () => setDirection("right", false));
rightButton.addEventListener("pointerleave", () => setDirection("right", false));

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
window.addEventListener("resize", updateGameSize);
updateGameSize();
