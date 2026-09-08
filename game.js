const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ゴースト画像（アニメーション）
let ghost1 = new Image();
ghost1.src = "ghost_walk1.png";

let ghost2 = new Image();
ghost2.src = "ghost_walk2.png";

let ghostFrame = 0;
let ghostAnimTimer = 0;

// 効果音
let stretchSound = new Audio("stretch.wav");
let hitBlockSound = new Audio("hit_block.wav");
let hitTargetSound = new Audio("hit_target.wav");
let hitGroundSound = new Audio("hit_ground.wav");
let launchSound = new Audio("launch.wav");

// 障害物画像
let blockImg = new Image();
blockImg.src = "block.png";

// ターゲット画像
let targetImg = new Image();
targetImg.src = "target.png";

// ゴースト本体
let ghost = {
  x: 100,
  y: 350,
  vx: 0,
  vy: 0,
  radius: 25,
  dragging: false
};

const gravity = 0.4;
const bounce = 0.6;

// ターゲット
let target = { x: 700, y: 350, radius: 30 };

// スリングショットの位置
const slingX = 100;
const slingY = 350;

// 壊れるブロック
let blocks = [
  { x: 500, y: 300, w: 60, h: 60, alive: true },
  { x: 560, y: 300, w: 60, h: 60, alive: true },
  { x: 530, y: 240, w: 60, h: 60, alive: true }
];

// タッチ・マウス操作
canvas.addEventListener("pointerdown", (e) => {
  let rect = canvas.getBoundingClientRect();
  let mx = e.clientX - rect.left;
  let my = e.clientY - rect.top;

  let dx = mx - ghost.x;
  let dy = my - ghost.y;

  if (dx * dx + dy * dy < ghost.radius * ghost.radius) {
    ghost.dragging = true;
    stretchSound.currentTime = 0;
    stretchSound.play();
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

    ghost.vx = (slingX - ghost.x) * 0.15;
    ghost.vy = (slingY - ghost.y) * 0.15;

    stretchSound.pause();
    launchSound.play();
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
      hitBlockSound.play();
    }
    if (ghost.x > canvas.width - ghost.radius) {
      ghost.x = canvas.width - ghost.radius;
      ghost.vx *= -bounce;
      hitBlockSound.play();
    }
    if (ghost.y < ghost.radius) {
      ghost.y = ghost.radius;
      ghost.vy *= -bounce;
      hitBlockSound.play();
    }
    if (ghost.y > canvas.height - ghost.radius) {
      ghost.y = canvas.height - ghost.radius;
      ghost.vy *= -bounce;
      hitGroundSound.play();
    }
  }

  // ゴーストアニメーション
  ghostAnimTimer++;
  if (ghostAnimTimer % 10 === 0) {
    ghostFrame = (ghostFrame + 1) % 2;
  }

  // ブロック衝突判定
  blocks.forEach(block => {
    if (!block.alive) return;

    if (
      ghost.x + ghost.radius > block.x &&
      ghost.x - ghost.radius < block.x + block.w &&
      ghost.y + ghost.radius > block.y &&
      ghost.y - ghost.radius < block.y + block.h
    ) {
      block.alive = false;
      hitBlockSound.play();
    }
  });

  // ターゲットに当たった？
  let dx = ghost.x - target.x;
  let dy = ghost.y - target.y;
  if (dx * dx + dy * dy < (ghost.radius + target.radius) ** 2) {
    hitTargetSound.play();
    alert("クリア！");
    reset();
  }
}

function reset() {
  ghost.x = slingX;
  ghost.y = slingY;
  ghost.vx = 0;
  ghost.vy = 0;

  blocks.forEach(b => b.alive = true);
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

  // ブロック
  blocks.forEach(block => {
    if (block.alive) {
      ctx.drawImage(blockImg, block.x, block.y, block.w, block.h);
    }
  });

  // ゴースト（アニメーション）
  let img = ghostFrame === 0 ? ghost1 : ghost2;
  ctx.drawImage(img, ghost.x - ghost.radius, ghost.y - ghost.radius, ghost.radius * 2, ghost.radius * 2);

  // ターゲット
  ctx.drawImage(
    targetImg,
    target.x - target.radius,
    target.y - target.radius,
    target.radius * 2,
    target.radius * 2
  );
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
