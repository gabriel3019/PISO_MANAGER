const nombreUsuario = document.getElementById("nombreUsuario");

/* ================= USUARIO ================= */
function cargarUsuario() {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    if (usuario && nombreUsuario) {
        nombreUsuario.textContent = usuario.nombre;
    }
}

async function initIncidencias() {

    cargarUsuario();

    // ─── Sidebar: marcar enlace activo ───────────────────────────────
    const paginaActual = window.location.pathname.split("/").pop();
    document.querySelectorAll(".sidebar-link").forEach(link => {
        const paginaLink = link.getAttribute("href").split("/").pop();
        if (paginaLink === paginaActual) {
            link.closest("li").classList.add("active");
        }
    });

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
        const hayModalAbierto = [...document.querySelectorAll(".modal-overlay")]
            .some(m => !m.classList.contains("modal--hidden"));
        if (!hayModalAbierto) document.body.style.overflow = "";
    }

    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) cerrarModal(overlay.id);
        });
    });

    document.querySelectorAll("[data-modal-close]").forEach((btn) => {
        btn.addEventListener("click", () => cerrarModal(btn.dataset.modalClose));
    });

    // ─── Urgencia buttons (selección) ────────────────────────────────
    document.querySelectorAll(".modal__urgencia-row").forEach(row => {
        row.querySelectorAll(".modal__urgencia-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                row.querySelectorAll(".modal__urgencia-btn")
                    .forEach(b => b.classList.remove("modal__urgencia-btn--active"));
                btn.classList.add("modal__urgencia-btn--active");
                validarFormularioNueva();
            });
        });
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

    // ─── VALIDACIÓN FORMULARIO NUEVA ─────────────────────────────────
    const btnEnviar = document.getElementById("btn-enviar-incidencia");

    function validarFormularioNueva() {
        const titulo = document.getElementById("nueva-titulo")?.value.trim();
        const descripcion = document.getElementById("nueva-desc")?.value.trim();
        const tipo = document.getElementById("nueva-tipo")?.value;
        const urgenciaBtn = document.querySelector(
            "#modal-nueva-incidencia .modal__urgencia-btn--active"
        );
        const valido = !!(titulo && descripcion && tipo && urgenciaBtn);
        if (btnEnviar) btnEnviar.disabled = !valido;
    }

    ["nueva-titulo", "nueva-desc", "nueva-tipo"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", validarFormularioNueva);
        document.getElementById(id)?.addEventListener("change", validarFormularioNueva);
    });

    // ─── Contadores de caracteres ─────────────────────────────────────
    document.getElementById("nueva-titulo")?.addEventListener("input", (e) => {
        const count = document.getElementById("nueva-titulo-count");
        if (count) count.textContent = e.target.value.length;
    });

    document.getElementById("editar-titulo")?.addEventListener("input", (e) => {
        const count = document.getElementById("editar-titulo-count");
        if (count) count.textContent = e.target.value.length;
    });

    // ─── CARGAR INCIDENCIAS ──────────────────────────────────────────
    async function cargarIncidencias() {
        try {
            const resp = await fetch(`../php/incidencias.php?accion=listar&id_piso=1`);
            const data = await resp.json();

            const incidencias = Array.isArray(data) ? data : [];

            const listaActivas = document.getElementById("lista-activas");
            const listaResueltas = document.getElementById("lista-resueltas");

            listaActivas.innerHTML = "";
            listaResueltas.innerHTML = "";

            let contadores = { abierta: 0, en_curso: 0, resuelta: 0 };

            incidencias.forEach(inc => {
                // ✅ Normalizar estado: minúsculas + trim para comparar sin errores
                const estadoNorm = (inc.estado || '').toLowerCase().trim();

                // Contar según estado normalizado
                if (estadoNorm === 'abierta') {
                    contadores.abierta++;
                } else if (estadoNorm === 'en_curso' || estadoNorm === 'en curso') {
                    contadores.en_curso++;
                } else if (estadoNorm === 'resuelta') {
                    contadores.resuelta++;
                }

                const icono = {
                    fontaneria: "💧",
                    electricidad: "⚡",
                    climatizacion: "❄️",
                    carpinteria: "🔧",
                    otros: "📋"
                }[inc.tipo] || "📋";

                const iconoHTML = inc.imagen
                    ? `<img src="${inc.imagen}" class="incident-img"
                            style="width:48px;height:48px;object-fit:cover;border-radius:8px;"
                            onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'incident-icon',textContent:'${icono}'}))">`
                    : `<div class="incident-icon">${icono}</div>`;

                // ✅ Clases y etiquetas usando estado normalizado
                const estadoClase =
                    estadoNorm === 'abierta' ? 'open' :
                    estadoNorm === 'en_curso' || estadoNorm === 'en curso' ? 'progress' : 'done';

                const estadoLabel =
                    estadoNorm === 'abierta' ? 'Abierta' :
                    estadoNorm === 'en_curso' || estadoNorm === 'en curso' ? 'En curso' : 'Resuelta';

                const prioridadClase =
                    inc.urgencia === 'alta' || inc.urgencia === 'alto' ? 'high' :
                    inc.urgencia === 'media' || inc.urgencia === 'medio' ? 'medium' : 'low';

                const urgenciaLabel =
                    inc.urgencia === 'alto' || inc.urgencia === 'alta' ? 'Alta' :
                    inc.urgencia === 'medio' || inc.urgencia === 'media' ? 'Media' : 'Baja';

                const notificarBadge = inc.notificar_admin == 1
                    ? `<span style="font-size:.7rem;background:#dbeafe;color:#1d4ed8;padding:2px 7px;border-radius:999px;font-weight:600;margin-left:6px;">Admin</span>`
                    : '';

                const html = `
                    <li class="incident-item"
                        data-id="${inc.id}"
                        data-tipo="${inc.tipo}"
                        data-urgencia="${inc.urgencia}"
                        data-titulo="${inc.titulo?.replace(/"/g, '&quot;')}"
                        data-desc="${inc.descripcion?.replace(/"/g, '&quot;')}"
                        data-estado="${inc.estado}"
                        data-fecha="${inc.fecha_creacion || ''}"
                        data-imagen="${inc.imagen || ''}"
                        data-notificar="${inc.notificar_admin || 0}">

                        ${iconoHTML}

                        <div class="incident-body">
                            <p class="incident-body__title">${inc.titulo}${notificarBadge}</p>
                            <p class="incident-body__desc">${inc.descripcion}</p>
                            <p class="incident-body__meta">
                                Reportado · ${inc.fecha_creacion || 'Hoy'} · ${inc.tipo}
                            </p>
                        </div>

                        <div class="incident-status">
                            <span class="status-badge status-badge--${estadoClase}">
                                ${estadoLabel}
                            </span>
                            <span class="priority-dot priority-dot--${prioridadClase}">
                                ${urgenciaLabel}
                            </span>
                        </div>

                        <div class="incident-actions">
                            <button class="btn-abrir-editar incident-actions__btn incident-actions__btn--edit" title="Editar">✏️</button>
                            <button class="btn-abrir-eliminar incident-actions__btn incident-actions__btn--delete" title="Eliminar">🗑️</button>
                        </div>
                    </li>
                `;

                // ✅ Clasificar en lista correcta usando estado normalizado
                if (estadoNorm === "resuelta") {
                    listaResueltas.innerHTML += html;
                } else {
                    listaActivas.innerHTML += html;
                }
            });

            document.getElementById("stat-abiertas").textContent = contadores.abierta;
            document.getElementById("stat-curso").textContent = contadores.en_curso;
            document.getElementById("stat-resueltas").textContent = contadores.resuelta;
            document.getElementById("stat-total").textContent = incidencias.length;
            document.getElementById("badge-incidencias").textContent =
                contadores.abierta + contadores.en_curso;

        } catch (error) {
            console.error("Error cargando incidencias:", error);
        }
    }

    cargarIncidencias();

    // ─── MODAL DETALLE ───────────────────────────────────────────────
    document.addEventListener("click", (e) => {
        const item = e.target.closest(".incident-item");
        if (!item) return;
        if (e.target.closest(".btn-abrir-editar") || e.target.closest(".btn-abrir-eliminar")) return;

        const icono = {
            fontaneria: "💧",
            electricidad: "⚡",
            climatizacion: "❄️",
            carpinteria: "🔧",
            otros: "📋"
        }[item.dataset.tipo] || "📋";

        document.getElementById("detalle-icono").textContent = icono;

        // ✅ Normalizar estado para el modal también
        const estadoNorm = (item.dataset.estado || '').toLowerCase().trim();
        const estadoClase =
            estadoNorm === 'abierta' ? 'open' :
            estadoNorm === 'en_curso' || estadoNorm === 'en curso' ? 'progress' : 'done';
        const estadoLabel =
            estadoNorm === 'abierta' ? 'Abierta' :
            estadoNorm === 'en_curso' || estadoNorm === 'en curso' ? 'En curso' : 'Resuelta';
        const estadoBadge = document.getElementById("detalle-estado-badge");
        estadoBadge.className = `status-badge status-badge--${estadoClase}`;
        estadoBadge.textContent = estadoLabel;

        const prioClase =
            item.dataset.urgencia === 'alta' || item.dataset.urgencia === 'alto' ? 'high' :
            item.dataset.urgencia === 'media' || item.dataset.urgencia === 'medio' ? 'medium' : 'low';
        const urgenciaLabel =
            item.dataset.urgencia === 'alto' || item.dataset.urgencia === 'alta' ? 'Alta' :
            item.dataset.urgencia === 'medio' || item.dataset.urgencia === 'media' ? 'Media' : 'Baja';
        const prioDot = document.getElementById("detalle-prioridad-dot");
        prioDot.className = `priority-dot priority-dot--${prioClase}`;
        prioDot.textContent = urgenciaLabel;

        document.getElementById("detalle-tipo").textContent = item.dataset.tipo;
        document.getElementById("detalle-fecha").textContent = item.dataset.fecha || "—";
        document.getElementById("detalle-titulo").textContent = item.dataset.titulo;
        document.getElementById("detalle-desc").textContent = item.dataset.desc;

        document.getElementById("detalle-notificar").textContent =
            item.dataset.notificar === "1" ? "✅ Sí, notificado al administrador" : "No";

        const imagenWrap = document.getElementById("detalle-imagen-wrap");
        const imagenEl = document.getElementById("detalle-imagen");
        if (item.dataset.imagen) {
            imagenEl.src = item.dataset.imagen;
            imagenWrap.style.display = "block";
        } else {
            imagenWrap.style.display = "none";
        }

        abrirModal("modal-detalle-incidencia");
    });

    // ─── BOTÓN NUEVA INCIDENCIA ──────────────────────────────────────
    document.querySelectorAll(".btn-abrir-nueva").forEach(btn => {
        btn.addEventListener("click", () => {
            limpiarFormulario("modal-nueva-incidencia");
            if (btnEnviar) btnEnviar.disabled = true;
            abrirModal("modal-nueva-incidencia");
        });
    });

    // ─── BOTONES EDITAR / ELIMINAR ───────────────────────────────────
    document.addEventListener("click", (e) => {
        const btnEditar = e.target.closest(".btn-abrir-editar");
        const btnEliminar = e.target.closest(".btn-abrir-eliminar");

        if (btnEditar) {
            const item = btnEditar.closest(".incident-item");
            const modal = document.getElementById("modal-editar-incidencia");

            modal.dataset.incidenciaId = item.dataset.id;

            document.getElementById("editar-titulo").value = item.dataset.titulo;
            document.getElementById("editar-desc").value = item.dataset.desc;
            document.getElementById("editar-tipo").value = item.dataset.tipo;

            // ── Cargar estado actual en el select ──
            document.getElementById("editar-estado").value = item.dataset.estado;

            const count = document.getElementById("editar-titulo-count");
            if (count) count.textContent = item.dataset.titulo.length;

            const urgencia = item.dataset.urgencia;
            modal.querySelectorAll(".modal__urgencia-btn").forEach(b => {
                b.classList.toggle("modal__urgencia-btn--active", b.dataset.urgencia === urgencia);
            });

            document.getElementById("editar-notificar-admin").checked =
                item.dataset.notificar === "1";

            abrirModal("modal-editar-incidencia");
        }

        if (btnEliminar) {
            const item = btnEliminar.closest(".incident-item");
            document.getElementById("modal-eliminar-incidencia").dataset.incidenciaId = item.dataset.id;
            abrirModal("modal-eliminar-incidencia");
        }
    });

    // ─── CREAR ───────────────────────────────────────────────────────
    btnEnviar?.addEventListener("click", async () => {

        const titulo = document.getElementById("nueva-titulo").value.trim();
        const descripcion = document.getElementById("nueva-desc").value.trim();
        const tipo = document.getElementById("nueva-tipo").value;
        const urgenciaBtn = document.querySelector(
            "#modal-nueva-incidencia .modal__urgencia-btn--active"
        );
        const notificar = document.getElementById("nueva-notificar-admin").checked ? 1 : 0;

        if (!titulo || !descripcion || !tipo) {
            alert("Rellena todos los campos obligatorios.");
            return;
        }

        const formData = new FormData();
        formData.append("accion", "crear");
        formData.append("id_piso", 1);
        formData.append("id_usuario", 1);
        formData.append("titulo", titulo);
        formData.append("descripcion", descripcion);
        formData.append("tipo", tipo);
        formData.append("urgencia", urgenciaBtn ? urgenciaBtn.dataset.urgencia : "baja");
        formData.append("notificar_admin", notificar);

        const imagenFile = document.getElementById("nueva-imagen").files[0];
        if (imagenFile) formData.append("imagen", imagenFile);

        const res = await fetch("../php/incidencias.php", { method: "POST", body: formData });
        const result = await res.json();

        if (result.success) {
            cerrarModal("modal-nueva-incidencia");
            cargarIncidencias();
        } else {
            alert("Error al crear la incidencia: " + (result.error || ""));
        }
    });

    // ─── EDITAR ──────────────────────────────────────────────────────
    // ✅ CORREGIDO: e.preventDefault() y mejor manejo de errores
    document.getElementById("btn-confirmar-editar")?.addEventListener("click", async (e) => {
        e.preventDefault(); // ✅ Prevenir comportamiento por defecto

        const modal = document.getElementById("modal-editar-incidencia");
        const id = modal.dataset.incidenciaId;
        const titulo = document.getElementById("editar-titulo").value.trim();
        const descripcion = document.getElementById("editar-desc").value.trim();
        const tipo = document.getElementById("editar-tipo").value;
        const estado = document.getElementById("editar-estado").value;
        const urgenciaBtn = modal.querySelector(".modal__urgencia-btn--active");
        const notificar = document.getElementById("editar-notificar-admin").checked ? 1 : 0;

        if (!titulo || !descripcion) {
            alert("Rellena título y descripción.");
            return;
        }

        const formData = new FormData();
        formData.append("accion", "editar"); // ✅ Asegurar que se envía
        formData.append("id", id);
        formData.append("titulo", titulo);
        formData.append("descripcion", descripcion);
        formData.append("tipo", tipo);
        formData.append("estado", estado);
        formData.append("urgencia", urgenciaBtn ? urgenciaBtn.dataset.urgencia : "baja");
        formData.append("notificar_admin", notificar);

        const imagenFile = document.getElementById("editar-imagen").files[0];
        if (imagenFile) formData.append("imagen", imagenFile);

        // DEBUG: Verificar que accion llega
        console.log("📤 Enviando accion:", formData.get("accion"));
        console.log("📋 Todos los datos:", Object.fromEntries(formData));

        try {
            const res = await fetch("../php/incidencias.php", { 
                method: "POST", 
                body: formData 
            });
            
            // Verificar respuesta
            const text = await res.text();
            console.log("📥 Respuesta raw:", text);
            
            const result = JSON.parse(text);

            if (result.success) {
                cerrarModal("modal-editar-incidencia");
                cargarIncidencias();
            } else {
                alert("Error al editar: " + (result.error || ""));
            }
        } catch (error) {
            console.error("❌ Error en fetch:", error);
            alert("Error de conexión al editar");
        }
    });

    // ─── ELIMINAR ────────────────────────────────────────────────────
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
        } else {
            alert("Error al eliminar: " + (result.error || ""));
        }
    });

    // ─── Util ───────────────────────────────────────────────────────
    function limpiarFormulario(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.querySelectorAll("input, textarea, select").forEach(el => el.value = "");
        modal.querySelectorAll(".modal__urgencia-btn--active")
            .forEach(b => b.classList.remove("modal__urgencia-btn--active"));
        modal.querySelectorAll("input[type=checkbox]")
            .forEach(cb => cb.checked = false);
        const tituloCount = modal.querySelector("[id$='-titulo-count']");
        if (tituloCount) tituloCount.textContent = "0";
    }
}

document.addEventListener("DOMContentLoaded", initIncidencias);