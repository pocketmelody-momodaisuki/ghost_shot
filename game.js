const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ゴースト画像（アニメーション）
let ghost1 = new Image();
ghost1.src = "ghost_walk1.png";

let ghost2 = new Image();
ghost2.src = "ghost_walk2.png";

let ghostFrame = 0;
let ghostAnimTimer = 0;

// 状態管理
let wasOnGround = false;
let lives = 3;

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

// 障害物（増やしてOK）
let blocks = [
  { x: 500, y: 300, w: 60, h: 60 },
  { x: 560, y: 300, w: 60, h: 60 },
  { x: 530, y: 240, w: 60, h: 60 },
  { x: 600, y: 260, w: 60, h: 60 }, // 追加例
  { x: 450, y: 320, w: 60, h: 60 }  // 追加例
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

    // 地面判定（初回だけ音）
    let onGround = ghost.y > canvas.height - ghost.radius;
    if (onGround) {
      ghost.y = canvas.height - ghost.radius;
      ghost.vy *= -bounce;

      if (!wasOnGround) {
        hitGroundSound.play();
      }
    }
    wasOnGround = onGround;
  }

  // ゴーストアニメーション
  ghostAnimTimer++;
  if (ghostAnimTimer % 10 === 0) {
    ghostFrame = (ghostFrame + 1) % 2;
  }

  // 障害物衝突判定（貫通しない・反動で跳ね返る）
  blocks.forEach(block => {
    if (
      ghost.x + ghost.radius > block.x &&
      ghost.x - ghost.radius < block.x + block.w &&
      ghost.y + ghost.radius > block.y &&
      ghost.y - ghost.radius < block.y + block.h
    ) {
      // 反動で跳ね返る
      ghost.vx *= -0.5;   // 後ろに跳ね返る
      ghost.vy = -2;      // 少し上に跳ねる

      // ブロックの外側に押し戻す
      if (ghost.vx > 0) ghost.x = block.x - ghost.radius;
      if (ghost.vx < 0) ghost.x = block.x + block.w + ghost.radius;

      hitBlockSound.play();
    }
  });

  // ターゲットに当たった？
  let dx = ghost.x - target.x;
  let dy = ghost.y - target.y;
  if (dx * dx + dy * dy < (ghost.radius + target.radius) ** 2) {
    hitTargetSound.play();
    alert("クリア！");
    fullReset();
  }
}

function fullReset() {
  lives = 3;
  ghost.x = slingX;
  ghost.y = slingY;
  ghost.vx = 0;
  ghost.vy = 0;
}

function reset() {
  lives--;
  if (lives <= 0) {
    alert("ゲームオーバー！");
    fullReset();
    return;
  }

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

  // 残機表示
  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText("Ghost: " + lives, 20, 30);

  // ブロック
  blocks.forEach(block => {
    ctx.drawImage(blockImg, block.x, block.y, block.w, block.h);
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
