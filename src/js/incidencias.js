async function initIncidencias() {

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

    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) cerrarModal(overlay.id);
        });
    });

    document.querySelectorAll("[data-modal-close]").forEach((btn) => {
        btn.addEventListener("click", () => cerrarModal(btn.dataset.modalClose));
    });

    // ─── Preview de imagen en modal nueva ──────────────────────────────────────
    document.getElementById("nueva-imagen")?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        mostrarPreviewImagen(file, "nueva-imagen-preview");
    });

    // ─── Preview de imagen en modal editar ─────────────────────────────────────
    document.getElementById("editar-imagen")?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        mostrarPreviewImagen(file, "editar-imagen-preview");
    });

    function mostrarPreviewImagen(file, previewId) {
        let preview = document.getElementById(previewId);
        if (!preview) {
            preview = document.createElement("img");
            preview.id = previewId;
            preview.style.cssText = "width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-top:8px;";
            // Insertarlo después del dropzone
            const inputFile = document.getElementById(previewId.replace("-preview", ""));
            inputFile?.closest(".modal__dropzone")?.after(preview);
        }
        preview.src = URL.createObjectURL(file);
    }

    // ─── Cargar Datos de la BBDD ────────────────────────────────────────────────

    async function cargarIncidencias() {
        try {
            const resp = await fetch(`../php/incidencias.php?accion=listar&id_piso=1`);
            const data = await resp.json();

            const incidencias = Array.isArray(data) ? data : [];

            const listaActivas = document.getElementById("lista-activas");
            const listaResueltas = document.getElementById("lista-resueltas");

            listaActivas.innerHTML = "";
            listaResueltas.innerHTML = "";

            let contadores = { creada: 0, en_proceso: 0, finalizada: 0 };

            incidencias.forEach(inc => {
                if (contadores.hasOwnProperty(inc.estado)) contadores[inc.estado]++;

                const icono = {
                    'fontaneria': '💧', 'electricidad': '⚡',
                    'climatizacion': '❄️', 'otros': '📋'
                }[inc.tipo] || '📋';

                // ✅ Mostrar imagen si existe, si no el icono emoji
                const iconoHTML = inc.imagen
                    ? `<img src="${inc.imagen}" alt="imagen incidencia" class="incident-img" style="width:48px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0;">`
                    : `<div class="incident-icon">${icono}</div>`;

                const html = `
                    <li class="incident-item" data-id="${inc.id}" data-tipo="${inc.tipo}" data-urgencia="${inc.urgencia}">
                      ${iconoHTML}
                      <div class="incident-body">
                        <p class="incident-body__title">${inc.titulo}</p>
                        <p class="incident-body__desc">${inc.descripcion}</p>
                        <p class="incident-body__meta">Reportado · ${inc.fecha_creacion || 'Hoy'} · ${inc.tipo}</p>
                      </div>
                      <div class="incident-status">
                        <span class="status-badge status-badge--${inc.estado === 'creada' ? 'open' : (inc.estado === 'en_proceso' ? 'progress' : 'done')}">
                            ${inc.estado}
                        </span>
                        <span class="priority-dot priority-dot--${inc.urgencia === 'alta' ? 'high' : (inc.urgencia === 'media' ? 'medium' : 'low')}">
                            ${inc.urgencia}
                        </span>
                      </div>
                      <div class="incident-actions">
                        <button class="incident-actions__btn incident-actions__btn--edit btn-abrir-editar">✏️</button>
                        <button class="incident-actions__btn incident-actions__btn--delete btn-abrir-eliminar">🗑️</button>
                      </div>
                    </li>`;

                if (inc.estado === 'finalizada') listaResueltas.innerHTML += html;
                else listaActivas.innerHTML += html;
            });

            document.getElementById("stat-abiertas").textContent = contadores.creada;
            document.getElementById("stat-curso").textContent = contadores.en_proceso;
            document.getElementById("stat-resueltas").textContent = contadores.finalizada;
            document.getElementById("stat-total").textContent = incidencias.length;
            document.getElementById("badge-incidencias").textContent = contadores.creada + contadores.en_proceso;

        } catch (error) {
            console.error("Error al cargar:", error);
        }
    }

    cargarIncidencias();

    // ─── Lógica para Abrir Modales (Delegación) ────────────────────────────────

    document.querySelectorAll(".btn-abrir-nueva").forEach(btn => {
        btn.addEventListener("click", () => {
            limpiarFormulario("modal-nueva-incidencia");
            abrirModal("modal-nueva-incidencia");
        });
    });

    document.addEventListener("click", (e) => {
        const btnEditar = e.target.closest(".btn-abrir-editar");
        const btnEliminar = e.target.closest(".btn-abrir-eliminar");

        if (btnEditar) {
            const item = btnEditar.closest(".incident-item");
            const modal = document.getElementById("modal-editar-incidencia");
            modal.dataset.incidenciaId = item.dataset.id;
            document.getElementById("editar-titulo").value = item.querySelector(".incident-body__title").textContent;
            document.getElementById("editar-desc").value = item.querySelector(".incident-body__desc").textContent;
            document.getElementById("editar-tipo").value = item.dataset.tipo;

            // ✅ Mostrar imagen actual en el modal de editar si existe
            const imgActual = item.querySelector(".incident-img");
            let preview = document.getElementById("editar-imagen-preview");
            if (imgActual) {
                if (!preview) {
                    preview = document.createElement("img");
                    preview.id = "editar-imagen-preview";
                    preview.style.cssText = "width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-top:8px;";
                    document.getElementById("editar-imagen")?.closest(".modal__dropzone")?.after(preview);
                }
                preview.src = imgActual.src;
            } else if (preview) {
                preview.src = "";
            }

            abrirModal("modal-editar-incidencia");
        }

        if (btnEliminar) {
            const item = btnEliminar.closest(".incident-item");
            document.getElementById("modal-eliminar-incidencia").dataset.incidenciaId = item.dataset.id;
            abrirModal("modal-eliminar-incidencia");
        }
    });

    // ─── Acciones API ──────────────────────────────────────────────────────────

    // Crear
    document.getElementById("btn-enviar-incidencia")?.addEventListener("click", async () => {
        const datos = getDatosFormulario("nueva");
        if (!validarFormulario(datos)) return;

        const formData = new FormData();
        formData.append("accion", "crear");
        formData.append("id_piso", 1);
        formData.append("id_usuario", 1);
        formData.append("titulo", datos.titulo);
        formData.append("descripcion", datos.descripcion);
        formData.append("tipo", datos.tipo);
        formData.append("urgencia", datos.urgencia);

        // ✅ Adjuntar imagen si se seleccionó
        const imagenInput = document.getElementById("nueva-imagen");
        if (imagenInput?.files[0]) {
            formData.append("imagen", imagenInput.files[0]);
        }

        const res = await fetch("../php/incidencias.php", { method: "POST", body: formData });
        const result = await res.json();

        if (result.success) {
            cerrarModal("modal-nueva-incidencia");
            cargarIncidencias();
        } else {
            alert("Error: " + (result.error || "Desconocido"));
        }
    });

    // Editar
    document.getElementById("btn-confirmar-editar")?.addEventListener("click", async () => {
        const modal = document.getElementById("modal-editar-incidencia");
        const formData = new FormData();
        formData.append("accion", "editar");
        formData.append("id", modal.dataset.incidenciaId);
        formData.append("titulo", document.getElementById("editar-titulo").value);
        formData.append("descripcion", document.getElementById("editar-desc").value);
        formData.append("tipo", document.getElementById("editar-tipo").value);

        const urgActiva = modal.querySelector(".modal__urgencia-btn--active");
        formData.append("urgencia", urgActiva ? urgActiva.dataset.urgencia : "media");

        // ✅ Adjuntar imagen si se seleccionó una nueva
        const imagenInput = document.getElementById("editar-imagen");
        if (imagenInput?.files[0]) {
            formData.append("imagen", imagenInput.files[0]);
        }

        const res = await fetch("../php/incidencias.php", { method: "POST", body: formData });
        const result = await res.json();
        if (result.success) {
            cerrarModal("modal-editar-incidencia");
            cargarIncidencias();
        }
    });

    // Eliminar
    document.getElementById("btn-confirmar-eliminar")?.addEventListener("click", async () => {
        const id = document.getElementById("modal-eliminar-incidencia").dataset.incidenciaId;
        const formData = new FormData();
        formData.append("accion", "eliminar");
        formData.append("id", id);

        const res = await fetch("../php/incidencias.php", { method: "POST", body: formData });
        const result = await res.json();
        if (result.success) {
            cerrarModal("modal-eliminar-incidencia");
            cargarIncidencias();
        }
    });

    // ─── Helpers ────────────────────────────────────────────────────────────────

    function getDatosFormulario(prefix) {
        const urgenciaActiva = document.querySelector(`#modal-${prefix}-incidencia .modal__urgencia-btn--active`);
        return {
            tipo: document.getElementById(`${prefix}-tipo`)?.value ?? "",
            titulo: document.getElementById(`${prefix}-titulo`)?.value ?? "",
            descripcion: document.getElementById(`${prefix}-desc`)?.value ?? "",
            urgencia: (urgenciaActiva?.dataset.urgencia ?? "media").replace("bajo", "baja").replace("medio", "media").replace("alto", "alta"),
        };
    }

    function validarFormulario(datos) {
        if (!datos.tipo || !datos.titulo.trim() || !datos.descripcion.trim()) {
            alert("Por favor, rellena los campos obligatorios.");
            return false;
        }
        return true;
    }

    function limpiarFormulario(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.querySelectorAll("input[type=text], textarea, select").forEach(el => el.value = "");
        modal.querySelectorAll(".modal__urgencia-btn").forEach(btn => btn.classList.remove("modal__urgencia-btn--active"));
        // ✅ Limpiar también el input de archivo y el preview
        modal.querySelectorAll("input[type=file]").forEach(el => el.value = "");
        const preview = modal.querySelector("[id$='-imagen-preview']");
        if (preview) preview.src = "";
    }

    document.querySelectorAll(".modal__urgencia-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.parentElement.querySelectorAll(".modal__urgencia-btn").forEach(b => b.classList.remove("modal__urgencia-btn--active"));
            btn.classList.add("modal__urgencia-btn--active");
        });
    });
}

document.addEventListener("DOMContentLoaded", initIncidencias);