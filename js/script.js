const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");

const scoreDisplay = document.querySelector("#score");
const livesDisplay = document.querySelector("#lives");
const statusDisplay = document.querySelector("#status");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayMessage = document.querySelector("#overlay-message");
const startButton = document.querySelector("#start-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const paddle = {
  width: 112,
  height: 12,
  x: WIDTH / 2 - 56,
  y: HEIGHT - 36,
  speed: 560
};

const ball = {
  radius: 8,
  x: WIDTH / 2,
  y: paddle.y - 8,
  speed: 340,
  velocityX: 0,
  velocityY: 0
};

const brickSettings = {
  rows: 5,
  columns: 9,
  width: 72,
  height: 22,
  gap: 8,
  top: 72,
  left: 36
};

const brickColors = [
  "#b96f5b",
  "#c58a55",
  "#c5ad62",
  "#7d987a",
  "#78899b"
];

let bricks = [];
let score = 0;
let lives = 3;
let state = "ready";
let leftPressed = false;
let rightPressed = false;
let pointerX = null;
let previousTime = 0;

function createBricks() {
  bricks = [];

  for (let row = 0; row < brickSettings.rows; row += 1) {
    for (let column = 0; column < brickSettings.columns; column += 1) {
      bricks.push({
        x: brickSettings.left +
          column * (brickSettings.width + brickSettings.gap),
        y: brickSettings.top +
          row * (brickSettings.height + brickSettings.gap),
        width: brickSettings.width,
        height: brickSettings.height,
        color: brickColors[row]
      });
    }
  }
}

function updateHud() {
  scoreDisplay.textContent = score;
  livesDisplay.textContent = lives;
}

function resetBall() {
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius;
  ball.velocityX = 0;
  ball.velocityY = 0;
}

function startGame() {
  score = 0;
  lives = 3;
  paddle.x = WIDTH / 2 - paddle.width / 2;

  createBricks();
  resetBall();
  updateHud();

  state = "ready";
  statusDisplay.textContent = "Press Space or click to launch";
  overlay.classList.add("is-hidden");
}

function launchBall() {
  if (state !== "ready") {
    return;
  }

  state = "playing";
  ball.velocityX = 170;
  ball.velocityY = -Math.sqrt(
    ball.speed * ball.speed - ball.velocityX * ball.velocityX
  );
  statusDisplay.textContent = "Break all the bricks!";
}

function showEndScreen(title, message, buttonText) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  startButton.textContent = buttonText;
  overlay.classList.remove("is-hidden");
}

function finishGame(won) {
  state = won ? "won" : "lost";
  statusDisplay.textContent = won ? "You cleared every brick!" : "Game over";

  if (won) {
    showEndScreen("You win!", `You scored ${score} points.`, "Play again");
  } else {
    showEndScreen("Game over", `Final score: ${score}.`, "Try again");
  }
}

function movePaddle(deltaTime) {
  if (pointerX !== null) {
    paddle.x = pointerX - paddle.width / 2;
  }

  if (leftPressed) {
    paddle.x -= paddle.speed * deltaTime;
  }

  if (rightPressed) {
    paddle.x += paddle.speed * deltaTime;
  }

  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));
}

function hitBrick(previousX, previousY) {
  for (let index = 0; index < bricks.length; index += 1) {
    const brick = bricks[index];

    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
    const distanceX = ball.x - closestX;
    const distanceY = ball.y - closestY;

    if (
      distanceX * distanceX + distanceY * distanceY >
      ball.radius * ball.radius
    ) {
      continue;
    }

    const wasLeft = previousX + ball.radius <= brick.x;
    const wasRight = previousX - ball.radius >= brick.x + brick.width;
    const wasAbove = previousY + ball.radius <= brick.y;
    const wasBelow = previousY - ball.radius >= brick.y + brick.height;

    if (wasLeft || wasRight) {
      ball.velocityX *= -1;
    } else if (wasAbove || wasBelow) {
      ball.velocityY *= -1;
    } else {
      ball.velocityY *= -1;
    }

    bricks.splice(index, 1);
    score += 10;
    updateHud();

    if (bricks.length === 0) {
      finishGame(true);
    }

    return;
  }
}

function updateBall(deltaTime) {
  const previousX = ball.x;
  const previousY = ball.y;

  ball.x += ball.velocityX * deltaTime;
  ball.y += ball.velocityY * deltaTime;

  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.velocityX = Math.abs(ball.velocityX);
  } else if (ball.x + ball.radius > WIDTH) {
    ball.x = WIDTH - ball.radius;
    ball.velocityX = -Math.abs(ball.velocityX);
  }

  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.velocityY = Math.abs(ball.velocityY);
  }

  const overlapsPaddle =
    ball.x + ball.radius >= paddle.x &&
    ball.x - ball.radius <= paddle.x + paddle.width;

  const crossesPaddle =
    previousY + ball.radius <= paddle.y &&
    ball.y + ball.radius >= paddle.y;

  if (ball.velocityY > 0 && overlapsPaddle && crossesPaddle) {
    const hitPosition =
      (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const angle = hitPosition * 1.1;

    ball.y = paddle.y - ball.radius;
    ball.speed = Math.min(ball.speed * 1.02, 600);
    ball.velocityX = ball.speed * Math.sin(angle);
    ball.velocityY = -ball.speed * Math.cos(angle);
  }

  hitBrick(previousX, previousY);

  if (ball.y - ball.radius > HEIGHT) {
    lives -= 1;
    updateHud();

    if (lives === 0) {
      finishGame(false);
    } else {
      state = "ready";
      resetBall();
      statusDisplay.textContent =
        `Life lost. ${lives} left — press Space or click to serve`;
    }
  }
}

function drawBackground() {
  context.fillStyle = "#fffefa";
  context.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawBricks() {
  for (const brick of bricks) {
    context.fillStyle = brick.color;
    context.fillRect(brick.x, brick.y, brick.width, brick.height);
  }
}

function drawPaddle() {
  context.fillStyle = "#526b55";
  context.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
  context.fillStyle = "#292a26";
  context.beginPath();
  context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  context.fill();
}

function draw() {
  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();
}

function gameLoop(time) {
  const elapsed = previousTime === 0 ? 0 : (time - previousTime) / 1000;
  const deltaTime = Math.min(elapsed, 1 / 30);
  previousTime = time;

  movePaddle(deltaTime);

  if (state === "ready") {
    resetBall();
  } else if (state === "playing") {
    updateBall(deltaTime);
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function getCanvasPointerX(event) {
  const bounds = canvas.getBoundingClientRect();
  return (event.clientX - bounds.left) * (WIDTH / bounds.width);
}

startButton.addEventListener("click", startGame);

canvas.addEventListener("pointermove", (event) => {
  pointerX = getCanvasPointerX(event);
});

canvas.addEventListener("pointerleave", () => {
  pointerX = null;
});

canvas.addEventListener("pointerdown", () => {
  if (state === "ready") {
    launchBall();
  }
});

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    leftPressed = true;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    rightPressed = true;
  }

  if (event.code === "Space" && state === "ready") {
    launchBall();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    leftPressed = false;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    rightPressed = false;
  }
});

createBricks();
updateHud();
resetBall();
requestAnimationFrame(gameLoop);