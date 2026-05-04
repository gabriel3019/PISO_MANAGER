const nombreUsuario = document.getElementById("nombreUsuario");

/* ================= USUARIO ================= */
function cargarUsuario() {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    if (usuario && nombreUsuario) {
        nombreUsuario.textContent = usuario.nombre;
    }
}

async function initIncidencias() {

    cargarUsuario(); // 👈 SOLUCIÓN AL PROBLEMA

    // ─── Helpers modales ─────────────────────────────────────────────
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

    // ─── Preview imágenes ────────────────────────────────────────────
    document.getElementById("nueva-imagen")?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        mostrarPreviewImagen(file, "nueva-imagen-preview");
    });

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
            preview.style.cssText =
                "width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-top:8px;";

            const inputFile = document.getElementById(previewId.replace("-preview", ""));
            inputFile?.closest(".modal__dropzone")?.after(preview);
        }

        preview.src = URL.createObjectURL(file);
    }

    // ─── CARGAR INCIDENCIAS ─────────────────────────────────────────
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

                if (contadores.hasOwnProperty(inc.estado)) {
                    contadores[inc.estado]++;
                }

                const icono = {
                    fontaneria: "💧",
                    electricidad: "⚡",
                    climatizacion: "❄️",
                    otros: "📋"
                }[inc.tipo] || "📋";

                const iconoHTML = inc.imagen
                    ? `<img src="${inc.imagen}" class="incident-img" style="width:48px;height:48px;object-fit:cover;border-radius:8px;">`
                    : `<div class="incident-icon">${icono}</div>`;

                const html = `
                    <li class="incident-item" data-id="${inc.id}" data-tipo="${inc.tipo}" data-urgencia="${inc.urgencia}">
                        ${iconoHTML}
                        <div class="incident-body">
                            <p class="incident-body__title">${inc.titulo}</p>
                            <p class="incident-body__desc">${inc.descripcion}</p>
                            <p class="incident-body__meta">
                                Reportado · ${inc.fecha_creacion || 'Hoy'} · ${inc.tipo}
                            </p>
                        </div>

                        <div class="incident-status">
                            <span class="status-badge status-badge--${
                                inc.estado === 'creada' ? 'open' :
                                inc.estado === 'en_proceso' ? 'progress' : 'done'
                            }">
                                ${inc.estado}
                            </span>

                            <span class="priority-dot priority-dot--${
                                inc.urgencia === 'alta' ? 'high' :
                                inc.urgencia === 'media' ? 'medium' : 'low'
                            }">
                                ${inc.urgencia}
                            </span>
                        </div>

                        <div class="incident-actions">
                            <button class="btn-abrir-editar">✏️</button>
                            <button class="btn-abrir-eliminar">🗑️</button>
                        </div>
                    </li>
                `;

                if (inc.estado === "finalizada") {
                    listaResueltas.innerHTML += html;
                } else {
                    listaActivas.innerHTML += html;
                }
            });

            document.getElementById("stat-abiertas").textContent = contadores.creada;
            document.getElementById("stat-curso").textContent = contadores.en_proceso;
            document.getElementById("stat-resueltas").textContent = contadores.finalizada;
            document.getElementById("stat-total").textContent = incidencias.length;
            document.getElementById("badge-incidencias").textContent =
                contadores.creada + contadores.en_proceso;

        } catch (error) {
            console.error("Error:", error);
        }
    }

    cargarIncidencias();

    // ─── BOTONES MODAL ──────────────────────────────────────────────
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

            document.getElementById("editar-titulo").value =
                item.querySelector(".incident-body__title").textContent;

            document.getElementById("editar-desc").value =
                item.querySelector(".incident-body__desc").textContent;

            document.getElementById("editar-tipo").value = item.dataset.tipo;

            abrirModal("modal-editar-incidencia");
        }

        if (btnEliminar) {
            const item = btnEliminar.closest(".incident-item");

            document.getElementById("modal-eliminar-incidencia")
                .dataset.incidenciaId = item.dataset.id;

            abrirModal("modal-eliminar-incidencia");
        }
    });

    // ─── CREAR ──────────────────────────────────────────────────────
    document.getElementById("btn-enviar-incidencia")?.addEventListener("click", async () => {

        const titulo = document.getElementById("nueva-titulo").value;
        const descripcion = document.getElementById("nueva-desc").value;
        const tipo = document.getElementById("nueva-tipo").value;

        if (!titulo || !descripcion || !tipo) {
            alert("Rellena todos los campos");
            return;
        }

        const formData = new FormData();
        formData.append("accion", "crear");
        formData.append("id_piso", 1);
        formData.append("id_usuario", 1);
        formData.append("titulo", titulo);
        formData.append("descripcion", descripcion);
        formData.append("tipo", tipo);
        formData.append("urgencia", "media");

        const res = await fetch("../php/incidencias.php", {
            method: "POST",
            body: formData
        });

        const result = await res.json();

        if (result.success) {
            cerrarModal("modal-nueva-incidencia");
            cargarIncidencias();
        }
    });

    // ─── ELIMINAR ───────────────────────────────────────────────────
    document.getElementById("btn-confirmar-eliminar")?.addEventListener("click", async () => {

        const id = document.getElementById("modal-eliminar-incidencia").dataset.incidenciaId;

        const formData = new FormData();
        formData.append("accion", "eliminar");
        formData.append("id", id);

        const res = await fetch("../php/incidencias.php", {
            method: "POST",
            body: formData
        });

        const result = await res.json();

        if (result.success) {
            cerrarModal("modal-eliminar-incidencia");
            cargarIncidencias();
        }
    });

    function limpiarFormulario(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.querySelectorAll("input, textarea, select").forEach(el => el.value = "");
    }
}

document.addEventListener("DOMContentLoaded", initIncidencias);