const API_URL = "../php/tareas.php";

/* ================================================= */
/* ================= DOM =========================== */
/* ================================================= */

const nombreUsuario =
  document.getElementById("nombreUsuario");

const modal =
  document.getElementById("taskModal");

const deleteModal =
  document.getElementById("deleteModal");

const detailModal =
  document.getElementById("detailModal");

const openBtn =
  document.getElementById("openModal");

const closeBtn =
  document.getElementById("closeModal");

const cancelBtn =
  document.getElementById("cancelModal");

const cancelDelete =
  document.getElementById("cancelDelete");

const confirmDelete =
  document.getElementById("confirmDelete");

const selectAsignados =
  document.getElementById("asignados");

/* ================= DETAIL ================= */

const closeDetailModal =
  document.getElementById("closeDetailModal");

const cerrarDetalleBtn =
  document.getElementById("cerrarDetalleBtn");

/* ================= PASOS ================= */

const step1 =
  document.getElementById("step1");

const step2 =
  document.getElementById("step2");

const nextStep =
  document.getElementById("nextStep");

const backStep =
  document.getElementById("backStep");

const crearTareaBtn =
  document.getElementById("crearTarea");

const currentStep =
  document.getElementById("currentStep");

/* ================= MENU ================= */

const menuToggle =
  document.getElementById("menuToggle");

const sidebar =
  document.getElementById("sidebar");

/* ================================================= */
/* ================= ESTADO ======================== */
/* ================================================= */

let tareas = [];

let deleteId = null;

let tareaEditando = null;

let filtroActual = "todas";

let busquedaActual = "";

/* ================================================= */
/* ================= INIT ========================== */
/* ================================================= */

/* ================= MENU HAMBURGUESA ================= */

if (menuToggle && sidebar) {

  menuToggle.addEventListener(
    "click",
    () => {

      sidebar.classList.toggle("active");

      menuToggle.classList.toggle("active");

      if (sidebar.classList.contains("active")) {

        menuToggle.innerHTML = "✕";

      } else {

        menuToggle.innerHTML = "☰";

      }

    }
  );

}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    cargarUsuario();

    cargarUsuarios();

    cargarTareas();

    activarPrioridad();

    initModal();

    initFiltros();

    initBusqueda();

    /* NO PERMITIR FECHAS ANTERIORES */
    const fechaInput =
      document.getElementById("fecha");

    if (fechaInput) {

      const hoy =
        new Date()
          .toISOString()
          .split("T")[0];

      fechaInput.min = hoy;

    }

    /* QUITAR ERRORES AL ESCRIBIR */

    document.getElementById("titulo")
    ?.addEventListener("input", function () {

      this.classList.remove("input-error");

      document.getElementById(
        "errorTitulo"
      ).textContent = "";

    });

    document.getElementById("fecha")
    ?.addEventListener("input", function () {

      this.classList.remove("input-error");

      document.getElementById(
        "errorFecha"
      ).textContent = "";

    });

  }
);

/* ================================================= */
/* ================= USUARIO ======================= */
/* ================================================= */

function cargarUsuario() {

  const usuario =
    JSON.parse(
      sessionStorage.getItem("usuario")
    );

  if (usuario && nombreUsuario) {

    nombreUsuario.textContent =
      usuario.nombre;

  }

}

/* ================================================= */
/* ================= PRIORIDAD ===================== */
/* ================================================= */

function activarPrioridad() {

  document
    .querySelectorAll(".prio")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".prio")
            .forEach(b =>
              b.classList.remove("active")
            );

          btn.classList.add("active");

        }
      );

    });

}

/* ================================================= */
/* ================= FILTROS ======================= */
/* ================================================= */

function initFiltros() {

  document
    .querySelectorAll(".filter-btn")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".filter-btn")
            .forEach(b =>
              b.classList.remove("active")
            );

          btn.classList.add("active");

          filtroActual =
            btn.dataset.filter;

          renderTareas();

        }
      );

    });

}

/* ================================================= */
/* ================= BUSQUEDA ====================== */
/* ================================================= */

function initBusqueda() {

  const input =
    document.getElementById(
      "searchTask"
    );

  if (!input) return;

  input.addEventListener(
    "input",
    (e) => {

      busquedaActual =
        e.target.value
          .trim()
          .toLowerCase();

      renderTareas();

    }
  );

}

/* ================================================= */
/* ================= MODAL ========================= */
/* ================================================= */

