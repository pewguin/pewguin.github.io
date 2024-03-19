//* web interface variables
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width;
let height;
let gameLoop;
let alive = true;

//* player variables
let player = { x: 0, y: 0 }
let playerColor = "#FF128F";
let speed = 7;
const playerSize = 20;
let kills = 0;

let projectiles = [];
let bulletSpeed = 40;
let bulletSize = 4;
let bulletTimeoutMs = 40;
let bulletColor = "#2020FF";
let spread = 30 * Math.PI/180;
let bulletPierce = 0;
let canFire = true;

//* enemy variables
let enemies = [];
let enemySpeed = 2;
let enemySize = 30;
let enemyMaxHp = 2;
let enemyHue = 0;
let enemyMinValue = 0.3;

//* text variables
const scoreTextSize = 100;
const scoreVerticalOffset = 10;
const versionTextSize = 20;
const versionPadding = 10;
const endTextSize = 50;
const endText = "skill issue";
const version = "0.1.4";
const restartButtonHeight = 50;
let restartButtonRect;
const restartButtonPadding = 10;
const restartButtonText = "RESTART";



//* input variables
let keysHeld = [];
let keysPressed =[];

//* debug
let debugPoints = [];

function gameUpdate() {
    for (const enemy of enemies) {
        if (circleRectCollision({ x: player.x, y: player.y, r: playerSize }, { x: enemy.x -(enemySize/2), y: enemy.y -(enemySize/2), w: enemySize, h: enemySize })) {
            end();
            return;
        }
    }
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = "#333333";
    ctx.fill();
    ctx.closePath();

    ctx.font = scoreTextSize + "px monospace";
    ctx.fillStyle = "#FF0000";
    ctx.fillText(kills, width/2, scoreVerticalOffset + scoreTextSize);
    ctx.font = versionTextSize + "px monospace";
    ctx.fillText(version, versionPadding, height - versionPadding);

    let moveVector = { x: keysHeld[65] ? -1 : 0 + keysHeld[68] ? 1 : 0, y: keysHeld[87] ? -1 : 0 + keysHeld[83] ? 1 : 0};

    moveVector = normalize(moveVector);

    moveVector.x *= speed;
    moveVector.y *= speed;

    player.x += moveVector.x;
    player.y += moveVector.y;

    if (player.x - playerSize < 0) {
        player.x = playerSize;
    } else if (player.x + playerSize > width) {
        player.x = width -playerSize;
    }
    if (player.y - playerSize < 0) {
        player.y = playerSize;
    } else if (player.y + playerSize > height) {
        player.y = height -playerSize;
    }

    let shootVector = { x: keysHeld[37] ? -1 : 0 + keysHeld[39] ? 1 : 0, y: keysHeld[38] ? -1 : 0 + keysHeld[40] ? 1 : 0};
    shootVector = normalize(shootVector);
    if (magnitude(shootVector) > 0 && canFire) {
        let dir = vectorToAngle(shootVector);
        dir += Math.random() * spread - spread / 2;
        shootVector = angleToVector(dir);
        shootVector.y *= -1;
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
    ctx.ellipse(player.x, player.y, playerSize, playerSize, 0, 0, Math.PI*2);
    ctx.fillStyle = playerColor;
    ctx.fill();
    ctx.closePath();

    drawDebugPoints();

    keysPressed = [];
    debugPoints = [];
}

function drawDebugPoints() {
    debugPoints.forEach(point => {
        ctx.beginPath();
        ctx.ellipse(point.x, point.y, 2, 2, 0, 0, 2*Math.PI);
        ctx.fillStyle = "#00FF00";
        ctx.fill();
        ctx.closePath();
    });
}

function vectorToAngle(vector) {
    if (vector.y < 0) {
        return Math.acos(vector.x);
    } else {
        return (2*Math.PI) - Math.acos(vector.x);
    }
}

function angleToVector(angle) {
    return { x: Math.cos(angle), y: Math.sin(angle) }
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

function pointRectCollision(p, rect) {
    return p.x >= rect.x && p.x <= rect.x + rect.w &&
        p.y >= rect.y && p.y <= rect.y + rect.h;
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

function drawEndScreen() {
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = "#333333";
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "#FF0000";
    ctx.font = endTextSize + "px monospace";
    ctx.fillText(endText, width/2 - ctx.measureText(endText).width/2, height/2);

    ctx.font = restartButtonHeight - restartButtonPadding + "px monospace";
    let restartButtonWidth = ctx.measureText(restartButtonText).width + 2*restartButtonPadding;
    restartButtonRect = { x: width/2 - restartButtonWidth/2, y: height/2 + endTextSize, w: restartButtonWidth, h: restartButtonHeight };
    ctx.beginPath();
    ctx.rect(restartButtonRect.x, restartButtonRect.y, restartButtonRect.w, restartButtonRect.h);
    ctx.fillStyle = "#E00000";
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "#404040";
    ctx.fillText(restartButtonText, width/2 - restartButtonWidth/2 + restartButtonPadding, height/2 + endTextSize + restartButtonHeight - restartButtonPadding);
}

function end() {
    clearInterval(gameLoop);
    alive = false;
    drawEndScreen();
}

function restart() {
    enemies = [];
    projectiles = [];
    alive = true;
    load();
}

function mousemove(event) {
    mouseX = event.pageX;
    mouseY = event.pageY-100;
}

function keydown(event) {
    keysHeld[event.keyCode] = true;
    keysPressed.push(event.key);
}

function keyup(event) {
    keysHeld[event.keyCode] = false;
}

function resize(event) {
    width = window.innerWidth;
    canvas.width = width;
    height = window.innerHeight-document.getElementById("header").clientHeight;
    canvas.height = height;
    if (!alive) {
        drawEndScreen();
    }
}

function mousedown(event) {
    if (event.button == 0 && !alive && pointRectCollision({ x: event.clientX, y: event.clientY - 100 }, restartButtonRect)) {
        restart();
    }
}

function load() {
    resize();
    player.x = width/2;
    player.y = height/2;
    gameLoop = window.setInterval(gameUpdate, 17);
    startEnemyLoop();
}

function spawnEnemy() {
    if (Math.random() > 0.5) {
        enemies.push({x: Math.random() * (width + enemySize) - enemySize / 2, y: Math.random() > 0.5 ? 0 - enemySize / 2 : height + enemySize / 2, size: enemySize, hp: enemyMaxHp});
    } else {
        enemies.push({x: Math.random() > 0.5 ? 0 - enemySize / 2 : width + enemySize / 2, y: Math.random() * (height + enemySize) - enemySize / 2, size: enemySize, hp: enemyMaxHp});
    }
}

function startEnemyLoop() {
    spawnEnemy();
    if (alive) {
        window.setTimeout(startEnemyLoop, Math.random() * 1000);
    }
}

window.addEventListener("resize", resize);
canvas.addEventListener("mousemove", mousemove);
canvas.addEventListener("mousedown", mousedown);
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);
window.setTimeout(load, 500);