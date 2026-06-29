const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
const hudShell = document.getElementById("hudShell");
const coreWrap = document.getElementById("coreWrap");
const micButton = document.getElementById("micButton");
const timeDisplay = document.getElementById("timeDisplay");
const commandText = document.getElementById("commandText");
const statusText = document.getElementById("statusText");
const codeFeed = document.getElementById("codeFeed");
const loadValue = document.getElementById("loadValue");
const signalValue = document.getElementById("signalValue");
const syncValue = document.getElementById("syncValue");
const waveform = document.getElementById("waveform");

let width = 0;
let height = 0;
let particles = [];
let active = false;

const commands = [
  "Calibrating acoustic matrix",
  "Mapping neural response layer",
  "Secure channel established",
  "Command layer standing by",
  "Synthetic cognition shell active",
  "Interface stabilized"
];

const logs = [
  "voice kernel synchronized",
  "gesture layer mapped",
  "visual telemetry locked",
  "ambient scan complete",
  "response engine ready",
  "local shell optimized",
  "threat surface clean",
  "memory gate secured"
];

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * window.devicePixelRatio);
  canvas.height = Math.floor(height * window.devicePixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  createParticles();
}

function createParticles() {
  const count = Math.min(130, Math.floor((width * height) / 10000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.9 + 0.45,
    vx: (Math.random() - 0.5) * 0.38,
    vy: (Math.random() - 0.5) * 0.38,
    alpha: Math.random() * 0.62 + 0.18
  }));
}

function drawParticles() {
  ctx.clearRect(0, 0, width, height);

  for (const particle of particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(103, 232, 249, ${particle.alpha})`;
    ctx.fill();
  }

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 115) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(103, 232, 249, ${0.11 * (1 - distance / 115)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(drawParticles);
}

function buildWaveform() {
  const bars = 42;
  waveform.innerHTML = "";

  for (let i = 0; i < bars; i += 1) {
    const bar = document.createElement("i");
    bar.style.setProperty("--delay", `${i * 0.035}s`);
    bar.style.height = `${12 + Math.random() * 32}px`;
    waveform.appendChild(bar);
  }
}

function updateClock() {
  const now = new Date();
  timeDisplay.textContent = now.toLocaleTimeString("en-IN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function updateMetrics() {
  const load = randomBetween(62, 88);
  const signal = randomBetween(84, 99);
  const sync = randomBetween(76, 96);

  loadValue.textContent = `${load}%`;
  signalValue.textContent = `${signal}%`;
  syncValue.textContent = `${sync}%`;

  loadValue.closest(".metric").querySelector("i").style.setProperty("--value", `${load}%`);
  signalValue.closest(".metric").querySelector("i").style.setProperty("--value", `${signal}%`);
  syncValue.closest(".metric").querySelector("i").style.setProperty("--value", `${sync}%`);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pushLog() {
  const line = document.createElement("p");
  const log = logs[Math.floor(Math.random() * logs.length)];
  line.textContent = `> ${log}...`;
  codeFeed.appendChild(line);

  while (codeFeed.children.length > 6) {
    codeFeed.removeChild(codeFeed.firstElementChild);
  }
}

function toggleActive() {
  active = !active;
  hudShell.classList.toggle("active", active);

  const command = commands[Math.floor(Math.random() * commands.length)];
  commandText.textContent = active ? command : "Tap the core to activate visual response";
  statusText.textContent = active ? "Listening" : "Awaiting command";

  pushLog();
}

function handleParallax(event) {
  const x = (event.clientX / width - 0.5) * 14;
  const y = (event.clientY / height - 0.5) * 14;
  coreWrap.style.transform = `rotateX(${-y}deg) rotateY(${x}deg)`;
}

function resetParallax() {
  coreWrap.style.transform = "rotateX(0deg) rotateY(0deg)";
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("mousemove", handleParallax);
window.addEventListener("mouseleave", resetParallax);
coreWrap.addEventListener("click", toggleActive);
micButton.addEventListener("click", toggleActive);

resizeCanvas();
buildWaveform();
drawParticles();
updateClock();
updateMetrics();

setInterval(updateClock, 1000);
setInterval(updateMetrics, 2400);
setInterval(pushLog, 3000);
