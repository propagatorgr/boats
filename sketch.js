let boats = [];
let running = false;
let showForces = true;

const START_X = 60;
const FINISH_X = 720;
const W = 42;
const dt = 0.25;
const F = 0.4;
const K = 0.02;

function setup() {
  const c = createCanvas(820, 420);
  c.parent("sketch-holder");

  document.getElementById("playBtn").onclick = () => running = true;
  document.getElementById("resetBtn").onclick = resetSim;
  document.getElementById("forcesChk").onchange =
    e => showForces = e.target.checked;

  resetSim();
}

function draw() {
  background(235);
  drawWater();

  if (running) {
    boats.forEach(b => b.update());
    if (boats.every(b => b.finished)) running = false;
  }

  boats.forEach(b => b.draw());

  drawFinish();
  updateInfo();
}

class Boat {
  constructor(y, m, col) {
    this.x = START_X;
    this.y = y;
    this.v = 0;
    this.m = m;
    this.col = col;
    this.finished = false;
  }

  update() {
    if (this.finished) return;

    if (this.x + W >= FINISH_X) {
      this.x = FINISH_X - W;
      this.v = 0;
      this.finished = true;
      return;
    }

    const drag = -K * this.v * Math.abs(this.v);
    const a = (F + drag) / this.m;
    this.v += a * dt;
    this.x += this.v * dt;
  }

  draw() {
    fill(this.col);
    rect(this.x, this.y - 10, W, 20, 6);

    if (showForces) {
      stroke(0, 150, 0);
      line(this.x + W, this.y, this.x + W + 26, this.y);

      if (this.v > 0) {
        stroke(180, 0, 0);
        line(this.x, this.y, this.x - 26, this.y);
      }
      noStroke();
    }
  }
}

function drawWater() {
  fill(180, 220, 255);
  rect(0, 90, width, 260);
}

function drawFinish() {
  stroke(0);
  line(FINISH_X, 90, FINISH_X, height);
  noStroke();
  fill(0);
  text("ΤΕΡΜΑ", FINISH_X - 25, 80);
}

function resetSim() {
  boats = [
    new Boat(200, 2, color(60, 130, 255)),
    new Boat(260, 6, color(255, 90, 90))
  ];
  running = false;
}

function updateInfo() {
  document.getElementById("info").innerHTML = `
    <p style="color:#4285f4">■ Ελαφρύ: m=2</p>
    <p style="color:#ff5a52">■ Βαρύ: m=6</p>
  `;
}
