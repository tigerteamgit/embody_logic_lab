/* ---- Blog reader: preview vs full ---- */
const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") || "full"; // preview or full

// Load 1 file for preview, 1 file for full (simple + reliable)
const file = mode === "preview" ? "files/preview.html" : "files/full.html";

async function loadContent() {
  const el = document.getElementById("content");

  try {
    console.log("Loading:", file);

    const res = await fetch(file, { cache: "no-store" });
    console.log("Result:", file, res.status);

    if (!res.ok) throw new Error(`${file} -> HTTP ${res.status}`);

    el.innerHTML = await res.text();
  } catch (err) {
    console.error("Content load failed:", err);
    if (el) {
      el.innerHTML = `<h2>Error loading content</h2><pre>${String(err)}</pre>`;
    }
  }
}

loadContent();
