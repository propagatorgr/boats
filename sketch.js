let boats = [];
let running = false;
let phase = "ACCELERATION"; // ACCELERATION, PAUSED, RESUME, FINISHED

const START_X = 80;
const FINISH_X = 680;
const BOAT_WIDTH = 42;

const F_DRIVE = 0.4;
const DRAG_K = 0.02;
const dt = 0.25;

const DV_EPS = 0.002;
const V_MIN = 0.5;

let playBtn, resumeBtn, resetBtn;
let forcesCheckbox, showForces = true;

function setup() {
  createCanvas(900, 420);

  playBtn = createButton("▶ Play");
  playBtn.position(20, 450);
  playBtn.mousePressed(() => running = true);

  resumeBtn = createButton("▶ Resume");
  resumeBtn.position(100, 450);
  resumeBtn.mousePressed(resumeSimulation);
  resumeBtn.attribute("disabled", "");

  resetBtn = createButton("⟲ Reset");
  resetBtn.position(200, 450);
  resetBtn.mousePressed(resetSimulation);

  forcesCheckbox = createCheckbox("Εμφάνιση δυνάμεων", true);
  forcesCheckbox.position(320, 450);
  forcesCheckbox.changed(() => {
    showForces = forcesCheckbox.checked();
  });

  resetSimulation();
}

function draw() {
  background(235);

  drawHeader();
  drawWater();
  drawFinishLine();

  if (running && phase !== "PAUSED" && phase !== "FINISHED") {
    for (let b of boats) {
      b.update();
    }

    // Παύση στην οριακή ταχύτητα (και τα δύο)
    if (
      phase === "ACCELERATION" &&
      boats.every(b => b.terminalReached)
    ) {
      phase = "PAUSED";
      running = false;

      boats.forEach(b => {
        b.terminalReached = true;
        b.terminalAnim = 1;
      });

      playBtn.attribute("disabled", "");
      resumeBtn.removeAttribute("disabled");
    }

    // Τερματισμός προσομοίωσης
    if (boats.every(b => b.finished)) {
      running = false;
      phase = "FINISHED";
    }
  }

  for (let b of boats) {
    b.display();
    if (showForces && phase !== "PAUSED" && !b.finished) {
      b.drawForces();
    }
  }

  if (phase !== "ACCELERATION") {
    drawDistanceLine();
  }

  displayStatsPanel();
  displayLegend();
}

/* ===================== BOAT ===================== */

class Boat {
  constructor(y, m, col, label) {
    this.x = START_X;
    this.y = y;
    this.m = m;
    this.col = col;
    this.label = label;

    this.v = 0;
    this.vPrev = 0;
    this.time = 0;

    this.finished = false;
    this.terminalReached = false;
    this.terminalAnim = 0;
  }

  update() {
    if (this.finished) return;

    this.vPrev = this.v;

    // Έλεγχος τερματισμού ΑΝΑ ΚΑΡΑΒΙ
    if (this.x + BOAT_WIDTH >= FINISH_X) {
      this.x = FINISH_X - BOAT_WIDTH;
      this.v = 0;
      this.finished = true;
      return;
    }

    let drag = -DRAG_K * this.v * abs(this.v);
    let force = F_DRIVE + drag;
    let a = force / this.m;

    this.v += a * dt;
    this.x += this.v * dt;
    this.time += dt;

    // Ανίχνευση οριακής ταχύτητας
    if (
      !this.terminalReached &&
      abs(this.v - this.vPrev) < DV_EPS &&
      abs(this.v) > V_MIN
    ) {
      this.terminalReached = true;
      this.terminalAnim = 1;
    }
  }

  display() {
    fill(this.col);
    rect(this.x, this.y - 10, BOAT_WIDTH, 20, 6);

    if (this.terminalReached) {
      push();
      translate(this.x + BOAT_WIDTH / 2, this.y);
      noFill();
      stroke(0, 180, 0);
      strokeWeight(2);
      ellipse(0, 0, 34, 34);
      noStroke();
      fill(0, 150, 0);
      textAlign(CENTER, CENTER);
      textSize(18);
      text("✓", 0, -1);
      pop();
    }
  }

