const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let keys = {}, time = 0;
const player = { x: canvas.width/2, y: canvas.height/2, vx:0, vy:0, accel:0.4, friction:0.85, walk:2.5, run:6, stamina:100, state:"IDLE" };
const enemy = { x:300, y:200, vx:1, vy:1, state:"PATROL", alive:true };
let cx = canvas.width/2, cy = canvas.height/2;

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// 🔹 Connect to server every 1 second
async function fetchServerData() {
  try {
    const res = await fetch('https://tunnelling-website.onrender.com/data');
    const data = await res.json();
    // Example: server can send enemy position
    if(data.enemy){
      enemy.x = data.enemy.x;
      enemy.y = data.enemy.y;
      enemy.alive = data.enemy.alive;
    }
  } catch(e){
    console.error('Server fetch failed', e);
  }
  setTimeout(fetchServerData, 1000);
}
fetchServerData();

function update(dt){
  let moving=false;
  if(keys.w||keys.ArrowUp){player.vy-=player.accel; moving=true;}
  if(keys.s||keys.ArrowDown){player.vy+=player.accel; moving=true;}
  if(keys.a||keys.ArrowLeft){player.vx-=player.accel; moving=true;}
  if(keys.d||keys.ArrowRight){player.vx+=player.accel; moving=true;}

  let sprint = keys.Shift && player.stamina>0 && moving;
  let max = sprint ? player.run : player.walk;

  player.stamina += sprint?-0.4:0.2;
  player.stamina = Math.max(0, Math.min(100, player.stamina));

  player.vx = Math.max(-max, Math.min(max, player.vx));
  player.vy = Math.max(-max, Math.min(max, player.vy));
  player.x += player.vx; player.y += player.vy;
  player.vx *= player.friction; player.vy *= player.friction;

  player.x = Math.max(0, Math.min(canvas.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height, player.y));

  let speed = Math.hypot(player.vx, player.vy);
  player.state = speed<0.3?"IDLE":(sprint?"SPRINTING":"WALKING");

  // Auto-lock: crosshair follows enemy
  if(enemy.alive){
    let dx = enemy.x - player.x;
    let dy = enemy.y - player.y;
    cx += (dx - cx)/15;
    cy += (dy - cy)/15;
  }

  document.getElementById("hud").innerHTML=
    `PLAYER: ${player.state}<br>ENEMY: ${enemy.alive?enemy.state:"DOWN"}<br>AUTO-LOCK: ${enemy.alive?"ON":"OFF"}`;

  document.getElementById("stamina").style.width = player.stamina + "%";
}

function drawCrosshair(){
  ctx.strokeStyle="#0f0";
  ctx.beginPath();
  let size = player.state==="SPRINTING"?18:10;
  ctx.moveTo(cx-size,cy); ctx.lineTo(cx-3,cy);
  ctx.moveTo(cx+3,cy); ctx.lineTo(cx+size,cy);
  ctx.moveTo(cx,cy-size); ctx.lineTo(cx,cy-3);
  ctx.moveTo(cx,cy+3); ctx.lineTo(cx,cy+size);
  ctx.stroke();
}

function drawWeapon(){
  let sway = Math.sin(time/100)*(player.state==="SPRINTING"?10:4);
  ctx.fillStyle="#444";
  ctx.fillRect(cx+30+sway, canvas.height-90, 160, 45);
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(enemy.alive){
    ctx.fillStyle = enemy.state==="CHASE"?"red":"#555";
    ctx.fillRect(enemy.x-15,enemy.y-15,30,30);
  }
  drawCrosshair();
  drawWeapon();
}

let last=performance.now();
function loop(t){
  time += t-last;
  let dt = t-last; last = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
loop(last);
