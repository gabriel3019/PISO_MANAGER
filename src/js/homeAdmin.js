let nombrePisoActual = "este piso";

let pisos = [];
let pisoSeleccionado = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  inicializar();
});

function inicializar() {
  cargarDatos();
  inicializarLogout();
  inicializarGuardar();
  inicializarRotacion();
  inicializarEliminarPiso();
  inicializarDescargarContrato();
}


/* ================= CARGAR DATOS ================= */
async function cargarDatos() {

  try {
    const res = await fetch("../php/homeAdmin.php", {
      method: "GET",
      credentials: "same-origin"
    });

    const data = await res.json();

    if (!data.success) {
      console.error(data.error);
      return;
    }

    /* ===== USUARIO ===== */
    if (data.usuario) {

      const nombre = data.usuario.nombre || "Admin";

      const nombreEl = document.getElementById("nombreAdmin");
      if (nombreEl) nombreEl.textContent = nombre;

      const avatar = document.querySelector(".avatar");
      if (avatar) {
        avatar.textContent = obtenerIniciales(nombre);
      }
    }

    /* ===== PISO ===== */
    if (data.pisos && data.pisos.length > 0) {
      pisos = data.pisos;

      const selector = document.getElementById("selectorPiso");
      selector.innerHTML = "";

      pisos.forEach(piso => {
        const option = document.createElement("option");
        option.value = piso.id_piso;
        option.textContent = `${piso.calle} - ${piso.nombre_casero}`;
        option.dataset.calle = piso.calle;
        selector.appendChild(option);
      });

      pisoSeleccionado = pisos[0];
      selector.value = pisoSeleccionado.id_piso;
      pintarPiso(pisoSeleccionado);

      selector.addEventListener("change", () => {
        pisoSeleccionado = pisos.find(p => p.id_piso == selector.value);
        pintarPiso(pisoSeleccionado);
      });
    } else {
      console.log("No hay pisos cargados desde la BBDD");
    }
  } catch (err) {
    console.error("Error al cargar datos:", err);
  }
}

function pintarPiso(piso) {
  if (!piso) return;

  nombrePisoActual = piso.calle || "este piso";

  document.getElementById("nombre_casero").value = piso.nombre_casero || "";
  document.getElementById("calle").value = piso.calle || "";
  document.getElementById("ciudad").value = piso.ciudad || "";
  document.getElementById("codigo_postal").value = piso.codigo_postal || "";
}


/* ================= GUARDAR ================= */
function inicializarGuardar() {

  const btn = document.querySelector(".save-btn");
  if (!btn) return;

  btn.addEventListener("click", guardarCambios);
}

async function guardarCambios() {

  const calle = document.getElementById("calle").value.trim();
  const ciudad = document.getElementById("ciudad").value.trim();
  const codigo_postal = document.getElementById("codigo_postal").value.trim();

  try {

    const res = await fetch("../php/guardarPiso.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        calle,
        ciudad,
        codigo_postal
      })
    });

    const data = await res.json();

    console.log(data);

    if (data.success) {
      mostrarToast("Guardado correctamente ✅");
    } else {
      mostrarToast("Error al guardar ❌");
    }

  } catch (err) {
    console.error(err);
    mostrarToast("Error de conexión ❌");
  }
}


/* ================= LOGOUT ================= */
function inicializarLogout() {

  const btn = document.getElementById("btn-cerrar-sesion");
  if (!btn) return;

  btn.addEventListener("click", cerrarSesion);
}

function cerrarSesion() {

  mostrarToast("Cerrando sesión...");

  setTimeout(async () => {

    try {
      await fetch("../php/logout.php", {
        method: "POST",
        credentials: "same-origin"
      });
    } catch (err) {
      console.error("Error logout:", err);
    }

    /* limpiar */
    sessionStorage.removeItem("usuario");

    /* redirigir 🔥 */
    window.location.href = "../html/login.html";

  }, 500);
}


/* ================= ROTACIÓN ================= */
function inicializarRotacion() {

  const botones = document.querySelectorAll(".rotation-buttons button");

  botones.forEach(btn => {
    btn.addEventListener("click", () => {

      botones.forEach(b => b.classList.remove("active-btn"));
      btn.classList.add("active-btn");

      console.log("Rotación:", btn.dataset.rotacion);
    });
  });
}


/* ================= UTIL ================= */
function obtenerIniciales(nombre) {
  return nombre
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}


/* ================= TOAST ================= */
function mostrarToast(mensaje) {

  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "#111",
      color: "#fff",
      padding: "10px 15px",
      borderRadius: "8px",
      fontSize: "14px",
      opacity: "0",
      transition: "0.3s"
    });
  }

  toast.textContent = mensaje;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}

