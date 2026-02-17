const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;

// Load progress
let progress = JSON.parse(localStorage.getItem('zombieGame')) || {
    score: 0,
    wave: 1,
    playerLives: 3
};

// Player
let player = {
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
    size: 25,
    speed: 5,
    weapon: 0
};

// Bullets
let bullets = [];

// Zombies
let zombies = [];

// Walls
let walls = [];

// Weapon types
const weapons = [
    {name: "Pistol", size: 4, speed: 10, damage: 1},
    {name: "Rifle", size: 6, speed: 15, damage: 2}
];

// Keys
let keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Mouse
let mouse = { x: 0, y: 0 };
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

// Spawn zombies
function spawnZombie() {
    let x = Math.random() * MAP_WIDTH;
    let y = Math.random() * MAP_HEIGHT;
    zombies.push({ x, y, size: 20, speed: 1 + progress.wave * 0.2 });
}

// Shoot bullet towards mouse
function shoot() {
    const angle = Math.atan2(mouse.y - canvas.height/2, mouse.x - canvas.width/2);
    const w = weapons[player.weapon];
    bullets.push({
        x: player.x + player.size/2,
        y: player.y + player.size/2,
        size: w.size,
        speed: w.speed,
        damage: w.damage,
        dx: Math.cos(angle) * w.speed,
        dy: Math.sin(angle) * w.speed
    });
}

// Build wall with Shift
function buildWall() {
    walls.push({x: player.x + player.size, y: player.y + player.size, w: 40, h: 10, life: 2000}); // lasts 2s
}

// Update game
function update(dt) {
    // Player movement
    if(keys['w']) player.y -= player.speed;
    if(keys['s']) player.y += player.speed;
    if(keys['a']) player.x -= player.speed;
    if(keys['d']) player.x += player.speed;
    if(keys['Shift']) buildWall();

    // Weapon switching
    if(keys['1']) player.weapon = 0;
    if(keys['2']) player.weapon = 1;

    // Update bullets
    bullets.forEach((b,i)=>{
        b.x += b.dx;
        b.y += b.dy;
        if(b.x < 0 || b.x > MAP_WIDTH || b.y < 0 || b.y > MAP_HEIGHT) bullets.splice(i,1);
    });

    // Update zombies
    zombies.forEach((z,i)=>{
        // Move towards player
        let angle = Math.atan2(player.y - z.y, player.x - z.x);
        z.x += Math.cos(angle) * z.speed;
        z.y += Math.sin(angle) * z.speed;

        // Check collision with bullets
        bullets.forEach((b,j)=>{
            if(b.x < z.x + z.size && b.x + b.size > z.x &&
               b.y < z.y + z.size && b.y + b.size > z.y){
                zombies.splice(i,1);
                bullets.splice(j,1);
                progress.score += 10;
            }
        });

        // Check collision with walls
        walls.forEach(w=>{
            if(z.x < w.x + w.w && z.x + z.size > w.x &&
               z.y < w.y + w.h && z.y + z.size > w.y){
                z.x -= Math.cos(angle) * z.speed;
                z.y -= Math.sin(angle) * z.speed;
            }
        });

        // Collision with player
        if(z.x < player.x + player.size && z.x + z.size > player.x &&
           z.y < player.y + player.size && z.y + z.size > player.y){
            progress.playerLives -= 1;
            zombies.splice(i,1);
        }
    });

    // Update walls
    walls.forEach((w,i)=>{
        w.life -= dt;
        if(w.life <= 0) walls.splice(i,1);
    });

    // Spawn wave
    if(zombies.length === 0){
        progress.wave += 1;
        for(let i=0;i<progress.wave*5;i++) spawnZombie();
    }

    // Save progress
    localStorage.setItem('zombieGame', JSON.stringify(progress));
}

// Draw game
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Calculate camera offset
    const offsetX = player.x - canvas.width/2;
    const offsetY = player.y - canvas.height/2;

    // Player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x - offsetX, player.y - offsetY, player.size, player.size);

    // Bullets
    ctx.fillStyle = 'yellow';
    bullets.forEach(b=>ctx.fillRect(b.x - offsetX, b.y - offsetY, b.size, b.size));

    // Zombies
    ctx.fillStyle = 'red';
    zombies.forEach(z=>ctx.fillRect(z.x - offsetX, z.y - offsetY, z.size, z.size));

    // Walls
    ctx.fillStyle = 'gray';
    walls.forEach(w=>ctx.fillRect(w.x - offsetX, w.y - offsetY, w.w, w.h));

    // HUD
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${progress.score}`, 10, 20);
    ctx.fillText(`Wave: ${progress.wave}`, 10, 40);
    ctx.fillText(`Lives: ${progress.playerLives}`, 10, 60);
    ctx.fillText(`Weapon: ${weapons[player.weapon].name}`, 10, 80);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp){
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if(progress.playerLives <= 0){
        alert("Game Over! Your score: " + progress.score);
        progress = {score:0,wave:1,playerLives:3};
        localStorage.setItem('zombieGame', JSON.stringify(progress));
    }
    requestAnimationFrame(gameLoop);
}

// Start game
for(let i=0;i<progress.wave*5;i++) spawnZombie();
gameLoop();
