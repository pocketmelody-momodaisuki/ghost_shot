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
let tryText = "";
let tryTextTimer = 0;
let cleared = false;   // ★ クリア判定は一度だけ

// 効果音
let stretchSound = new Audio("stretch.wav");
let hitBlockSound = new Audio("hit_block.wav");
let hitTargetSound = new Audio("hit_target.wav");
let hitGroundSound = new Audio("hit_ground.wav");
let launchSound = new Audio("launch.wav");
let clearSound = new Audio("clear.wav");        // ★ 追加
let gameoverSound = new Audio("gameover.wav");  // ★ 追加

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
  dragging: false,
  waiting: true,   // ★ スタート時は重力オフ
  frozen: false    // ★ クリア後は完全停止
};

const gravity = 0.4;
const bounce = 0.6;

// ターゲット
let target = { x: 700, y: 350, radius: 30 };

// スリングショットの位置
const slingX = 100;
const slingY = 350;

// 障害物（全部壊れる）
let blocks = [
  { x: 500, y: 300, w: 60, h: 60, alive: true },
  { x: 560, y: 300, w: 60, h: 60, alive: true },
  { x: 620, y: 300, w: 60, h: 60, alive: true },
  { x: 530, y: 240, w: 60, h: 60, alive: true },
  { x: 590, y: 240, w: 60, h: 60, alive: true },
  { x: 560, y: 180, w: 60, h: 60, alive: true },
  { x: 560, y: 120, w: 60, h: 60, alive: true },
  { x: 560, y: 60, w: 60, h: 60, alive: true }    
];

// Try 表示
function showTryText() {
  if (lives === 3) tryText = "1st Try";
  else if (lives === 2) tryText = "2nd Try";
  else if (lives === 1) tryText = "Last Try";

  tryTextTimer = 60;
}

// タッチ・マウス操作
canvas.addEventListener("pointerdown", (e) => {
  if (ghost.frozen) return; // ★ クリア後は操作不可

  let rect = canvas.getBoundingClientRect();
  let mx = e.clientX - rect.left;
  let my = e.clientY - rect.top;

  let dx = mx - ghost.x;
  let dy = my - ghost.y;

  if (dx * dx + dy * dy < ghost.radius * ghost.radius) {
    ghost.dragging = true;
    ghost.waiting = false;
    stretchSound.currentTime = 0;
    stretchSound.play();
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (ghost.dragging && !ghost.frozen) {
    let rect = canvas.getBoundingClientRect();
    ghost.x = e.clientX - rect.left;
    ghost.y = e.clientY - rect.top;
  }
});

canvas.addEventListener("pointerup", () => {
  if (ghost.dragging && !ghost.frozen) {
    ghost.dragging = false;

    ghost.vx = (slingX - ghost.x) * 0.15;
    ghost.vy = (slingY - ghost.y) * 0.15;

    stretchSound.pause();
    launchSound.play();
  }
});

function update() {

  // ★ クリア後は完全停止
  if (ghost.frozen) return;

  // ★ 重力は waiting=false のときだけ働く
  // ★ 引っ張り中は重力を完全停止
  if (!ghost.dragging && !ghost.waiting && !ghost.frozen) {
      ghost.vy += gravity;
      ghost.x += ghost.vx;
      ghost.y += ghost.vy;
  }

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

  // ★ 地面落下判定（waiting中は無効）
  // ★ 引っ張り中は絶対に落下判定しない
  if (!ghost.waiting && !ghost.dragging && !ghost.frozen) {

      let onGround = ghost.y >= canvas.height - ghost.radius;

      if (onGround) {
          ghost.y = canvas.height - ghost.radius;

          if (!wasOnGround) {
              hitGroundSound.currentTime = 0;
              hitGroundSound.play();
              reset();
          }
      }

    wasOnGround = onGround;
}


  // ゴーストアニメーション
  ghostAnimTimer++;
  if (ghostAnimTimer % 10 === 0) {
    ghostFrame = (ghostFrame + 1) % 2;
  }

  // Try 表示タイマー
  if (tryTextTimer > 0) tryTextTimer--;

  // ★ 引っ張り中は障害物判定を完全無効化
if (ghost.dragging || ghost.waiting || ghost.frozen) return;

// 障害物衝突判定（全部壊れる＋反動のみ）
blocks.forEach(block => {
    if (!block.alive) return;

    let hit =
      ghost.x + ghost.radius > block.x &&
      ghost.x - ghost.radius < block.x + block.w &&
      ghost.y + ghost.radius > block.y &&
      ghost.y - ghost.radius < block.y + block.h;

    if (!hit) return;

    block.alive = false;
    hitBlockSound.play();

    ghost.vx *= -0.5;
    ghost.vy = -2;
});


  // ★ ターゲットに当たった（クリア判定は一度だけ）
  let dx = ghost.x - target.x;
  let dy = ghost.y - target.y;

  if (!cleared && dx * dx + dy * dy < (ghost.radius + target.radius) ** 2) {

    cleared = true;
    ghost.frozen = true;   // ★ 完全停止
    ghost.vx = 0;
    ghost.vy = 0;

    clearSound.currentTime = 0;
    clearSound.play();

    setTimeout(() => {
      alert("クリア！");
      fullReset();
    }, 600);
  }
}

function fullReset() {
  lives = 3;

  ghost.x = slingX;
  ghost.y = slingY;
  ghost.vx = 0;
  ghost.vy = 0;
  ghost.waiting = true;
  ghost.frozen = false;

  blocks.forEach(b => b.alive = true);

  cleared = false;

  showTryText();
}

function reset() {
  lives--;

  if (lives <= 0) {

    ghost.frozen = true;

    gameoverSound.currentTime = 0;
    gameoverSound.play();

    setTimeout(() => {
      alert("ゲームオーバー！");
      fullReset();
    }, 600);

    return;
  }

  ghost.x = slingX;
  ghost.y = slingY;
  ghost.vx = 0;
  ghost.vy = 0;
  ghost.waiting = true;

  showTryText();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Try 表示
  if (tryTextTimer > 0) {
    ctx.fillStyle = "yellow";
    ctx.font = "30px sans-serif";
    ctx.fillText(tryText, 20, 70);
  }

  // 残機表示
  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText("Ghost: " + lives, 20, 30);

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
