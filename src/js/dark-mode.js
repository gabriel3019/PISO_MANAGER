/* ================= DARK MODE GLOBAL ================= */

document.addEventListener("DOMContentLoaded", () => {
  aplicarModoOscuro();
});

function aplicarModoOscuro() {
  const dark = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark", dark);
}

function setModoOscuro(activo) {
  localStorage.setItem("darkMode", activo);
  document.body.classList.toggle("dark", activo);
}