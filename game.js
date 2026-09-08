const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let ghostImg = new Image();
ghostImg.src = "ghost.png";  // あなたのゴースト画像を使う

let ghost = {
  x: 100,
  y: 300,
  vx: 0,
  vy: 0,
  radius: 25,
  dragging: false,
  offsetX: 0,
  offsetY: 0
};

const gravity = 0.4;
const bounce = 0.6;

// ターゲット
let target = { x: 500, y: 300, radius: 30 };

// スリングショットの位置
const slingX = 100;
const slingY = 300;

canvas.addEventListener("pointerdown", (e) => {
  let rect = canvas.getBoundingClientRect();
  let mx = e.clientX - rect.left;
  let my = e.clientY - rect.top;

  let dx = mx - ghost.x;
  let dy = my - ghost.y;

  if (dx * dx + dy * dy < ghost.radius * ghost.radius) {
    ghost.dragging = true;
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (ghost.dragging) {
    let rect = canvas.getBoundingClientRect();
    ghost.x = e.clientX - rect.left;
    ghost.y = e.clientY - rect.top;
  }
});

canvas.addEventListener("pointerup", () => {
  if (ghost.dragging) {
    ghost.dragging = false;

    // 発射速度（スリングショットの位置からの距離）
    ghost.vx = (slingX - ghost.x) * 0.15;
    ghost.vy = (slingY - ghost.y) * 0.15;
  }
});

function update() {
  if (!ghost.dragging) {
    ghost.vy += gravity;
    ghost.x += ghost.vx;
    ghost.y += ghost.vy;

    // 壁で跳ねる
    if (ghost.x < ghost.radius) {
      ghost.x = ghost.radius;
      ghost.vx *= -bounce;
    }
    if (ghost.x > canvas.width - ghost.radius) {
      ghost.x = canvas.width - ghost.radius;
      ghost.vx *= -bounce;
    }
    if (ghost.y < ghost.radius) {
      ghost.y = ghost.radius;
      ghost.vy *= -bounce;
    }
    if (ghost.y > canvas.height - ghost.radius) {
      ghost.y = canvas.height - ghost.radius;
      ghost.vy *= -bounce;
    }
  }

  // ターゲットに当たった？
  let dx = ghost.x - target.x;
  let dy = ghost.y - target.y;
  if (dx * dx + dy * dy < (ghost.radius + target.radius) ** 2) {
    alert("クリア！");
    reset();
  }
}

function reset() {
  ghost.x = slingX;
  ghost.y = slingY;
  ghost.vx = 0;
  ghost.vy = 0;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // スリングショットのゴム
  if (ghost.dragging) {
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(slingX, slingY);
    ctx.lineTo(ghost.x, ghost.y);
    ctx.stroke();
  }

  // ゴースト
  ctx.drawImage(ghostImg, ghost.x - ghost.radius, ghost.y - ghost.radius, ghost.radius * 2, ghost.radius * 2);

  // ターゲット
  ctx.fillStyle = "lime";
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
  ctx.fill();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
