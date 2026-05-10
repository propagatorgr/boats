let boats = [];
let running = false;
let phase = "ACCELERATION"; // ACCELERATION, PAUSED, RESUME, FINISHED
let showForces = true;

const START_X = 60;
const FINISH_X = 720;
const BOAT_W  = 42;

const dt = 0.25;
const F_DRIVE = 0.4;
const DRAG_K  = 0.02;

// Κριτήριο οριακής ταχύτητας (σταθεροποίηση)
const DV_EPS = 0.002;
const V_MIN  = 0.5;

function setup() {
  const c = createCanvas(820, 420);
  c.parent("sketch-holder");

  // HTML χειριστήρια (ΟΧΙ p5 UI)
  document.getElementById("playBtn").onclick = () => {
    if (phase !== "PAUSED") running = true;
  };

  document.getElementById("resumeBtn").onclick = () => {
    if (phase === "PAUSED") {
      phase = "RESUME";
      running = true;
      document.getElementById("resumeBtn").disabled = true;
    }
  };

  document.getElementById("resetBtn").onclick = resetSim;
  document.getElementById("forcesChk").onchange =
    e => showForces = e.target.checked;

  resetSim();
}

function draw() {
  background(235);
  drawWater();
  drawFinishLine();

  // ===== ΕΝΗΜΕΡΩΣΗ ΚΙΝΗΣΗΣ =====
  if (running && phase !== "PAUSED" && phase !== "FINISHED") {
    boats.forEach(b => b.update());

    // Τελικός τερματισμός όταν όλα τελειώσουν
    if (boats.every(b => b.finished)) {
      running = false;
      phase = "FINISHED";
    }
  }

  // ===== ΕΛΕΓΧΟΣ ΟΡΙΑΚΗΣ (ΠΑΝΤΑ) =====
  if (phase === "ACCELERATION" && boats.every(b => b.terminalReached)) {
    phase = "PAUSED";
    running = false;
    document.getElementById("resumeBtn").disabled = false;
  }

  boats.forEach(b => b.draw());

  // Σταθερή απόσταση μετά το PAUSE
  if (phase === "PAUSED" || phase === "RESUME") {
    drawDistanceLine();
  }

  updateInfo();
}

/* ================= BOAT ================= */

class Boat {
  constructor(y, m, col) {
    this.x = START_X;
    this.y = y;
    this.m = m;
    this.col = col;

    this.v = 0;
    this.vPrev = 0;

    this.finished = false;
    this.terminalReached = false;
  }

  update() {
    if (this.finished) return;

    this.vPrev = this.v;

    // Ατομικός τερματισμός
    if (this.x + BOAT_W >= FINISH_X) {
      this.x = FINISH_X - BOAT_W;
      this.v = 0;
      this.finished = true;
      return;
    }

    const drag  = -DRAG_K * this.v * Math.abs(this.v);
    const force = F_DRIVE + drag;
    const a     = force / this.m;

    this.v += a * dt;
    this.x += this.v * dt;

    // Ανίχνευση οριακής (Δv≈0)
    if (!this.terminalReached &&
        Math.abs(this.v - this.vPrev) < DV_EPS &&
        Math.abs(this.v) > V_MIN) {
      this.terminalReached = true;
    }
  }

  draw() {
    // Σώμα
    noStroke();
    fill(this.col);
    rect(this.x, this.y - 10, BOAT_W, 20, 6);

    // Σήμα οριακής
    if (this.terminalReached) {
      push();
      translate(this.x + BOAT_W / 2, this.y);
      noFill();
      stroke(0, 180, 0);
      ellipse(0, 0, 32, 32);
      noStroke();
      fill(0, 150, 0);
      textAlign(CENTER, CENTER);
      text("✓", 0, -1);
      pop();
    }

    // Δυνάμεις (με arrowheads)
    if (showForces && phase !== "PAUSED" && !this.finished) {
      push();
      translate(this.x + BOAT_W / 2, this.y);

      // Προώθηση →
      drawArrow(0, -26,  F_DRIVE * 120, color(0,160,0));

      // Αντίσταση ←
      if (this.v > 0.05) {
        drawArrow(0, -26, -DRAG_K * this.v * Math.abs(this.v) * 120, color(220,0,0));
      }
      pop();
    }
  }
}

/* ============== HELPERS ============== */

function drawArrow(x, y, len, col) {
  stroke(col);
  strokeWeight(2);
  fill(col);
  line(x, y, x + len, y);

  const d = len >= 0 ? 1 : -1;
  triangle(
    x + len, y,
    x + len - 8 * d, y - 4,
    x + len - 8 * d, y + 4
  );
}

function drawWater() {
  noStroke();
  fill(180, 220, 255);
  rect(0, 90, width, 260);
}

function drawFinishLine() {
  stroke(0);
  strokeWeight(2);
  line(FINISH_X, 90, FINISH_X, height);
  noStroke();
  fill(0);
  text("ΤΕΡΜΑ", FINISH_X - 25, 80);
}

function drawDistanceLine() {
  stroke(0);
  strokeWeight(2);
  const y = (boats[0].y + boats[1].y) / 2;
  line(
    boats[0].x + BOAT_W / 2, y,
    boats[1].x + BOAT_W / 2, y
  );
  noStroke();
}

function resetSim() {
  boats = [
    new Boat(200, 2, color(60,130,255)),
    new Boat(260, 6, color(255,90,90))
  ];
  running = false;
  phase = "ACCELERATION";
  document.getElementById("resumeBtn").disabled = true;
}

function updateInfo() {
  document.getElementById("info").innerHTML = `
    <p style="color:#4285f4">■ Ελαφρύ: m=2 Kg</p>
    <p style="color:#ff5a52">■ Βαρύ: m=6 Kg</p>
  `;
}