function initModal() {

  openBtn.addEventListener(
    "click",
    abrirModal
  );

  [closeBtn, cancelBtn].forEach(btn => {

    btn.addEventListener(
      "click",
      cerrarModal
    );

  });

  [closeDetailModal, cerrarDetalleBtn]
    .forEach(btn => {

      btn?.addEventListener(
        "click",
        cerrarDetalle
      );

    });

  window.addEventListener(
    "click",
    (e) => {

      if (e.target === modal) {
        cerrarModal();
      }

      if (e.target === deleteModal) {
        cerrarDeleteModal();
      }

      if (e.target === detailModal) {
        cerrarDetalle();
      }

    }
  );

  /* ================= STEP NEXT ================= */
nextStep.addEventListener("click", () => {

    const tituloInput = document.getElementById("titulo");
    const fechaInput = document.getElementById("fecha");

    const errorTitulo = document.getElementById("errorTitulo");
    const errorFecha = document.getElementById("errorFecha");

    errorTitulo.textContent = "";
    errorFecha.textContent = "";

    tituloInput.classList.remove("input-error");
    fechaInput.classList.remove("input-error");

    let valido = true;

    if (!tituloInput.value.trim()) {
        tituloInput.classList.add("input-error");
        errorTitulo.textContent = "El título es obligatorio";
        valido = false;
    }

    if (!fechaInput.value) {
        fechaInput.classList.add("input-error");
        errorFecha.textContent = "Selecciona una fecha";
        valido = false;
    }

    if (!valido) return;

    step1.classList.add("hidden");
    step2.classList.remove("hidden");

    nextStep.classList.add("hidden");
    crearTareaBtn.classList.remove("hidden");

    backStep.classList.remove("hidden");

    currentStep.textContent = "2";
});

  /* ================= STEP BACK ================= */

  backStep.addEventListener(
    "click",
    () => {

      resetPasos();

    }
  );

}

/* ================================================= */
/* ================= OPEN/CLOSE ==================== */
/* ================================================= */

function abrirModal() {

  modal.classList.remove("hidden");

  resetPasos();

}

function cerrarModal() {

  modal.classList.add("hidden");

  limpiarFormulario();

}

function cerrarDetalle() {

  detailModal
    .classList
    .add("hidden");

}

/* ================================================= */
/* ================= PASOS ========================= */
/* ================================================= */

function resetPasos() {

  step1.classList.remove("hidden");

  step2.classList.add("hidden");

  nextStep.classList.remove("hidden");

  crearTareaBtn.classList.add("hidden");

  backStep.classList.add("hidden");

  currentStep.textContent = "1";

}

/* ================================================= */
/* ================= DELETE MODAL ================== */
/* ================================================= */

function cerrarDeleteModal() {

  deleteModal.classList.add("hidden");

  deleteId = null;

}

/* ================================================= */
/* ================= TOAST ========================= */
/* ================================================= */

function mostrarToast(mensaje) {

  const toast =
    document.getElementById("toast");

  toast.textContent =
    mensaje;

  toast.classList.remove("hidden");

  setTimeout(() => {

    toast.classList.add("show");

  }, 10);

  setTimeout(() => {

    toast.classList.remove("show");

    setTimeout(() => {

      toast.classList.add("hidden");

    }, 300);

  }, 2000);

}

/* ================================================= */
/* ================= API =========================== */
/* ================================================= */

async function cargarTareas() {

  const res =
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "listar"
      })
    });

  const json =
    await res.json();

  if (json.success) {

    tareas = json.tareas;

    renderTareas();

  }

}

async function crearTarea(data) {

  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "crear",
      ...data
    })
  });

}

async function editarTarea(id, data) {

  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "editar",
      id_tarea: id,
      ...data
    })
  });

}

async function actualizarTarea(id, estado) {

  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "toggle",
      id_tarea: id,
      estado
    })
  });

}

async function eliminarTarea(id) {

  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "eliminar",
      id_tarea: id
    })
  });

}

/* ================================================= */
/* ================= USUARIOS ====================== */
/* ================================================= */

async function cargarUsuarios() {

  const res =
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "usuarios"
      })
    });

  const json =
    await res.json();

  if (!json.success) return;

  selectAsignados.innerHTML = "";

  const usuarioSesion =
    JSON.parse(
      sessionStorage.getItem("usuario")
    );

  json.usuarios.forEach(u => {

    const option =
      document.createElement("option");

    option.value =
      u.id_usuario;

    option.textContent =

      usuarioSesion &&
      usuarioSesion.id == u.id_usuario

        ? "Tú"

        : u.nombre;

    selectAsignados.appendChild(option);

  });

}