/* ================= ELIMINAR / CREAR PISO ================= */
function inicializarEliminarPiso() {

  const modalEliminarPiso = document.getElementById("modalEliminarPiso");
  const modalCrearPiso = document.getElementById("modalCrearPiso");
  const sinPiso = document.getElementById("sinPiso");

  const btnEliminar = document.querySelector(".danger");
  const btnCancelarEliminar = document.getElementById("cancelarEliminarPiso");
  const btnConfirmarEliminar = document.getElementById("confirmarEliminarPiso");

  const btnAbrirCrear = document.getElementById("btnAbrirCrearPiso");
  const btnCancelarCrear = document.getElementById("cancelarCrearPiso");
  const btnGuardarPiso = document.getElementById("guardarNuevoPiso");

  /* ===== ABRIR MODAL ELIMINAR ===== */
  btnEliminar?.addEventListener("click", () => {
    const texto = document.getElementById("textoEliminarPiso");

    const calleInput = document.getElementById("calle")?.value.trim();
    const calle = calleInput || pisoSeleccionado?.calle || nombrePisoActual || "este piso";

    if (texto) {
      texto.innerHTML =
        `¿Seguro que quieres eliminar el piso de <span>${calle}</span>?`;
    }

    modalEliminarPiso.classList.remove("hidden");
  });

  /* ===== CANCELAR ELIMINAR ===== */
  btnCancelarEliminar?.addEventListener("click", () => {
    modalEliminarPiso.classList.add("hidden");
  });

  /* ===== CONFIRMAR ELIMINAR ===== */
  btnConfirmarEliminar?.addEventListener("click", async () => {
    if (!pisoSeleccionado) return;

    try {
      const res = await fetch("../php/eliminarPiso.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id_piso: pisoSeleccionado.id_piso
        })
      });

      const data = await res.json();

      if (!data.success) {
        mostrarToast("Error al eliminar piso");
        return;
      }

      modalEliminarPiso.classList.add("hidden");

      // Quitar solo el piso eliminado del array
      pisos = pisos.filter(p => p.id_piso != pisoSeleccionado.id_piso);

      if (pisos.length > 0) {
        // Si queda algún piso, mostramos el siguiente
        pisoSeleccionado = pisos[0];
        pintarPiso(pisoSeleccionado);

        const selector = document.getElementById("selectorPiso");
        selector.innerHTML = "";

        pisos.forEach(piso => {
          const option = document.createElement("option");
          option.value = piso.id_piso;
          option.textContent = `${piso.calle} - ${piso.nombre_casero}`;
          selector.appendChild(option);
        });

        selector.value = pisoSeleccionado.id_piso;

      } else {
        // Solo si no queda ninguno
        document.querySelectorAll(".card, .save").forEach(el => {
          el.style.display = "none";
        });

        sinPiso.classList.remove("hidden");
      }

      mostrarToast("Piso eliminado correctamente");

    } catch (err) {
      console.error(err);
      mostrarToast("Error de conexión");
    }
  });

  /* ===== ABRIR CREAR PISO ===== */
  btnAbrirCrear?.addEventListener("click", (e) => {
    e.preventDefault();
    modalCrearPiso.classList.remove("hidden");
  });

  /* ===== CANCELAR CREAR ===== */
  btnCancelarCrear?.addEventListener("click", () => {
    modalCrearPiso.classList.add("hidden");
  });

  /* ===== GUARDAR NUEVO PISO ===== */
  btnGuardarPiso?.addEventListener("click", async () => {

    const nombre_casero = document.getElementById("nuevoNombreCasero").value.trim();
    const calle = document.getElementById("nuevaCalle").value.trim();
    const ciudad = document.getElementById("nuevaCiudad").value.trim();
    const cp = document.getElementById("nuevoCodigoPostal").value.trim();

    if (!nombre_casero || !calle || !ciudad || !cp) {
      mostrarToast("Rellena todos los campos");
      return;
    }

    /* ===== GUARDAR EN BBDD ===== */
    try {

      const res = await fetch("../php/crearPiso.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre_casero,
          calle,
          ciudad,
          codigo_postal: cp
        })
      });

      const data = await res.json();

      if (!data.success) {
        mostrarToast("Error al crear piso");
        return;
      }

    } catch (err) {
      console.error(err);
      mostrarToast("Error de conexión");
      return;
    }

    /* cerrar modal */
    modalCrearPiso.classList.add("hidden");

    /* ocultar pantalla sin piso */
    sinPiso.classList.add("hidden");

    /* volver a mostrar contenido */
    document.querySelectorAll(".card, .save").forEach(el => {
      el.style.display = "";
    });

    /* actualizar formulario */
    document.getElementById("nombre_casero").value = nombre_casero;
    document.getElementById("calle").value = calle;
    document.getElementById("ciudad").value = ciudad;
    document.getElementById("codigo_postal").value = cp;

    mostrarToast("Piso creado correctamente ");
  });

  /* ===== CERRAR MODALES AL PULSAR FUERA ===== */
  window.addEventListener("click", (e) => {

    if (e.target === modalEliminarPiso) {
      modalEliminarPiso.classList.add("hidden");
    }

    if (e.target === modalCrearPiso) {
      modalCrearPiso.classList.add("hidden");
    }

  });
}

function inicializarDescargarContrato() {
  const btn = document.getElementById("btnDescargarContrato");

  if (!btn) return;

  btn.addEventListener("click", (event) => {

    event.preventDefault();
    event.stopPropagation();

    if (!pisoSeleccionado) {
      mostrarToast("Selecciona un piso primero");
      return;
    }
    window.location.href = `../php/descargarContrato.php?id_piso=${pisoSeleccionado.id_piso}`;
  });
}

/* ================= DARK MODE ================= */

const darkToggle =
  document.getElementById("darkModeToggle");

/* ===== CARGAR ===== */

if (
  localStorage.getItem("darkMode")
  === "true"
) {

  document.documentElement
    .classList.add("dark");

  if (darkToggle) {
    darkToggle.checked = true;
  }

}

/* ===== TOGGLE ===== */

darkToggle?.addEventListener(
  "change",
  () => {

    if (darkToggle.checked) {

      document.documentElement
        .classList.add("dark");

      localStorage.setItem(
        "darkMode",
        "true"
      );

    } else {

      document.documentElement
        .classList.remove("dark");

      localStorage.setItem(
        "darkMode",
        "false"
      );

    }

  }
);