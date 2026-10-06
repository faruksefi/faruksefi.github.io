/*
  CCM-based HP-OD-CCB Model — DEVELOPMENT PROTOTYPE v0.1

  IMPORTANT:
  The equations below are intentionally temporary.
  They exist only to make the complete web interface work visually.
  They MUST be replaced box-by-box with the final Fig. 23 algorithm.
*/

const $ = (id) => document.getElementById(id);

function makePrototypeData() {
  const maxStress = Math.max(1, Number($("maxstress").value) || 56);
  const vcl = Math.max(0.1, Number($("vcl").value) || 7.1);
  const d10 = Math.max(0.01, Number($("d10").value) || 9.7);
  const points = 45;
  const compression = [];
  const breakage = [];

  for (let i = 0; i <= points; i++) {
    const s = maxStress * i / points;

    // TEMPORARY visual-only relations — NOT the scientific model.
    const strain = 0.012 * Math.log1p(s) + 0.115 / (1 + Math.exp(-(s - vcl) / 3.2));
    const B10 = Math.min(0.98, Math.max(0, 1 - Math.exp(-s / (0.48 * maxStress + d10))));

    compression.push({x:s, y:strain});
    breakage.push({x:s, y:B10});
  }
  return {compression, breakage};
}

function drawChart(canvas, data, xLabel, yLabel, yMax, yFormatter) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const m = {l:78, r:24, t:24, b:62};
  const pw = W - m.l - m.r, ph = H - m.t - m.b;

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0,0,W,H);

  const xMax = Math.max(...data.map(p => p.x), 1);
  const actualYMax = yMax || Math.max(...data.map(p => p.y), 1);
  const sx = x => m.l + (x/xMax)*pw;
  const sy = y => m.t + ph - (y/actualYMax)*ph;

  ctx.font = "16px Georgia";
  ctx.fillStyle = "#555";
  ctx.strokeStyle = "#d8d8d8";
  ctx.lineWidth = 1;

  for(let i=0;i<=5;i++){
    const x = xMax*i/5;
    const px = sx(x);
    ctx.beginPath(); ctx.moveTo(px,m.t); ctx.lineTo(px,m.t+ph); ctx.stroke();
    ctx.textAlign="center";
    ctx.fillText(x.toFixed(xMax<10?1:0),px,H-34);
  }

  for(let i=0;i<=5;i++){
    const y = actualYMax*i/5;
    const py = sy(y);
    ctx.beginPath(); ctx.moveTo(m.l,py); ctx.lineTo(m.l+pw,py); ctx.stroke();
    ctx.textAlign="right";
    ctx.fillText(yFormatter ? yFormatter(y) : y.toFixed(2),m.l-10,py+5);
  }

  ctx.strokeStyle="#222"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(m.l,m.t); ctx.lineTo(m.l,m.t+ph); ctx.lineTo(m.l+pw,m.t+ph); ctx.stroke();

  ctx.strokeStyle="#222"; ctx.lineWidth=2.2;
  ctx.beginPath();
  data.forEach((p,i)=>{ const x=sx(p.x), y=sy(p.y); i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
  ctx.stroke();

  ctx.fillStyle="#000"; ctx.textAlign="center"; ctx.font="17px Georgia";
  ctx.fillText(xLabel,m.l+pw/2,H-8);

  ctx.save();
  ctx.translate(20,m.t+ph/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText(yLabel,0,0);
  ctx.restore();
}

function calculate() {
  const {compression, breakage} = makePrototypeData();
  drawChart($("compressionChart"), compression, "σv (MPa)", "εv", 0.20, y=>y.toFixed(2));
  drawChart($("breakageChart"), breakage, "σv,his (MPa)", "B10", 1.0, y=>y.toFixed(1));
}

function resetInputs() {
  $("cycles").value = 4;
  $("increment").value = 1;
  $("origin").value = "Basalt";
  $("d10").value = 9.70;
  $("d50").value = 11.10;
  $("cu").value = 1.30;
  $("dr").value = 50;
  $("vcl").value = 7.10;
  $("maxstress").value = 56;
  calculate();
}

$("calculateBtn").addEventListener("click", calculate);
$("resetBtn").addEventListener("click", resetInputs);
window.addEventListener("load", calculate);
