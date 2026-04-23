// ─── incidencias.js ───────────────────────────────────────────────────────────

function initIncidencias() {

  // ─── Helpers modales ────────────────────────────────────────────────────────

  function abrirModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("modal--hidden");
    document.body.style.overflow = "hidden";
  }

  function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("modal--hidden");
    document.body.style.overflow = "";
  }

  // Cerrar al hacer clic en el overlay (fuera del cuadro blanco)
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cerrarModal(overlay.id);
    });
  });

  // Cerrar con cualquier botón que tenga data-modal-close
  document.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.addEventListener("click", () => cerrarModal(btn.dataset.modalClose));
  });

  // Cerrar con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay:not(.modal--hidden)").forEach((m) => {
        cerrarModal(m.id);
      });
    }
  });


  // ─── Abrir modal Nueva Incidencia ───────────────────────────────────────────

  document.querySelectorAll(".btn-abrir-nueva").forEach((btn) => {
    btn.addEventListener("click", () => {
      limpiarFormulario("modal-nueva-incidencia");
      abrirModal("modal-nueva-incidencia");
    });
  });


  // ─── Abrir modal Editar Incidencia ──────────────────────────────────────────

  document.querySelectorAll(".btn-abrir-editar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".incident-item");
      const id = item?.dataset.id ?? null;

      const titulo = item?.querySelector(".incident-body__title")?.textContent ?? "";
      const descripcion = item?.querySelector(".incident-body__desc")?.textContent ?? "";

      document.getElementById("modal-editar-incidencia").dataset.incidenciaId = id;
      document.getElementById("editar-titulo").value = titulo;
      document.getElementById("editar-titulo-count").textContent = titulo.length;
      document.getElementById("editar-desc").value = descripcion;
      document.getElementById("editar-tipo").value = "";

      document.querySelectorAll("#modal-editar-incidencia .modal__urgencia-btn")
        .forEach((b) => b.classList.remove("modal__urgencia-btn--active"));

      abrirModal("modal-editar-incidencia");
    });
  });


  // ─── Abrir modal Eliminar Incidencia ────────────────────────────────────────

  document.querySelectorAll(".btn-abrir-eliminar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".incident-item");
      const id = item?.dataset.id ?? null;
      document.getElementById("modal-eliminar-incidencia").dataset.incidenciaId = id;
      abrirModal("modal-eliminar-incidencia");
    });
  });


  // ─── Contador de caracteres ─────────────────────────────────────────────────

  function iniciarContador(inputId, counterId) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) return;
    input.addEventListener("input", () => (counter.textContent = input.value.length));
  }

  iniciarContador("nueva-titulo", "nueva-titulo-count");
  iniciarContador("editar-titulo", "editar-titulo-count");


  // ─── Botones de urgencia ────────────────────────────────────────────────────

  document.querySelectorAll(".modal__urgencia-row").forEach((row) => {
    row.querySelectorAll(".modal__urgencia-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        row.querySelectorAll(".modal__urgencia-btn")
          .forEach((b) => b.classList.remove("modal__urgencia-btn--active"));
        btn.classList.add("modal__urgencia-btn--active");
      });
    });
  });


  // ─── Limpiar formulario ─────────────────────────────────────────────────────

  function limpiarFormulario(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.querySelectorAll("input[type=text], textarea").forEach((el) => (el.value = ""));
    modal.querySelectorAll("select").forEach((el) => (el.value = ""));
    modal.querySelectorAll(".modal__urgencia-btn")
      .forEach((btn) => btn.classList.remove("modal__urgencia-btn--active"));
    modal.querySelectorAll(".modal__char-count span").forEach((s) => (s.textContent = "0"));
    modal.removeAttribute("data-incidencia-id");
  }


  // ─── Recoger datos del formulario ───────────────────────────────────────────

  function getDatosFormulario(prefix) {
    const urgenciaActiva = document.querySelector(
      `#modal-${prefix}-incidencia .modal__urgencia-btn--active`
    );
    return {
      tipo: document.getElementById(`${prefix}-tipo`)?.value ?? "",
      titulo: document.getElementById(`${prefix}-titulo`)?.value ?? "",
      descripcion: document.getElementById(`${prefix}-desc`)?.value ?? "",
      urgencia: urgenciaActiva?.dataset.urgencia ?? "",
    };
  }


  // ─── Validación ─────────────────────────────────────────────────────────────

  function validarFormulario(datos) {
    if (!datos.tipo)               { alert("Selecciona un tipo de incidencia."); return false; }
    if (!datos.titulo.trim())      { alert("El título es obligatorio.");         return false; }
    if (!datos.descripcion.trim()) { alert("La descripción es obligatoria.");    return false; }
    if (!datos.urgencia)           { alert("Selecciona el nivel de urgencia.");  return false; }
    return true;
  }


  // ─── Acción: Enviar nueva incidencia ────────────────────────────────────────

  document.getElementById("btn-enviar-incidencia")?.addEventListener("click", async () => {
    const datos = getDatosFormulario("nueva");
    if (!validarFormulario(datos)) return;
    // TODO: await fetch("/api/incidencias", { method: "POST", body: JSON.stringify(datos) });
    console.log("✅ Crear incidencia:", datos);
    cerrarModal("modal-nueva-incidencia");
  });


  // ─── Acción: Confirmar edición ──────────────────────────────────────────────

  document.getElementById("btn-confirmar-editar")?.addEventListener("click", async () => {
    const id = document.getElementById("modal-editar-incidencia").dataset.incidenciaId;
    const datos = getDatosFormulario("editar");
    if (!validarFormulario(datos)) return;
    // TODO: await fetch(`/api/incidencias/${id}`, { method: "PUT", body: JSON.stringify(datos) });
    console.log("✏️ Editar incidencia:", id, datos);
    cerrarModal("modal-editar-incidencia");
  });


  // ─── Acción: Confirmar eliminación ──────────────────────────────────────────

  document.getElementById("btn-confirmar-eliminar")?.addEventListener("click", async () => {
    const id = document.getElementById("modal-eliminar-incidencia").dataset.incidenciaId;
    // TODO: await fetch(`/api/incidencias/${id}`, { method: "DELETE" });
    console.log("🗑️ Eliminar incidencia:", id);
    cerrarModal("modal-eliminar-incidencia");
  });


  // ─── Sidebar: marcar ítem activo según página ────────────────────────────────

  // ─── Sidebar: Lógica de Selección ──────────────────────────────────────────
  const rutaActual = window.location.pathname.split("/").pop().replace(".html", "");
  
  const mapaRutas = {
    "incidenciasUser": "Incidencias",
    "tareas":          "Tareas",
    "calendario":      "Calendario",
    "inicio":          "Inicio",
    "companyeros":     "Compañeros",
    "ajustes":         "Ajustes",
  };

  const nombreSeccion = mapaRutas[rutaActual];

  if (nombreSeccion) {
    document.querySelectorAll(".sidebar li").forEach((li) => {
      // Si el texto del LI contiene el nombre de la sección, activamos
      if (li.textContent.includes(nombreSeccion)) {
        li.classList.add("active");
      } else {
        li.classList.remove("active");
      }
    });
  }
  // fin initIncidencias
}
// LANZADOR
document.addEventListener("DOMContentLoaded", initIncidencias)