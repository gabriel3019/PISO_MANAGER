/* ================= DARK MODE GLOBAL ================= */

document.addEventListener("DOMContentLoaded", () => {
  aplicarModoOscuro();
});

/* ================= APLICAR ================= */
function aplicarModoOscuro() {
  const dark = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark", dark);
}

/* ================= CAMBIAR (OPCIONAL GLOBAL) ================= */
function setModoOscuro(activo) {
  localStorage.setItem("darkMode", activo);
  document.body.classList.toggle("dark", activo);
}