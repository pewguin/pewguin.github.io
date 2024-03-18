//* web interface variables
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width;
let height;
let gameLoop;

//* player variables
let player = { x: 0, y: 0 }
let playerColor = "#FF128F";
let speed = 7;
const size = 20;
let kills = 0;

let projectiles = [];
let bulletSpeed = 1000;
let bulletSize = 4;
let bulletTimeoutMs = 40;
let bulletColor = "#2020FF";
let spread = 1.2;
let bulletPierce = 0;
let canFire = true;

//* enemy variables
let enemies = [];
let enemySpeed = 2;
let enemySize = 100;
let enemyMaxHp = 2;
let enemyHue = 0;
let enemyMinValue = 0.3;

//* input variables
let keysHeld = [];
let keysPressed =[];

//* debug
let debugPoints = [];

function update() {
    enemies.forEach(enemy => {
        if (circleRectCollision({ x: player.x, y: player.y, r: size }, { x: enemy.x -(enemySize/2), y: enemy.y -(enemySize/2), w: enemySize, h: enemySize })) {
            alert("skill issue");
            end();
            location.reload();
        }
    });
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.closePath();

    let moveVector = { x: keysHeld[65] ? -1 : 0 + keysHeld[68] ? 1 : 0, y: keysHeld[87] ? -1 : 0 + keysHeld[83] ? 1 : 0};

    moveVector = normalize(moveVector);

    moveVector.x *= speed;
    moveVector.y *= speed;

    player.x += moveVector.x;
    player.y += moveVector.y;

    if (player.x - size < 0) {
        player.x = size;
    } else if (player.x + size > width) {
        player.x = width -size;
    }
    if (player.y - size < 0) {
        player.y = size;
    } else if (player.y + size > height) {
        player.y = height -size;
    }

    let shootVector = { x: keysHeld[37] ? -1 : 0 + keysHeld[39] ? 1 : 0, y: keysHeld[38] ? -1 : 0 + keysHeld[40] ? 1 : 0};
    shootVector = normalize(shootVector);
    if (magnitude(shootVector) > 0 && canFire) {
        shootVector.x = shootVector.x * bulletSpeed + moveVector.x;
        shootVector.y = shootVector.y * bulletSpeed + moveVector.y;
        projectiles.push({ x: player.x, y: player.y, vel: shootVector, pierce: bulletPierce, hitEnemies: []});
        canFire = false;
        setTimeout(() => { canFire = true }, bulletTimeoutMs);
    }

    projectiles.forEach(proj => {
        proj.x += proj.vel.x;
        proj.y += proj.vel.y;

        enemies.forEach(enemy => {
            if (rectRayCollision({ x: enemy.x -(enemySize/2), y: enemy.y -(enemySize/2), w: enemySize, h: enemySize}, { x: proj.x, y: proj.y }, { x: proj.x-proj.vel.x, y: proj.y-proj.vel.y }) &&
            !proj.hitEnemies.includes(enemy)) {
                if (proj.pierce > 0) {
                    proj.pierce--;
                    proj.hitEnemies.push(enemy);
                } else {
                    projectiles.splice(projectiles.indexOf(proj), 1);
                }
                if (enemy.hp > 0) {
                    enemy.hp--;
                } else {
                    enemies.splice(enemies.indexOf(enemy), 1);
                    kills++;
                    console.log(kills);
                }
                return;
            }
        });

        if (proj.x + bulletSize < 0 || proj.x - bulletSize > width ||
            proj.y + bulletSize < 0 || proj.y - bulletSize > height) {
            let selfIndex = projectiles.indexOf(proj);
            projectiles.splice(selfIndex, 1);

            return;
        }

        ctx.beginPath();
        ctx.ellipse(proj.x, proj.y, bulletSize, bulletSize, 0, 0, Math.PI*2);
        ctx.fillStyle = bulletColor;
        ctx.fill();
        ctx.closePath();
    });

    enemies.forEach(enemy => {
        let moveVector = normalize({ x: player.x - enemy.x, y: player.y - enemy.y });

        moveVector.x *= enemySpeed;
        moveVector.y *= enemySpeed;

        enemy.x += moveVector.x;
        enemy.y += moveVector.y;

        ctx.beginPath();
        ctx.rect(enemy.x - (enemy.size/2), enemy.y - (enemy.size/2), enemySize, enemySize);
        ctx.fillStyle = hsvToRgb(enemyHue, 1, (1-enemyMinValue)*(enemy.hp/enemyMaxHp) + enemyMinValue);
        ctx.fill();
        ctx.closePath();
    });

    ctx.beginPath();
    ctx.ellipse(player.x, player.y, size, size, 0, 0, Math.PI*2);
    ctx.fillStyle = playerColor;
    ctx.fill();
    ctx.closePath();

    debugPoints.forEach(point => {
        ctx.beginPath();
        ctx.ellipse(point.x, point.y, 2, 2, 0, 0, 2*Math.PI);
        ctx.fillStyle = "#00FF00";
        ctx.fill();
        ctx.closePath();
    });

    keysPressed = [];
    debugPoints = [];
}