/* ================================================= */
/* ================= RENDER ======================== */
/* ================================================= */
function renderTareas() {

  const container =
    document.getElementById("taskContainer");

  container.innerHTML = `

    <div class="section">

      <h3>PENDIENTES</h3>

      <div id="pendientes"></div>

    </div>

    <div class="section">

      <h3>COMPLETADAS</h3>

      <div id="completadas"></div>

    </div>

  `;

  const pendientesDiv =
    document.getElementById("pendientes");

  const completadasDiv =
    document.getElementById("completadas");

  /* ================================================= */
  /* ================= FECHA HOY ===================== */
  /* ================================================= */

  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);

  /* ================================================= */
  /* ================= FILTRAR ======================= */
  /* ================================================= */

  const tareasFiltradas =
    tareas.filter(t => {

      /* ================= BUSQUEDA ================= */

      const coincideBusqueda =

        t.titulo
          .toLowerCase()
          .includes(busquedaActual)

        ||

        (
          t.descripcion &&
          t.descripcion
            .toLowerCase()
            .includes(busquedaActual)
        )

        ||

        (
          t.nombre &&
          t.nombre
            .toLowerCase()
            .includes(busquedaActual)
        );

      if (!coincideBusqueda) {

        return false;

      }

      /* ================= TODAS ================= */

      if (filtroActual === "todas") {

        return true;

      }

      const fechaTarea =
        t.fecha
          ? new Date(t.fecha)
          : null;

      /* ================= HOY ================= */

      if (filtroActual === "hoy") {

        if (!fechaTarea) return false;

        fechaTarea.setHours(0,0,0,0);

        return (
          fechaTarea.getTime()
          === hoy.getTime()
        );

      }

      /* ================= SEMANA ================= */

      if (filtroActual === "semana") {

        if (!fechaTarea) return false;

        const diff =
          (
            fechaTarea - hoy
          ) / (1000 * 60 * 60 * 24);

        return diff >= 0 && diff <= 7;

      }

      /* ================= ATRASADAS ================= */

      if (filtroActual === "atrasadas") {

        if (!fechaTarea) return false;

        fechaTarea.setHours(0,0,0,0);

        return (
          fechaTarea < hoy &&
          t.estado !== "completada"
        );

      }

      /* ================= ALTA ================= */

      if (filtroActual === "alta") {

        return (
          t.prioridad === "alta"
        );

      }

      return true;

    });

  /* ================================================= */
  /* ================= RENDER ======================== */
  /* ================================================= */

  tareasFiltradas.forEach(t => {

    const completada =
      t.estado === "completada";

    const html = `

      <div class="task ${completada ? "completed" : ""}">

        <div class="left">

          <input
            type="checkbox"
            data-id="${t.id_tarea}"
            ${completada ? "checked" : ""}
          >

          <div class="task-content">

            <p class="task-title">
              ${t.titulo}
            </p>

            <div class="meta">

              <span class="tag ${t.prioridad}">
                ${t.prioridad}
              </span>

              <span class="date">
                ${t.fecha || ""}
              </span>

            </div>

          </div>

        </div>

        <div class="right">

          <span>
            ${t.nombre}
          </span>

          <button
            class="btn-detail"
            data-id="${t.id_tarea}"
          >
            Ver detalles
          </button>

          <button
            class="edit-btn"
            data-id="${t.id_tarea}"
          >
            ✏️
          </button>

          <button
            class="delete-btn"
            data-id="${t.id_tarea}"
          >
            🗑️
          </button>

        </div>

      </div>

    `;

    if (completada) {

      completadasDiv.innerHTML += html;

    } else {

      pendientesDiv.innerHTML += html;

    }

  });

  /* ================================================= */
  /* ================= VACIO ========================= */
  /* ================================================= */

  if (!tareasFiltradas.length) {

    pendientesDiv.innerHTML = `

      <div class="empty">
        No se encontraron tareas
      </div>

    `;

  }

  /* ================================================= */
  /* ================= EVENTS ======================== */
  /* ================================================= */

  activarChecks();

  activarEditar();

  activarEliminar();

  activarDetalle();

}
  
/* ================================================= */
/* ================= DETALLE ======================= */
/* ================================================= */

function activarDetalle() {

  document
    .querySelectorAll(".btn-detail")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          const id =
            btn.dataset.id;

          const tarea =
            tareas.find(
              t => t.id_tarea == id
            );

          if (tarea) {

            abrirDetalle(tarea);

          }

        }
      );

    });

}

function abrirDetalle(tarea) {

  document.getElementById(
    "detailTitulo"
  ).textContent =
    tarea.titulo;

  document.getElementById(
    "detailUsuario"
  ).textContent =
    tarea.nombre;

  document.getElementById(
    "detailFecha"
  ).textContent =
    tarea.fecha || "Sin fecha";

  document.getElementById(
    "detailFrecuencia"
  ).textContent =
    tarea.frecuencia || "Puntual";

  document.getElementById(
    "detailDescripcion"
  ).textContent =
    tarea.descripcion || "Sin descripción";

  const prioridad =
    document.getElementById(
      "detailPrioridad"
    );

  prioridad.textContent =
    tarea.prioridad;

  prioridad.className =
    `tag ${tarea.prioridad}`;

  const estado =
    document.getElementById(
      "detailEstado"
    );

  estado.textContent =
    tarea.estado;

  estado.className =
    `detail-status ${tarea.estado}`;

  detailModal
    .classList
    .remove("hidden");

}

