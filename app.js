// Plastic properties
const plastics = {
  PET: { name: "PET", color: "#4ea8de", initialMass: 10, k: 0.035 }, // Fast
  PP: { name: "PP", color: "#f9c74f", initialMass: 10, k: 0.018 }, // Moderate
  PE: { name: "PE", color: "#90be6d", initialMass: 10, k: 0.008 }, // Slow
};
let selectedPlastic = "PET";
let uvIntensity = 70;
let time = 0;
let mass = plastics[selectedPlastic].initialMass;
let running = true;
let data = [{ t: 0, m: mass }];
let animationId;

// Canvas setup
const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// UI elements
if (document.getElementById("plasticType")) {
  document.getElementById("plasticType").addEventListener("change", (e) => {
    selectedPlastic = e.target.value;
    document.getElementById("legendColor").style.background =
      plastics[selectedPlastic].color;
    resetSimulation();
  });
}
if (document.getElementById("uvIntensity")) {
  document.getElementById("uvIntensity").addEventListener("input", (e) => {
    uvIntensity = +e.target.value;
    document.getElementById("uvValue").textContent = uvIntensity + "%";
  });
}
if (document.getElementById("resetBtn")) {
  document
    .getElementById("resetBtn")
    .addEventListener("click", resetSimulation);
}

function resetSimulation() {
  time = 0;
  mass = plastics[selectedPlastic].initialMass;
  data = [{ t: 0, m: mass }];
  running = true;
  cancelAnimationFrame(animationId);
  drawGraph();
  animate();
}

// Exponential decay: m(t) = m0 * exp(-k * UV * t)
function step() {
  if (!running) return;
  const k = plastics[selectedPlastic].k * (uvIntensity / 100);
  time += 0.1;
  mass = plastics[selectedPlastic].initialMass * Math.exp(-k * time);
  if (mass < 0.01) {
    mass = 0;
    running = false;
  }
  data.push({ t: time, m: mass });
  if (data.length > 300) data.shift();
}

function drawGraph() {
  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Axes
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 10);
  ctx.lineTo(40, canvas.height - 30);
  ctx.lineTo(canvas.width - 10, canvas.height - 30);
  ctx.stroke();
  // Labels
  ctx.fillStyle = "#333";
  ctx.font = "14px Arial";
  ctx.fillText("Time (min)", canvas.width / 2 - 30, canvas.height - 8);
  ctx.save();
  ctx.translate(12, canvas.height / 2 + 30);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Mass (g)", 0, 0);
  ctx.restore();
  // Data
  ctx.strokeStyle = plastics[selectedPlastic].color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  let maxT = Math.max(...data.map((d) => d.t), 10);
  let maxM = plastics[selectedPlastic].initialMass;
  for (let i = 0; i < data.length; i++) {
    let x = 40 + (canvas.width - 60) * (data[i].t / maxT);
    let y = canvas.height - 30 - (canvas.height - 60) * (data[i].m / maxM);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current value
  ctx.fillStyle = plastics[selectedPlastic].color;
  ctx.beginPath();
  let last = data[data.length - 1];
  let x = 40 + (canvas.width - 60) * (last.t / maxT);
  let y = canvas.height - 30 - (canvas.height - 60) * (last.m / maxM);
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.fill();
  // Y-axis ticks
  ctx.fillStyle = "#555";
  ctx.font = "12px Arial";
  for (let i = 0; i <= 5; i++) {
    let m = maxM * (1 - i / 5);
    let yTick = canvas.height - 30 - (canvas.height - 60) * (m / maxM);
    ctx.fillText(m.toFixed(1), 8, yTick + 4);
  }
  // X-axis ticks
  for (let i = 0; i <= 5; i++) {
    let t = maxT * (i / 5);
    let xTick = 40 + (canvas.width - 60) * (t / maxT);
    ctx.fillText(t.toFixed(1), xTick - 10, canvas.height - 12);
  }
}

function animate() {
  if (running) step();
  drawGraph();
  if (running) animationId = requestAnimationFrame(animate);
}
// Start
resetSimulation();
// --- INTERACTIVE TOOLTIP ---
let tooltip = document.createElement("div");
tooltip.style.position = "fixed";
tooltip.style.pointerEvents = "none";
tooltip.style.background = "rgba(255,255,255,0.95)";
tooltip.style.border = "1px solid #4ea8de";
tooltip.style.borderRadius = "6px";
tooltip.style.padding = "6px 12px";
tooltip.style.font = "14px Arial";
tooltip.style.color = "#222";
tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
tooltip.style.display = "none";
tooltip.style.zIndex = "1000";
document.body.appendChild(tooltip);

canvas.addEventListener("mousemove", function (e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  // Axes and graph area
  let maxT = Math.max(...data.map((d) => d.t), 10);
  let maxM = plastics[selectedPlastic].initialMass;
  // Find closest data point
  let minDist = 9999,
    closest = null;
  for (let i = 0; i < data.length; i++) {
    let x = 40 + (canvas.width - 60) * (data[i].t / maxT);
    let y = canvas.height - 30 - (canvas.height - 60) * (data[i].m / maxM);
    let dist = Math.hypot(mx - x, my - y);
    if (dist < minDist) {
      minDist = dist;
      closest = { x, y, t: data[i].t, m: data[i].m };
    }
  }
  if (closest && minDist < 18) {
    tooltip.style.display = "block";
    tooltip.innerHTML = `<b>Time:</b> ${closest.t.toFixed(
      2
    )} min<br><b>Mass:</b> ${closest.m.toFixed(3)} g`;
    tooltip.style.left = e.clientX + 16 + "px";
    tooltip.style.top = e.clientY - 8 + "px";
  } else {
    tooltip.style.display = "none";
  }
});
canvas.addEventListener("mouseleave", function () {
  tooltip.style.display = "none";
});
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  let maxT = Math.max(...data.map((d) => d.t), 10);
  let maxM = plastics[selectedPlastic].initialMass;
  let minDist = 9999,
    closest = null;
  for (let i = 0; i < data.length; i++) {
    let x = 40 + (canvas.width - 60) * (data[i].t / maxT);
    let y = canvas.height - 30 - (canvas.height - 60) * (data[i].m / maxM);
    let dist = Math.hypot(mx - x, my - y);
    if (dist < minDist) {
      minDist = dist;
      closest = { x, y, t: data[i].t, m: data[i].m };
    }
  }
  if (closest && minDist < 18) {
    tooltip.style.display = "block";
    tooltip.innerHTML = `<b>Time:</b> ${closest.t.toFixed(
      2
    )} min<br><b>Mass:</b> ${closest.m.toFixed(3)} g`;
    tooltip.style.left = e.clientX + 16 + "px";
    tooltip.style.top = e.clientY - 8 + "px";
    setTimeout(() => {
      tooltip.style.display = "none";
    }, 1800);
  }
});
