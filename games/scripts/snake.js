//* web interface variables
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width;
let height;
let mainLoop;
let backgroundColor = { r: 51, g: 51, b: 51 };

//* input variables
let keysHeld = [];
let keysPressed =[];
let mouse = { x: 0, y: 0};

//* debug
let debugPoints = [];

//* inverse kinematics variables
let segmentSize = 1;
let segmentAmount = 100;
let segmentGain = 20;
let joints = [];
for (let i = 0; i < segmentAmount; i++) {
    joints.push({ x: 0, y: 0, l: segmentSize });
}
let target = { x: 500, y: 300 };

//* player variables
let speed = 15;
let snakeWidth = 5;
let headSize = 5;
let snakeColor = "#00CF00";
let snakeHeadColor = "#FF0000";

//* apple variables
let apples = [];
let appleSize = 20;
let appleColor = "#FF0000";
let appleCooldownMs = 600;

function update() {
    target = mouse;
    ctx.beginPath();
    ctx.rect(0,0,width,height);
    ctx.fillStyle = getRGBAsString(backgroundColor);
    ctx.fill();
    ctx.closePath();

    apples.forEach(a => {
        if (distance(getSnakeHead(), a) < appleSize + headSize) {
            apples.splice(apples.indexOf(a), 1);
            let additionalSegments = [];
            for (let i = 0; i < segmentGain; i++) {
                additionalSegments.push({ x: 0, y: 0, l: segmentSize })
            }
            joints.unshift(...additionalSegments);
        } else {
            ctx.beginPath();
            ctx.ellipse(a.x, a.y, appleSize, appleSize, 0, 0, 2*Math.PI);
            ctx.fillStyle = appleColor;
            ctx.fill();
            ctx.closePath();
        }
    })

    if (!(distance(getSnakeHead(), target) < speed)) { 
        target = vectorBetweenPoints(getSnakeHead(), target);
        target = { x: target.x * speed + getSnakeHead().x, y: target.y * speed + getSnakeHead().y };
    }
    calculateJoints();
    drawJoints();

    drawDebugPoints();
    debugPoints = [];
}

function getSnakeHead() {
    return joints[joints.length-1];
}

function drawJoints() {
    ctx.beginPath();
    ctx.ellipse(joints[0].x, joints[0].y, snakeWidth/2, snakeWidth/2, 0, 0, 2*Math.PI);
    ctx.fillStyle = snakeColor;
    ctx.fill();
    ctx.closePath();
    ctx.lineWidth = snakeWidth;
    for (let i = 0; i < joints.length-1; i++) {
        ctx.beginPath();
        ctx.moveTo(joints[i].x, joints[i].y);
        ctx.lineTo(joints[i+1].x, joints[i+1].y);
        ctx.strokeStyle = snakeColor;
        ctx.stroke();
    }
    ctx.lineWidth = 0;
    ctx.beginPath();
    ctx.ellipse(getSnakeHead().x, getSnakeHead().y, headSize, headSize, 0, 0, 2*Math.PI);
    ctx.fillStyle = snakeHeadColor;
    ctx.fill();
    ctx.closePath();
}

function calculateJoints() {
    joints[joints.length-1] = { x: target.x, y: target.y, l: joints[joints.length-1].l };
    for (let i = joints.length-2; i >= 0; i--) {
        let newPosVec = vectorBetweenPoints(joints[i+1], joints[i]);
        let newPos = { x: newPosVec.x * joints[i].l + joints[i+1].x, y: newPosVec.y * joints[i].l + joints[i+1].y };
        joints[i] = { x: newPos.x, y: newPos.y, l: joints[i].l };
    }
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

function vectorBetweenPoints(a, b) {
    return normalize({ x: b.x - a.x, y: b.y - a.y });
}

function vectorToAngle(vector) {
    if (vector.y < 0) {
        return Math.acos(vector.x);
    } else {
        return (2*Math.PI) - Math.acos(vector.x);
    }
}

function distance(p1, p2) {
    return magnitude({ x: p2.x - p1.x, y: p2.y - p1.y});
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

function getRGBAsString(rgb) {
    return "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";
}

function mousemove(event) {
    mouse.x = event.pageX;
    mouse.y = event.pageY-100;
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
}

function mousedown(event) {
    event.handled = true;
}

function spawnApple() {
    apples.push({ x: Math.random() * width, y: Math.random() * height });
}

function load() {
    resize();
    mainLoop = window.setInterval(update, 17);
    window.setInterval(spawnApple, appleCooldownMs);
}

window.addEventListener("resize", resize);
canvas.addEventListener("mousemove", mousemove);
canvas.addEventListener("mousedown", mousedown);
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);
window.setTimeout(load, 500);