  drawForces() {
    push();
    translate(this.x + BOAT_WIDTH / 2, this.y);

    // Προώθηση
    drawArrow(0, -28, F_DRIVE * 120, color(0, 160, 0));

    // Αντίσταση
    if (this.v > 0.05) {
      drawArrow(0, -28, -DRAG_K * this.v * abs(this.v) * 120, color(220, 0, 0));
    }

    pop();
  }
}

/* ===================== HELPERS ===================== */

function drawArrow(x, y, len, col) {
  stroke(col);
  strokeWeight(2);
  fill(col);
  line(x, y, x + len, y);
  let d = len > 0 ? 1 : -1;
  triangle(
    x + len,
    y,
    x + len - 8 * d,
    y - 4,
    x + len - 8 * d,
    y + 4
  );
}

function drawDistanceLine() {
  stroke(0);
  strokeWeight(2);
  let y = (boats[0].y + boats[1].y) / 2;
  line(
    boats[0].x + BOAT_WIDTH / 2,
    y,
    boats[1].x + BOAT_WIDTH / 2,
    y
  );
  noStroke();
}

/* ===================== UI ===================== */

function drawHeader() {
  fill(240);
  rect(0, 0, width, 90);
  fill(0);
  textSize(16);
  text("Απόκτηση οριακής ταχύτητας ανά σώμα", 20, 30);
  text(
    "Το κάθε σώμα αποκτά την οριακή ταχύτητα σε διαφορετική στιγμή",
    20,
    55
  );
}

function drawWater() {
  fill(180, 220, 255);
  rect(0, 110, FINISH_X + 20, 250);
}

function drawFinishLine() {
  stroke(0);
  strokeWeight(2);
  line(FINISH_X, 110, FINISH_X, height - 40);
  noStroke();
  fill(0);
  text("ΤΕΡΜΑ", FINISH_X - 25, 105);
}

/* ===================== PANELS ===================== */

function displayStatsPanel() {
  let x = FINISH_X + 25;
  let y = 120;

  fill(255, 255, 255, 230);
  rect(x, y, 180, 120, 10);

  fill(0);
  textSize(13);
  text("ΣΤΟΙΧΕΙΑ", x + 20, y + 25);

  let ty = y + 55;
  for (let b of boats) {
    fill(b.col);
    rect(x + 20, ty - 10, 12, 12, 3);
    fill(0);
    text(
      `${b.label}: m=${b.m}, t=${b.time.toFixed(0)}`,
      x + 40,
      ty
    );
    ty += 30;
  }
}

function displayLegend() {
  let x = FINISH_X + 25;
  let y = 220;          // ⬆ ΔΕΝ κόβεται
  let h = 145;

  fill(255, 255, 255, 230);
  rect(x, y, 180, h, 10);

  fill(0);
  textSize(12);
  text("ΥΠΟΜΝΗΜΑ", x + 15, y + 20);

  // Προώθηση
  push();
  translate(x + 40, y + 45);
  drawArrow(0, 0, 25, color(0, 160, 0));
  pop();
  text("Προωστική δύναμη", x + 75, y + 49);

  // Αντίσταση
  push();
  translate(x + 40, y + 70);
  drawArrow(0, 0, -25, color(220, 0, 0));
  pop();
  text("Αντίσταση νερού", x + 75, y + 74);

  text("✓  Οριακή ταχύτητα", x + 20, y + 105);

  stroke(0);
  line(x + 20, y + 125, x + 60, y + 125);
  noStroke();
  text("Σταθερή απόσταση", x + 75, y + 129);
}

/* ===================== CONTROLS ===================== */

function resumeSimulation() {
  phase = "RESUME";
  running = true;
  resumeBtn.attribute("disabled", "");
}

function resetSimulation() {
  boats = [
    new Boat(210, 2, color(60, 130, 255), "Ελαφρύ"),
    new Boat(270, 6, color(255, 90, 90), "Βαρύ")
  ];

  running = false;
  phase = "ACCELERATION";

  playBtn.removeAttribute("disabled");
  resumeBtn.attribute("disabled", "");
}
