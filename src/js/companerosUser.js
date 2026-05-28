const API_URL = "../php/companeros.php";
/* ================= MENU ================= */

const menuToggle =
  document.getElementById("menuToggle");

const sidebar =
  document.getElementById("sidebar");

/* INIT */
/* ================= MENU HAMBURGUESA ================= */

if (menuToggle && sidebar) {

  menuToggle.addEventListener(
    "click",
    () => {

      sidebar.classList.toggle("active");

      menuToggle.classList.toggle("active");

      if (
        sidebar.classList.contains("active")
      ) {

        menuToggle.innerHTML = "✕";

      } else {

        menuToggle.innerHTML = "☰";

      }

    }
  );

}

document.addEventListener("DOMContentLoaded", () => {
  cargarUsuario();
  cargarCompaneros();
});

/* ================= USUARIO ================= */
function cargarUsuario() {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  if (usuario) {
    document.getElementById("nombreUsuario").textContent = usuario.nombre;
  }
}

/* ================= CARGAR COMPAÑEROS ================= */
async function cargarCompaneros() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "listar" })
    });

    const json = await res.json();

    if (json.success) {
      renderCompaneros(json.usuarios);
    }

  } catch (err) {
    console.error("Error:", err);
  }
}

/* ================= RENDER ================= */
function renderCompaneros(lista) {
  const container = document.getElementById("companerosContainer");

  container.innerHTML = "";

  lista.forEach(u => {

    const html = `
      <div class="task">

        <div class="left">
          <div>
            <p>${u.nombre}</p>
            <div class="meta">
              <span class="date">${u.email}</span>
            </div>
          </div>
        </div>

        <div class="right">
          <span>${u.rol}</span>
        </div>

      </div>
    `;

    container.innerHTML += html;
  });
}