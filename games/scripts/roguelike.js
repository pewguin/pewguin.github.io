//* web interface variables
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width;
let height;
let gameLoop;
let alive = true;
let levelling = false;
let backgroundColor = { r: 51, g: 51, b: 51 };
let secondsAlive = 0;
let startTime = Date.now();
let addendTime = 0;

//* player variables
let player = { x: 0, y: 0 }
let playerColor = "#FF128F";
const speedStart = 7;
let speed = speedStart;
const playerSize = 20;
let kills = 0;
let level = 1;
let killsPerLevel = 20;
let upgradesToChoose = [];
const livesStart = 1;
let lives = livesStart;
const upgrades = [{ name: "Faster firing", effect: () => { bulletTimeoutMs *= 0.9 }}, 
                  { name: "Faster movement", effect: () => { speed *= 1.1 }},
                  { name: "More Pierce", effect: () => { bulletPierce++ }},
                  { name: "Reduced spread", effect: () => { spread *= 0.8 }},
                  { name: "Faster bullets", effect: () => { bulletSpeed *= 1.2 }},
                  { name: "Slower enemies", effect: () => { enemySpeed *= 0.9 }},
                  { name: "Extra life", effect: () => { lives++; }}];

let projectiles = [];
const bulletSpeedStart = 40;
let bulletSpeed = bulletSpeedStart;
const bulletSizeStart = 4;
let bulletSize = bulletSizeStart;
const bulletTimeoutMsStart = 300;
let bulletTimeoutMs = bulletTimeoutMsStart;
let bulletColor = "#2020FF";
const spreadStart = 25 * Math.PI/180;
let spread = spreadStart;
const bulletPierceStart = 0;
let bulletPierce = bulletPierceStart;
let canFire = true;
let bulletParticleVelocityMin = 1;
let bulletParticleVelocityMax = 1;
let bulletParticleVelocityDecay = 0.9;
let bulletParticleColor = { r: 255, g: 0, b: 0};
let bulletParticleSize = 2;

//* enemy variables
let enemies = [];
const enemySpeedStart = 2;
let enemySpeed = enemySpeedStart;
let minEnemySpeed = 0.5;
let enemySize = 30;
let enemyMaxHp = 2;
let enemyHue = 0;
let enemyMinValue = 0.3;
let enemyParticleVelocityMin = 0.2;
let enemyParticleVelocityMax = 5;
let enemyParticleVelocityDecay = 0.9;
let enemyParticleColor = { r: 255, g: 0, b: 0};
let enemyParticleSize = 2;

//* text variables
const scoreTextSize = 100;
const scoreVerticalOffset = 10;
const versionTextSize = 20;
const versionPadding = 10;
const endTextSize = 50;
const endText = "skill issue";
const version = "0.1.4.w";
const restartButtonHeight = 50;
let restartButtonRect;
let upgradeButtonsRects = [];
const restartButtonPadding = 10;
const restartButtonText = "RESTART";
const timerSize = 30;
const timerPadding = 10;
const levelUpSize = 40;
const levelUpPadding = 10;
const upgradePadding = 20;
const upgradeSize = 40;

//* particle constants
let particles = [];

//* input variables
let keysHeld = [];
let keysPressed =[];

//* debug
let debugPoints = [];

