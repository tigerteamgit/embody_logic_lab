<script>
/* ---- Charts (Somatic first, then Creative) ---- */
(() => {
  const CHART_H = 150;
  let somaticChart = null;
  let creativeChart = null;

  function lockCanvasHeight(canvas, px){
    if(!canvas) return;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = px + "px";
    canvas.style.maxHeight = px + "px";
    const w = Math.max(
      1,
      Math.round(
        canvas.getBoundingClientRect().width ||
        canvas.parentElement?.getBoundingClientRect().width ||
        600
      )
    );
    canvas.width = w;
    canvas.height = px;
  }

  function destroyCharts(){
    if(somaticChart){ somaticChart.destroy(); somaticChart = null; }
    if(creativeChart){ creativeChart.destroy(); creativeChart = null; }
  }

  /* ---- Options ---- */
  function buildOptions(){
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 260, easing: "easeOutQuart" },
      layout: { padding: 0 },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          displayColors: false,
          callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.y}` }
        }
      },
      interaction: { mode: "nearest", intersect: false },
      events: ["mousemove","mouseout","click","touchstart","touchmove"],
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { maxTicksLimit: 5 } },
        x: { ticks: { autoSkip: false, maxRotation: 25, minRotation: 25 } }
      }
    };
  }

  /* ---- Color helpers (darker = higher value) ---- */
  function normalizeValues(values){
    const nums = values.map(v => Number(v) || 0);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const span = max - min;
    if(span <= 0) return nums.map(() => 0.5);
    return nums.map(v => (v - min) / span);
  }

  function blackByValue(values){
    const t = normalizeValues(values);
    const lightLow = 62;
    const lightHigh = 10;
    return t.map(x => `hsl(0, 0%, ${Math.round(lightLow + (lightHigh - lightLow) * x)}%)`);
  }

  function blueByValue(values){
    const t = normalizeValues(values);
    const hue = 210;
    const sat = 78;
    const lightLow = 72;
    const lightHigh = 26;
    return t.map(x => `hsl(${hue}, ${sat}%, ${Math.round(lightLow + (lightHigh - lightLow) * x)}%)`);
  }

  /* ---- Flat polish (NO bevel / NO rounding) ---- */
  function applyPolish(chart, makeColorsFn){
    const ds = chart.data.datasets[0];
    const vals = ds.data.map(v => Number(v) || 0);

    const base = makeColorsFn(vals);

    let maxIdx = 0;
    for(let i = 1; i < vals.length; i++){
      if(vals[i] > vals[maxIdx]) maxIdx = i;
    }

    // Subtle emphasis WITHOUT bevel: just slightly stronger outline on max bar
    const isBlackFamily = base[0].startsWith("hsl(0, 0%");
    const maxBoostBorder = isBlackFamily ? "hsl(0, 0%, 6%)" : "hsl(210, 82%, 22%)";

    ds.backgroundColor = base;

    // Keep bars perfectly straight/flat
    ds.borderRadius = 0;
    ds.borderSkipped = false;

    // Light borders so it stays flat
    ds.borderColor = base.map((c, i) => (i === maxIdx ? maxBoostBorder : c));
    ds.borderWidth = vals.map((_, i) => (i === maxIdx ? 1.5 : 1));

    // Keep spacing polish
    ds.barPercentage = 0.78;
    ds.categoryPercentage = 0.86;

    // Flat hover (no “shadow” effect)
    ds.hoverBackgroundColor = base;
    ds.hoverBorderWidth = vals.map((_, i) => (i === maxIdx ? 2 : 1.5));
  }

  function renderCharts(){
    console.log("[CEL] renderCharts v2026-02-24 flat-polish");
    if(typeof Chart === "undefined"){
      console.error("[CEL] Chart.js is not loaded. Make sure the CDN script is BEFORE this script.");
      return;
    }

    const somaticCanvas = document.getElementById("somaticChart");
    const creativeCanvas = document.getElementById("creativeChart");

    if(!somaticCanvas || !creativeCanvas){
      console.error("[CEL] Missing canvas element(s). Expected #somaticChart and #creativeChart.");
      console.log("somaticCanvas:", somaticCanvas, "creativeCanvas:", creativeCanvas);
      return;
    }

    destroyCharts();

    lockCanvasHeight(somaticCanvas, CHART_H);
    lockCanvasHeight(creativeCanvas, CHART_H);

    /* ---- SOMATIC DATA (first) ---- */
    const somaticValues = [18, 14, 0, 5, 9];
    const somaticData = {
      labels: ["Somatic Index", "Embodied Expansion", "Range", "Recovery", "Integration Gap"],
      datasets: [{
        label: "Somatic Scores",
        data: somaticValues
      }]
    };

    /* ---- CREATIVE DATA (second) ---- */
    const creativeValues = [10, 5, 5, 0, 0];
    const creativeData = {
      labels: [
        "Creative Index",
        "Fluency",
        "Flexibility",
        "Associative Strength",
        //"Perspective Shift",
        //"Ambiguity Tolerance",
        "Complexity Handling"
      ],
      datasets: [{
        label: "Creative Scores",
        data: creativeValues
      }]
    };

    const options = buildOptions();

    somaticChart = new Chart(somaticCanvas, { type: "bar", data: somaticData, options });
    creativeChart = new Chart(creativeCanvas, { type: "bar", data: creativeData, options });

    // Apply ramps AFTER init (prevents defaults overriding)
    const forcePolish = () => {
      if(!somaticChart || !creativeChart) return;
      applyPolish(somaticChart, blackByValue);
      applyPolish(creativeChart, blueByValue);
      somaticChart.update();
      creativeChart.update();
    };

    // A couple passes to ensure it "wins" if any late sizing/defaults happen
    forcePolish();
    requestAnimationFrame(forcePolish);
    setTimeout(forcePolish, 0);
    setTimeout(forcePolish, 50);

    requestAnimationFrame(() => {
      lockCanvasHeight(somaticCanvas, CHART_H);
      lockCanvasHeight(creativeCanvas, CHART_H);
      somaticChart.resize();
      creativeChart.resize();
    });

    window.addEventListener("resize", () => {
      lockCanvasHeight(somaticCanvas, CHART_H);
      lockCanvasHeight(creativeCanvas, CHART_H);
      if(somaticChart) somaticChart.resize();
      if(creativeChart) creativeChart.resize();
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", renderCharts);
})();
</script>