/* ================================================= */
/* ================= CHECK ========================= */
/* ================================================= */

function activarChecks() {

  document
    .querySelectorAll(
      "input[type='checkbox']"
    )
    .forEach(check => {

      check.addEventListener(
        "change",
        async (e) => {

          const id =
            e.target.dataset.id;

          const estado =

            e.target.checked

              ? "completada"

              : "pendiente";

          await actualizarTarea(
            id,
            estado
          );

          cargarTareas();

        }
      );

    });

}

/* ================================================= */
/* ================= EDITAR ======================== */
/* ================================================= */

function activarEditar() {

  document
    .querySelectorAll(".edit-btn")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          const id =
            btn.dataset.id;

          const tarea =
            tareas.find(
              t => t.id_tarea == id
            );

          if (!tarea) return;

          tareaEditando = tarea;

          document.getElementById(
            "titulo"
          ).value = tarea.titulo;

          document.getElementById(
            "descripcion"
          ).value =
            tarea.descripcion || "";

          document.getElementById(
            "fecha"
          ).value =
            tarea.fecha || "";

          document.getElementById(
            "frecuencia"
          ).value =
            tarea.frecuencia || "puntual";

          selectAsignados.value =
            tarea.id_usuario;

          document
            .querySelectorAll(".prio")
            .forEach(b =>
              b.classList.remove("active")
            );

          const btnPrio =
            document.querySelector(
              `.prio[data-value="${tarea.prioridad}"]`
            );

          if (btnPrio) {

            btnPrio.classList.add("active");

          }

          document.getElementById(
            "modalTitle"
          ).textContent =
            "Editar tarea";

          abrirModal();

        }
      );

    });

}

/* ================================================= */
/* ================= ELIMINAR ====================== */
/* ================================================= */

function activarEliminar() {

  document
    .querySelectorAll(".delete-btn")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          deleteId =
            btn.dataset.id;

          deleteModal
            .classList
            .remove("hidden");

        }
      );

    });

}

cancelDelete.addEventListener(
  "click",
  cerrarDeleteModal
);

confirmDelete.addEventListener(
  "click",
  async () => {

    if (deleteId) {

      await eliminarTarea(deleteId);

      mostrarToast(
        "Tarea eliminada ✅"
      );

    }

    cerrarDeleteModal();

    cargarTareas();

  }
);

/* ================================================= */
/* ================= CREAR ========================= */
/* ================================================= */

crearTareaBtn.addEventListener(
  "click",
  async () => {

    const titulo =
      document
        .getElementById("titulo")
        .value
        .trim();

    const descripcion =
      document
        .getElementById("descripcion")
        .value;

    const prioridad =

      document.querySelector(
        ".prio.active"
      )?.dataset.value || "baja";

    const fecha =
      document
        .getElementById("fecha")
        .value;

    const frecuencia =
      document
        .getElementById("frecuencia")
        .value;

    const usuario =
      selectAsignados.value;

    if (!titulo) {

      mostrarToast(
        "El título es obligatorio"
      );

      return;

    }

    const data = {

      titulo,
      descripcion,
      prioridad,
      fecha,
      frecuencia,
      id_usuario: usuario

    };

    if (tareaEditando) {

      await editarTarea(
        tareaEditando.id_tarea,
        data
      );

      mostrarToast(
        "Tarea actualizada ✏️"
      );

    } else {

      await crearTarea(data);

      mostrarToast(
        "Tarea creada 🚀"
      );

    }

    cerrarModal();

    cargarTareas();

  }
);

/* ================================================= */
/* ================= LIMPIAR ======================= */
/* ================================================= */

function limpiarFormulario() {

  document.getElementById(
    "titulo"
  ).value = "";

  document.getElementById(
    "descripcion"
  ).value = "";

  document.getElementById(
    "fecha"
  ).value = "";

  document.getElementById(
    "frecuencia"
  ).value = "puntual";

  selectAsignados.selectedIndex = 0;

  document
    .querySelectorAll(".prio")
    .forEach(b =>
      b.classList.remove("active")
    );

  document
    .querySelector(".prio.baja")
    ?.classList.add("active");

  tareaEditando = null;

  document.getElementById(
    "modalTitle"
  ).textContent =
    "Nueva tarea";

  resetPasos();

}