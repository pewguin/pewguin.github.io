const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width;
let height;

//* ball constants
const wallCoefficientOfReciprocity = 0.6;
const blockCoefficientOfReciprocity = 0.5;
const sizeOfBall = 10;

const speed = 0.001;

let xVel = 0;
let yVel = 0;

let x = 0;
let y = 0;

let mouseX;
let mouseY;

//* block constants
const blockColumns = 10;
const blockRows = 5;

const blockPadding = 16;

const blockSpawnRange = 300;

let blockWidth = 0;
let blockHeight = 0;

let blocks = [];
for (let w = 0; w < blockColumns; w++) {
    blocks[w] = [];
    for (let h = 0; h < blockRows; h++) {
        blocks[w][h] = { x: 0, y: 0, hp: 0 };
        blocks[w][h].hp = blockRows - (h+1);
    }
}

function resize(event) {
    width = window.innerWidth;
    canvas.width = width;
    height = window.innerHeight-document.getElementById("header").clientHeight;
    canvas.height = height;
}

function load() {
    resize();
    x = width/2;
    y = height-sizeOfBall;
    mouseX = x;
    mouseY = y;
    setInterval(update, 20);
}

function drawBlocks() {
    blockWidth = (width-blockPadding)/blockColumns-blockPadding;
    blockHeight = (blockSpawnRange-blockPadding)/blockRows-blockPadding;
    for (let w = 0; w < blockColumns; w++) {
        for (let h = 0; h < blockRows; h++) {
            if (blocks[w][h].hp >= 0) {
                ctx.beginPath();
                blocks[w][h].x = blockPadding + w * (blockWidth + blockPadding);
                blocks[w][h].y = blockPadding + h * (blockHeight + blockPadding);
                ctx.rect(blocks[w][h].x, blocks[w][h].y, blockWidth, blockHeight);
                let rgb = hsvToRgb(1-((blockRows - blocks[w][h].hp)/blockRows), 1, 1);
                ctx.fillStyle = rgb;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function collideWithBlocksX() {
    for (let w = 0; w < blockColumns; w++) {
        for (let h = 0; h < blockRows; h++) {
            let block = blocks[w][h];
            if (x-sizeOfBall < block.x+blockWidth && x+sizeOfBall > block.x &&
                y+sizeOfBall > block.y && y-sizeOfBall < block.y+blockHeight &&
                block.hp >= 0) {
                if (block.x + blockWidth/2 - x < 0) {
                    if (Math.abs(xVel) != xVel) {
                        xVel = Math.abs(xVel) * blockCoefficientOfReciprocity;
                    }
                } else {
                    if (-Math.abs(xVel) != xVel) {
                        xVel = -Math.abs(xVel) * blockCoefficientOfReciprocity;
                    }
                }
            }
        }
    }
}
function collideWithBlocksY() {
    for (let w = 0; w < blockColumns; w++) {
        for (let h = 0; h < blockRows; h++) {
            let block = blocks[w][h];
            if (x-sizeOfBall < block.x+blockWidth && x+sizeOfBall > block.x &&
                y+sizeOfBall > block.y && y-sizeOfBall < block.y+blockHeight &&
                block.hp >= 0) {
                block.hp--;
                if (block.y + blockHeight/2 - y < 0) {
                    if (Math.abs(yVel) != yVel) {
                        yVel = Math.abs(yVel) * wallCoefficientOfReciprocity;
                    }
                } else {
                    if (-Math.abs(yVel) != yVel) {
                        yVel = -Math.abs(yVel) * wallCoefficientOfReciprocity;
                    }
                }
            }
        }
    }
}

function update() {
    ctx.beginPath();
    ctx.rect(0,0,width,height);
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fill();
    ctx.closePath();

    drawBlocks();

    xVel += (mouseX - x) * speed;
    yVel += (mouseY - y) * speed;

    if (x < 0+(sizeOfBall)) {
        if (Math.abs(xVel) != xVel) {
            xVel = Math.abs(xVel) * wallCoefficientOfReciprocity;
        }
    } else if (x > width-(sizeOfBall)) {
        if (-Math.abs(xVel) != xVel) {
            xVel = -Math.abs(xVel) * wallCoefficientOfReciprocity;
        }
    }
    if (y < 0+(sizeOfBall)) {
        if (Math.abs(yVel) != yVel) {
            yVel = Math.abs(yVel) * wallCoefficientOfReciprocity;
        }
    } else if (y > height-(sizeOfBall)) {
        if (-Math.abs(yVel) != yVel) {
            yVel = -Math.abs(yVel) * wallCoefficientOfReciprocity;
        }
    }

    x += xVel;
    collideWithBlocksX();
    y += yVel;
    collideWithBlocksY();
    
    ctx.beginPath();
    ctx.ellipse(x,y,sizeOfBall,sizeOfBall,0,0,Math.PI*2)
    ctx.fillStyle = "rgb(255, 0, 120)";
    ctx.fill();
    ctx.closePath();
}

function mousemove(event) {
    mouseX = event.pageX;
    mouseY = event.pageY-100;
}

function mousedown(event) {
    if (event.button == 0) {
    }
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

window.addEventListener("resize", resize);
canvas.addEventListener("mousemove", mousemove);
canvas.addEventListener("mousedown", mousedown);
setTimeout(load, 500);