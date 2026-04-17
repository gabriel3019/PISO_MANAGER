// ================= MODALES =================
const modal = document.getElementById("taskModal");
const deleteModal = document.getElementById("deleteModal");

const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelModal");

const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

// abrir modal crear
openBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

// cerrar modal
[closeBtn, cancelBtn].forEach(btn => {
  btn.addEventListener("click", cerrarModal);
});

// cerrar fuera
window.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
  if (e.target === deleteModal) cerrarDeleteModal();
});

function cerrarModal() {
  modal.classList.add("hidden");
  limpiarFormulario();
}

function cerrarDeleteModal() {
  deleteModal.classList.add("hidden");
  deleteIndex = null;
}


// ================= TOAST =================
function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");

  toast.textContent = mensaje;
  toast.classList.remove("hidden");

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 2000);
}


// ================= PRIORIDAD =================
let prioridadSeleccionada = "baja";

document.querySelectorAll(".prio").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".prio").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    prioridadSeleccionada = btn.dataset.value;
  });
});


// ================= DATOS =================
let tareas = JSON.parse(localStorage.getItem("tareas")) || [];
let deleteIndex = null;


// ================= RENDER =================
function renderTareas() {
  const container = document.getElementById("taskContainer");

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

  const pendientesDiv = document.getElementById("pendientes");
  const completadasDiv = document.getElementById("completadas");

  tareas.forEach((t, index) => {

    const prioridadClass =
      t.prioridad === "alta" ? "red" :
      t.prioridad === "media" ? "yellow" : "blue";

    const html = `
      <div class="task ${t.completada ? "completed" : ""}">

        <div class="left">
          <input type="checkbox" data-index="${index}" ${t.completada ? "checked" : ""}>

          <div>
            <p>${t.titulo}</p>

            <div class="meta">
              <span class="tag ${prioridadClass}">
                ${t.prioridad}
              </span>
              <span class="date">${t.fecha || ""}</span>
            </div>
          </div>
        </div>

        <div class="right">
          <div class="avatars">
            ${t.asignados.map(a => `<span>${a}</span>`).join("")}
          </div>

          <button class="edit-btn" data-index="${index}">✏️</button>
          <button class="delete-btn" data-index="${index}">🗑️</button>
        </div>

      </div>
    `;

    if (t.completada) {
      completadasDiv.innerHTML += html;
    } else {
      pendientesDiv.innerHTML += html;
    }
  });

  activarChecks();
  activarEditar();
  activarEliminar();
}


// ================= CHECKBOX =================
function activarChecks() {
  document.querySelectorAll("input[type='checkbox']").forEach(check => {
    check.addEventListener("change", (e) => {
      const index = e.target.dataset.index;
      tareas[index].completada = e.target.checked;

      guardar();
      renderTareas();
    });
  });
}


// ================= EDITAR =================
function activarEditar() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {

      const index = btn.dataset.index;
      const tarea = tareas[index];

      document.getElementById("titulo").value = tarea.titulo;
      document.getElementById("descripcion").value = tarea.descripcion;
      document.getElementById("fecha").value = tarea.fecha;

      const select = document.getElementById("asignados");
      [...select.options].forEach(option => {
        option.selected = tarea.asignados.includes(option.value);
      });

      prioridadSeleccionada = tarea.prioridad;
      document.querySelectorAll(".prio").forEach(b => b.classList.remove("active"));
      document.querySelector(`.prio.${tarea.prioridad}`).classList.add("active");

      document.getElementById("editIndex").value = index;
      document.querySelector(".modal-header h2").textContent = "Editar tarea";

      modal.classList.remove("hidden");
    });
  });
}


// ================= ELIMINAR =================
function activarEliminar() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteIndex = btn.dataset.index;
      deleteModal.classList.remove("hidden");
    });
  });
}

cancelDelete.addEventListener("click", cerrarDeleteModal);

confirmDelete.addEventListener("click", () => {

  if (deleteIndex !== null) {
    tareas.splice(deleteIndex, 1);
    guardar();
    mostrarToast("Tarea eliminada correctamente ✅");
  }

  cerrarDeleteModal();
  renderTareas();
});


// ================= VALIDACIÓN =================
function validarFormulario() {
  const tituloInput = document.getElementById("titulo");
  const fechaInput = document.getElementById("fecha");
  const asignadosSelect = document.getElementById("asignados");

  const titulo = tituloInput.value.trim();
  const fecha = fechaInput.value;
  const asignados = [...asignadosSelect.selectedOptions].map(o => o.value);

  let valido = true;

  limpiarErrores();

  if (!titulo) {
    setError("errorTitulo", tituloInput, "El título es obligatorio");
    valido = false;
  }

  if (!fecha) {
    setError("errorFecha", fechaInput, "Selecciona una fecha");
    valido = false;
  }

  if (asignados.length === 0) {
    setError("errorAsignados", asignadosSelect, "Selecciona al menos una persona");
    valido = false;
  }

  return valido;
}

function setError(id, input, mensaje) {
  document.getElementById(id).textContent = mensaje;
  input.classList.add("input-error");
}

function limpiarErrores() {
  document.querySelectorAll(".error-text").forEach(e => e.textContent = "");
  document.querySelectorAll(".input-error").forEach(e => e.classList.remove("input-error"));
}


// ================= CREAR / EDITAR =================
document.getElementById("crearTarea").addEventListener("click", () => {

  if (!validarFormulario()) return;

  const titulo = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("descripcion").value;
  const fecha = document.getElementById("fecha").value;

  const asignados = [...document.getElementById("asignados").selectedOptions]
    .map(o => o.value);

  const editIndex = document.getElementById("editIndex").value;

  const data = {
    titulo,
    descripcion,
    prioridad: prioridadSeleccionada,
    fecha,
    asignados
  };

  if (editIndex !== "") {
    tareas[editIndex] = { ...tareas[editIndex], ...data };
    mostrarToast("Tarea actualizada ✏️");
  } else {
    tareas.push({ ...data, completada: false });
    mostrarToast("Tarea creada correctamente 🚀");
  }

  guardar();
  renderTareas();
  cerrarModal();
});


// ================= HELPERS =================
function guardar() {
  localStorage.setItem("tareas", JSON.stringify(tareas));
}


// ================= LIMPIAR =================
function limpiarFormulario() {
  document.getElementById("titulo").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("fecha").value = "";
  document.getElementById("editIndex").value = "";

  prioridadSeleccionada = "baja";

  document.querySelectorAll(".prio").forEach(b => b.classList.remove("active"));
  document.querySelector(".prio.baja").classList.add("active");

  limpiarErrores();

  document.querySelector(".modal-header h2").textContent = "Nueva tarea";
}


// ================= INIT =================
renderTareas();