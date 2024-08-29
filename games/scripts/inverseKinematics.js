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
let segmentSize = 100;
let constraints = { max: Math.PI, min: 0};
let joints = [{ x: 500, y: 300, l: segmentSize, c: { max: Math.PI, min: -Math.PI} }];
let segmentAmount = 5;
for (let i = 0; i < segmentAmount; i++) {
    joints.push({ x: 0, y: 0, l: segmentSize, c: constraints });
}
let target = mouse;
let tolerance = 1;

function update() {
    target = mouse;
    ctx.beginPath();
    ctx.rect(0,0,width,height);
    ctx.fillStyle = getRGBAsString(backgroundColor);
    ctx.fill();
    ctx.closePath();
    
    drawJoints();

    drawDebugPoints();
}

function drawJoints() {
    ctx.lineWidth = 1;
    for (let i = 0; i < joints.length-1; i++) {
        ctx.beginPath();
        ctx.moveTo(joints[i].x, joints[i].y);
        ctx.lineTo(joints[i+1].x, joints[i+1].y);
        ctx.strokeStyle = hsvToRgb(lerp(0, 1, i/joints.length), 1, 1);
        ctx.stroke();
    }
    ctx.lineWidth = 0;
}

function calculateJoints() {
    let reach = 0;
    for (let i = 0; i < joints.length-1; i++) {
        reach += joints[i].l;
    }
    if (reach < distance(joints[0], target)) {
        target = vectorBetweenPoints(joints[0], target);
        target = { x: target.x * reach + joints[0].x, y: target.y * reach + joints[0].y };
    }
    let startJoint = $.extend(true, {}, joints[0]);
    let endToTarget = distance(joints[joints.length-1], target);
    let c = 0;
    while (endToTarget > tolerance) {
        joints[joints.length-1].x = target.x;
        joints[joints.length-1].y = target.y;
        for (let i = joints.length-2; i >= 0; i--) {
            let newPosVec = vectorBetweenPoints(joints[i+1], joints[i]);
            let newPos = { x: newPosVec.x * joints[i].l + joints[i+1].x, y: newPosVec.y * joints[i].l + joints[i+1].y };
            
            // if (i > 1) {
            //     let thisSegmentAngle = vectorToAngle(vectorBetweenPoints(joints[i-1], newPos));
            //     let prevSegmentAngle = Math.PI/2;
            //     if (i > 0) {
            //         prevSegmentAngle = vectorToAngle(vectorBetweenPoints(joints[i-2], joints[i-1]));
            //     }
            //     let relAngle = prevSegmentAngle - thisSegmentAngle;
            //     relAngle = (relAngle + Math.PI)/2%Math.PI*2;
            //     if (relAngle < 0) {
            //         relAngle = Math.PI*2 + relAngle;
            //     }

            //     let constrainedPos = checkConstraints(joints[i-1].c, relAngle, prevSegmentAngle, joints[i-1]);
                
            //     if (constrainedPos) {
            //         newPos = constrainedPos;
            //     }
            // }
            
            joints[i].x = newPos.x;
            joints[i].y = newPos.y;
        }
        joints[0] = $.extend(true, {}, startJoint);
        for (let i = 0; i <= joints.length-2; i++) {
            let newPosVec = vectorBetweenPoints(joints[i], joints[i+1]);
            let newPos = { x: newPosVec.x * joints[i].l + joints[i].x, y: newPosVec.y * joints[i].l + joints[i].y };

            let thisSegmentAngle = vectorToAngle(vectorBetweenPoints(joints[i], newPos));
            let prevSegmentAngle = Math.PI/2;
            if (i > 0) {
                prevSegmentAngle = vectorToAngle(vectorBetweenPoints(joints[i-1], joints[i]));
            }
            let relAngle = prevSegmentAngle - thisSegmentAngle;
            relAngle = (relAngle + Math.PI)/2%Math.PI*2;
            if (relAngle < 0) {
                relAngle = Math.PI*2 + relAngle;
            }

            // let constrainedPos = checkConstraints(joints[i].c, relAngle, prevSegmentAngle, joints[i]);
            
            // if (constrainedPos) {
            //     newPos = constrainedPos;
            // }
            
            joints[i+1].x = newPos.x;
            joints[i+1].y = newPos.y;
        }
        c++;
        if (c >= 200) {
            break;
        }
        endToTarget = distance(joints[joints.length-1], target);
    }
}

function checkConstraints(constraints, relativeAngle, prevAngle, prevJoint) {
    relativeAngle = lerp(-Math.PI, Math.PI, relativeAngle/(Math.PI*2));
    if (relativeAngle > constraints.max) {
        let vec = angleToVector(constraints.max - prevAngle);
        return { x: vec.x * prevJoint.l + prevJoint.x, y: vec.y * prevJoint.l + prevJoint.y };
    } else if (relativeAngle < constraints.min) {
        let vec = angleToVector(constraints.min - prevAngle);
        return { x: vec.x * prevJoint.l + prevJoint.x, y: vec.y * prevJoint.l + prevJoint.y };
    }
    return null;
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
    calculateJoints();
}

function keydown(event) {
    keysHeld[event.keyCode] = true;
    keysPressed.push(event.key);
    if (event.key = " ") {
        console.log(joints);
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
    joints[0].x = width/2; 
    joints[0].y = height/2;
    calculateJoints();
    drawJoints();
}

function mousedown(event) {
    
}

function load() {
    resize();
    mainLoop = window.setInterval(update, 17);
}

window.addEventListener("resize", resize);
canvas.addEventListener("mousemove", mousemove);
canvas.addEventListener("mousedown", mousedown);
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);
window.setTimeout(load, 500);