function normalize(vector) {
    let mag = magnitude(vector);
    if (mag > 0) {
        return { x: vector.x / mag, y: vector.y / mag };
    }
    return vector;
}

function magnitude(vector) {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2);
}

function circleRectCollision(circle, rect){
    let distX = Math.abs(circle.x - rect.x-rect.w/2);
    let distY = Math.abs(circle.y - rect.y-rect.h/2);

    if (distX > (rect.w/2 + circle.r)) { return false; }
    if (distY > (rect.h/2 + circle.r)) { return false; }

    if (distX <= (rect.w/2)) { return true; } 
    if (distY <= (rect.h/2)) { return true; }

    let dx=distX-rect.w/2;
    let dy=distY-rect.h/2;
    return (dx*dx+dy*dy<=(circle.r*circle.r));
}

function linesIntersect(a1,a2,b1,b2) {
    let det, gamma, lambda;
    det = (a2.x - a1.x) * (b2.y - b1.y) - (b2.x - b1.x) * (a2.y - a1.y);
    if (det === 0) {
        return false;
    } else {
        lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det;
        gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
}

function rectRayCollision(rect, p1, p2) {
    let tl, tr, bl, br;
    tl = { x: rect.x, y: rect.y };
    tr = { x: rect.x + rect.w, y: rect.y };
    bl = { x: rect.x, y: rect.y + rect.h };
    br = { x: rect.x + rect.w, y: rect.y + rect.h };
    return linesIntersect(tl, tr, p1, p2) || linesIntersect(tr, br, p1, p2) || linesIntersect(br, bl, p1, p2) ||  linesIntersect(bl, tl, p1, p2);
}

function hsvToRgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }
    var n = 255;
    return "rgb("+Math.round(r * n) + ", " + Math.round(g * n) + ", " + Math.round(b * n) + ")";
}

function resize(event) {
    width = window.innerWidth;
    canvas.width = width;
    height = window.innerHeight-document.getElementById("header").clientHeight;
    canvas.height = height;
}

function load() {
    resize();
    player.x = width/2;
    player.y = height/2;
    gameLoop = setInterval(update, 17);
}

function end() {
    clearInterval(gameLoop);
    clearInterval(enemySpawner);
}

function mousemove(event) {
    mouseX = event.pageX;
    mouseY = event.pageY-100;
}

function keydown(event) {
    keysHeld[event.keyCode] = true;
    keysPressed.push(event.key);
    // console.log(event.key, event.keyCode);
}

function keyup(event) {
    keysHeld[event.keyCode] = false;
}

window.addEventListener("resize", resize);
canvas.addEventListener("mousemove", mousemove);
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);
window.setTimeout(load, 500);
const enemySpawner = window.setInterval(() => {
    enemies.push({x: 0, y: 0, size: 100, hp: enemyMaxHp});
}, 1000);