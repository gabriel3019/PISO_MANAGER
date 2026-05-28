
const API_URL = "../php/companeros.php";

/* ================= MENU ================= */

const menuToggle =
  document.getElementById("menuToggle");

const sidebar =
  document.getElementById("sidebar");

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

/* ================= INIT ================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    cargarUsuario();

    cargarCompaneros();

  }
);

/* ================= USUARIO ================= */

function cargarUsuario() {

  const usuario =
    JSON.parse(
      sessionStorage.getItem("usuario")
    );

  if (usuario) {

    document.getElementById(
      "nombreUsuario"
    ).textContent = usuario.nombre;

  }

}

/* ================= CARGAR COMPAÑEROS ================= */

async function cargarCompaneros() {

  try {

    const res = await fetch(
      API_URL,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          action: "listar"
        })

      }
    );

    const json = await res.json();

    if (json.success) {

      renderCompaneros(
        json.usuarios
      );

    }

  } catch (err) {

    console.error(
      "Error:",
      err
    );

  }

}

/* ================= RENDER ================= */

function renderCompaneros(lista) {

  const container =
    document.getElementById(
      "companerosContainer"
    );

  container.innerHTML = "";

  lista.forEach(u => {

    const div =
      document.createElement("div");

    div.className = "companero";

    div.innerHTML = `

      <div class="left">

        <img
          src="../${u.foto}"
          class="mini-avatar"
        >

        <div>

          <p>${u.nombre}</p>

          <div class="meta">

            <span class="date">
              ${u.email}
            </span>

          </div>

        </div>

      </div>

      <div class="right">

        <span>
          ${u.rol || "Usuario"}
        </span>

      </div>

    `;

    /* CLICK */

    div.addEventListener(
      "click",
      () => {

        abrirModal(u);

      }
    );

    container.appendChild(div);

  });

}

/* ================= MODAL ================= */

const modalOverlay =
  document.getElementById(
    "modalOverlay"
  );

/* ================= ABRIR MODAL ================= */

function abrirModal(u) {

  document.getElementById(
    "modalNombre"
  ).textContent =
    u.nombre || "Sin nombre";

  document.getElementById(
    "modalEmail"
  ).textContent =
    u.email || "Sin email";

  document.getElementById(
    "modalRol"
  ).textContent =
    u.rol || "Usuario";

  document.getElementById(
    "modalTelefono"
  ).textContent =
    u.telefono || "-";

  document.getElementById(
    "modalDni"
  ).textContent =
    u.dni || "-";

  document.getElementById(
    "modalFoto"
  ).src =
    "../" + u.foto;

  modalOverlay.classList.add(
    "active"
  );

}

/* ================= CERRAR MODAL ================= */

document
  .getElementById(
    "cerrarModal"
  )
  .addEventListener(
    "click",
    () => {

      modalOverlay.classList.remove(
        "active"
      );

    }
  );

/* ================= CERRAR FUERA ================= */

modalOverlay.addEventListener(
  "click",
  (e) => {

    if (
      e.target === modalOverlay
    ) {

      modalOverlay.classList.remove(
        "active"
      );

    }

  }
);