function gameUpdate() {
    if (!document.hidden && alive) {
        updateTimer();
    }
    for (const enemy of enemies) {
        if (circleRectCollision({ x: player.x, y: player.y, r: playerSize }, { x: enemy.x -(enemySize/2), y: enemy.y -(enemySize/2), w: enemySize, h: enemySize })) {
            if (lives <= 0) {
                end();
                return;
            } else {
                lives--;
                enemies.splice(enemies.indexOf(enemy), 1);
            }
        }
    }
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = "rgb("+backgroundColor.r+","+backgroundColor.g+","+backgroundColor.b+")";
    ctx.fill();
    ctx.closePath();

    ctx.font = scoreTextSize + "px monospace";
    ctx.fillStyle = "#FF0000";
    ctx.fillText(kills, width/2 - ctx.measureText(kills).width/2, scoreVerticalOffset + scoreTextSize);
    ctx.font = versionTextSize + "px monospace";
    ctx.fillText(version, versionPadding, height - versionPadding);

    ctx.font = timerSize + "px monospace";
    ctx.fillStyle = "#FF0000";
    let minutes = Math.round(secondsAlive%60);
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    let timeFormatted = Math.floor(secondsAlive/60) + ":" + minutes;
    ctx.fillText(timeFormatted, width-ctx.measureText(timeFormatted).width - timerPadding, height - timerPadding);

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
                    for (let i = 0; i < 10; i++) {
                        particles.push({ x: enemy.x, y: enemy.y, vel: { x: Math.random()*6 - 3, y: Math.random()*6 - 3 }, velDecay: 0.9, color: { r: 255, g: 0, b: 0 }, size: 2 });
                    }
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

    drawParticles();

    enemies.forEach(enemy => {
        let moveVector = normalize({ x: player.x - enemy.x, y: player.y - enemy.y });

        moveVector.x *= enemySpeed * Math.max(minEnemySpeed, enemy.hp/enemyMaxHp);
        moveVector.y *= enemySpeed * Math.max(minEnemySpeed, enemy.hp/enemyMaxHp);

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

    if (kills >= killsPerLevel * level) {
        level++;
        pause();
        levelUp();
    }
}

function newParticle(pos, velMin, velMax, velDecay, color, size) {
    let velVector = angleToVector(Math.random() * Math.PI * 2);
    let speed = lerp(velMin, velMax, Math.random());
    velVector.x *= speed;
    velVector.y *= speed;
    particles.push({ x: pos.x, y: pos.y, vel: velVector, velDecay: velDecay, color: color, size: size });
}

function drawParticles() {
    particles.forEach(particle => {
        particle.x += particle.vel.x;
        particle.y += particle.vel.y;

        particle.vel.x *= particle.velDecay;
        particle.vel.y *= particle.velDecay;

        if (magnitude(particle.vel) < 0.01) {
            particles.splice(particles.indexOf(particle), 1);
        }

        let color = { r: lerp(particle.color.r, backgroundColor.r, 1 - (Math.min(magnitude(particle.vel), 1)**2)), 
                      g: lerp(particle.color.g, backgroundColor.g, 1 - (Math.min(magnitude(particle.vel), 1)**2)),
                      b: lerp(particle.color.b, backgroundColor.b, 1 - (Math.min(magnitude(particle.vel), 1)**2))};

        ctx.beginPath();
        ctx.ellipse(particle.x, particle.y, particle.size, particle.size, 0, 0, Math.PI*2);
        ctx.fillStyle = "rgb("+color.r+","+color.g+","+color.b+")";
        ctx.fill();
        ctx.closePath();
    });
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

function lerp(a, b, t) {
    return a + (b - a) * t;
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
    console.log("cleared");
    alive = false;
    drawEndScreen();
}

function drawLevelUp(upgradeChoices) {
    upgradeButtons = [];
    upgradesToChoose = upgradeChoices;
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = "rgb("+backgroundColor.r+","+backgroundColor.g+","+backgroundColor.b+")";
    ctx.fill();
    ctx.closePath();

    ctx.font = levelUpSize + "px monospace";
    ctx.fillStyle = "#FF0000";
    let levelUpLineSize = ctx.measureText("LEVEL UP");
    ctx.fillText("LEVEL UP", width/2-levelUpLineSize.width/2, levelUpSize + levelUpPadding);
    ctx.font = levelUpSize/1.3 + "px monospace";
    ctx.fillText("You are level " + level, width/2-ctx.measureText("You are level " + level).width/2, levelUpSize*2 + levelUpPadding);
    ctx.font = versionTextSize + "px monospace";
    ctx.fillText(version, versionPadding, height - versionPadding);

    upgradeButtonsRects = [];
    let totalUpgradeButtonWidth = 0;
    for (let i = 0; i < upgradeChoices.length; i++) {
        ctx.font = upgradeSize - upgradePadding + "px monospace";
        let upgradeButtonWidth = ctx.measureText(upgradeChoices[i].name).width + 2*upgradePadding;
        upgradeButtonsRects[i] = { x: totalUpgradeButtonWidth, y: height/2 + endTextSize, w: upgradeButtonWidth, h: restartButtonHeight };
        totalUpgradeButtonWidth += upgradeButtonWidth;
    }

    for (let i = 0; i < upgradeChoices.length; i++) {
        upgradeButtonsRects[i].x += width/2 - totalUpgradeButtonWidth/2 + upgradePadding * (i - Math.floor(upgradeChoices.length/2));
        ctx.beginPath();
        ctx.rect(upgradeButtonsRects[i].x, upgradeButtonsRects[i].y, upgradeButtonsRects[i].w, upgradeButtonsRects[i].h);
        ctx.fillStyle = "#E00000";
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = getRGBAsString(backgroundColor);
        ctx.fillText(upgradeChoices[i].name, upgradeButtonsRects[i].x + upgradePadding, upgradeButtonsRects[i].y + upgradeSize/2 + upgradePadding);
        upgradeButtons.push({ btn: upgradeChoices[i], rect: upgradeButtonsRects[i]});
    }
}

function levelUp() {
    levelling = true;
    drawLevelUp(randomUpgrades());
}

function getRGBAsString(rgb) {
    return "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";
}

function randomUpgrades() {
    let upgradesCopy = []; 
    upgrades.forEach(upgrade => { 
        upgradesCopy.push($.extend(true, {}, upgrade));
    });
    let chosenUpgrades = [];
    for (let i = 0; i < 3; i++) {
        let index = Math.round(Math.random() * (upgradesCopy.length-1));
        chosenUpgrades.push(upgradesCopy[index]);
        upgradesCopy.splice(index, 1);
    }
    return chosenUpgrades;
}

function restart() {
    enemies = [];
    projectiles = [];
    particles = [];
    alive = true;
    kills = 0;
    addendTime = 0;
    secondsAlive = 0;
    level = 0;
    startTime = Date.now();
    lives = livesStart;
    speed = speedStart;
    spread = spreadStart;
    enemySpeed = enemySpeedStart;
    bulletSize = bulletSizeStart;
    bulletSpeed = bulletSpeedStart;
    bulletPierce = bulletPierceStart;
    bulletTimeoutMs = bulletTimeoutMsStart;
    resize();
    player.x = width/2;
    player.y = height/2;
    gameLoop = window.setInterval(gameUpdate, 17);
    console.log("restart set");
    startEnemyLoop();
}

function pause() {
    clearInterval(gameLoop);
    console.log("cleared");
    alive = false;
    paused = !paused;
}

function unpause() {
    alive = true;
    gameLoop = window.setInterval(gameUpdate, 17);
    console.log("unpause set");
    addendTime += secondsAlive * 1000 - addendTime;
    startTime = Date.now();
    startEnemyLoop();
    paused = !paused;
}

function mousemove(event) {
    mouseX = event.pageX;
    mouseY = event.pageY-100;
}

let paused = false;
function keydown(event) {
    keysHeld[event.keyCode] = true;
    keysPressed.push(event.key);
    if (event.key == ' ') {
        if (!paused) {
            pause(); 
        } else if (paused) {
            unpause();
        }
    }
}

function keyup(event) {
    keysHeld[event.keyCode] = false;
}

function resize(event) {
    width = window.innerWidth;
    canvas.width = width;
    height = window.innerHeight-document.getElementById("header").clientHeight;
    canvas.height = height;
    if (levelling) {
        drawLevelUp(upgradesToChoose);
    } else if (!alive) {
        drawEndScreen();
    }
}

let upgradeButtons = [];
function mousedown(event) {
    let mouse = { x: event.clientX, y: event.clientY - 100 };
    if (restartButtonRect != null && event.button == 0 && !alive && pointRectCollision(mouse, restartButtonRect)) {
        restart();
        restartButtonRect = null;
    }
    if (upgradeButtons != null && levelling) {
        upgradeButtons.forEach(button => {
            if (pointRectCollision(mouse, button.rect)) {
                button.btn.effect();
                levelling = false;
                unpause();
            }
        });
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

function updateTimer() {
    secondsAlive = (Date.now() - startTime + addendTime)/1000;
}

function startEnemyLoop() {
    if (!document.hidden && alive) {
        spawnEnemy();
    }
    if (alive) {
        // https://www.desmos.com/calculator/6qg7kmk0ba
        window.setTimeout(startEnemyLoop, Math.min(3000, 65000*(1/secondsAlive) + 10));
    }
}

window.addEventListener("resize", resize);
canvas.addEventListener("mousemove", mousemove);
canvas.addEventListener("mousedown", mousedown);
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);
window.setTimeout(load, 500);