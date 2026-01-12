import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const body = document.body;
const gate = document.querySelector<HTMLElement>("[data-gate]");
const page = document.querySelector<HTMLElement>("[data-page]");
const openBtn = document.querySelector<HTMLButtonElement>("[data-open]");
const flap = document.querySelector<HTMLElement>("[data-flap]");
const envelope = document.querySelector<HTMLElement>("[data-envelope]");

function unlock() {
  body.classList.remove("is-locked");
  body.classList.add("is-open");
}

/** ------------------ RAIN (solo gate) ------------------ */
type Drop = { x: number; y: number; vy: number; len: number; a: number };

const rainCanvas = document.getElementById("rain-canvas") as HTMLCanvasElement | null;
const rainCtx = rainCanvas?.getContext("2d") ?? null;

let rW = 0;
let rH = 0;
let rDpr = 1;
let drops: Drop[] = [];
let rainRunning = true;

function rr(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function rResize() {
  if (!rainCanvas || !rainCtx) return;
  rDpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  rW = window.innerWidth;
  rH = window.innerHeight;
  rainCanvas.width = Math.floor(rW * rDpr);
  rainCanvas.height = Math.floor(rH * rDpr);
  rainCanvas.style.width = `${rW}px`;
  rainCanvas.style.height = `${rH}px`;
  rainCtx.setTransform(rDpr, 0, 0, rDpr, 0, 0);
}

function seedRain() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    rainRunning = false;
    rainCanvas?.remove();
    return;
  }

  const isMobile = window.matchMedia("(max-width: 719px)").matches;
  const count = isMobile ? 70 : 120;

  drops = [];
  for (let i = 0; i < count; i++) {
    drops.push({
      x: rr(0, rW),
      y: rr(-rH, rH),
      vy: rr(6, 12),
      len: rr(10, 22),
      a: rr(0.05, 0.12),
    });
  }
}

function rainTick() {
  if (!rainCanvas || !rainCtx || !rainRunning) return;

  if (!document.querySelector("[data-gate]")) {
    rainRunning = false;
    rainCtx.clearRect(0, 0, rW, rH);
    return;
  }

  rainCtx.clearRect(0, 0, rW, rH);

  for (const d of drops) {
    d.y += d.vy;
    if (d.y > rH + 30) {
      d.y = rr(-200, -30);
      d.x = rr(0, rW);
      d.vy = rr(6, 12);
    }

    rainCtx.strokeStyle = `rgba(214,111,140,${d.a})`;
    rainCtx.lineWidth = 1;
    rainCtx.beginPath();
    rainCtx.moveTo(d.x, d.y);
    rainCtx.lineTo(d.x, d.y + d.len);
    rainCtx.stroke();
  }

  requestAnimationFrame(rainTick);
}

function initRain() {
  if (!rainCanvas || !rainCtx) return;
  rResize();
  seedRain();
  requestAnimationFrame(rainTick);
}

/** ------------------ PETALS (contenido) ------------------ */
type Petal = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  a: number;
  rot: number;
  vr: number;
  drift: number;
  phase: number;
};

const canvas = document.getElementById("fx-canvas") as HTMLCanvasElement | null;
const ctx = canvas?.getContext("2d") ?? null;

let W = 0;
let H = 0;
let dpr = 1;
let petals: Petal[] = [];
let petalsRunning = false;

function resize() {
  if (!canvas || !ctx) return;
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function makePetal(y?: number): Petal {
  const size = rand(7, 14);
  return {
    x: rand(-40, W + 40),
    y: y ?? rand(-H, 0),
    vx: rand(-0.25, 0.25),
    vy: rand(0.55, 1.25),
    w: size * rand(0.9, 1.25),
    h: size * rand(1.1, 1.9),
    a: rand(0.10, 0.22),
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.02, 0.02),
    drift: rand(0.5, 1.4),
    phase: rand(0, Math.PI * 2),
  };
}

function seedPetals() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    petalsRunning = false;
    canvas?.remove();
    return;
  }

  const isMobile = window.matchMedia("(max-width: 719px)").matches;
  const count = isMobile ? 26 : 44;

  petals = [];
  for (let i = 0; i < count; i++) petals.push(makePetal(rand(-H, H)));
}

function drawPetal(p: Petal) {
  if (!ctx) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);

  const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, p.h * 2.2);
  grad.addColorStop(0, `rgba(244, 230, 233, ${p.a})`);
  grad.addColorStop(0.55, `rgba(214, 111, 140, ${p.a * 0.75})`);
  grad.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, p.w, p.h, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(214, 111, 140, ${p.a * 0.20})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function petalsTick() {
  if (!canvas || !ctx || !petalsRunning) return;

  ctx.clearRect(0, 0, W, H);

  for (let i = 0; i < petals.length; i++) {
    const p = petals[i];

    p.phase += 0.01;
    p.x += p.vx + Math.sin(p.phase) * (0.25 * p.drift);
    p.y += p.vy;
    p.rot += p.vr;

    if (p.y > H + 60) {
      petals[i] = makePetal(rand(-220, -40));
      continue;
    }
    if (p.x < -120) p.x = W + 120;
    if (p.x > W + 120) p.x = -120;

    drawPetal(p);
  }

  requestAnimationFrame(petalsTick);
}

function startPetals() {
  if (!canvas || !ctx) return;
  resize();
  seedPetals();
  petalsRunning = true;
  requestAnimationFrame(petalsTick);
}

/** ------------------ OPEN FLOW ------------------ */
function openInvitation() {
  if (!gate || !page || !flap || !envelope || !openBtn) return;

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.to(openBtn, { autoAlpha: 0, y: -6, duration: 0.20 }, 0)
    .to(flap, { rotateX: -155, duration: 0.85 }, 0.06)
    .to(envelope, { y: -10, duration: 0.45 }, 0.10)
    .to(
      gate,
      {
        autoAlpha: 0,
        duration: 0.55,
        onComplete: () => gate.remove(),
      },
      0.70
    )
    .add(() => {
      unlock();
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      startPetals();
    }, 0.72)
    .to(page, { autoAlpha: 1, y: 0, duration: 0.55 }, 0.78)
    .add(() => ScrollTrigger.refresh(), 1.05);
}

openBtn?.addEventListener("click", openInvitation);

/** ------------------ REVEAL ------------------ */
const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
reveals.forEach((el) => {
  gsap.fromTo(
    el,
    { autoAlpha: 0, y: 14, filter: "blur(10px)" },
    {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.85,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none reverse",
      },
    }
  );
});

window.addEventListener("resize", () => {
  rResize();
  seedRain();
  resize();
  seedPetals();
});

initRain();