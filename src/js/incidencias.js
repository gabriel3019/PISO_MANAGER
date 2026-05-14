const nombreUsuario = document.getElementById("nombreUsuario");

/* ================= USUARIO ================= */
function cargarUsuario() {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    if (usuario && nombreUsuario) {
        nombreUsuario.textContent = usuario.nombre;
    }
    return usuario;
}

function obtenerIdUsuario() {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    return usuario?.id_usuario || usuario?.id || null;
}

async function initIncidencias() {

    const usuario = cargarUsuario();

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

    // ─── MOSTRAR COMENTARIO SI SE MARCA "NOTIFICAR ADMIN" ────────────
    function initToggleComentario() {
        ['nueva', 'editar'].forEach(prefix => {
            const checkbox = document.getElementById(`${prefix}-notificar-admin`);
            const wrap = document.getElementById(`${prefix}-comentario-admin-wrap`);
            if (checkbox && wrap) {
                checkbox.addEventListener('change', () => {
                    wrap.style.display = checkbox.checked ? 'block' : 'none';
                });
                wrap.style.display = checkbox.checked ? 'block' : 'none';
            }
        });
    }

    // ─── CONFIGURAR FECHA MÍNIMA (hoy) para fecha_inicio ─────────────
    function setMinDateToday(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const hoy = new Date().toISOString().split('T')[0];
        input.min = hoy;
    }

    // ─── VALIDACIÓN EN TIEMPO REAL de fecha_inicio ───────────────────
    function setupFechaInicioValidation(inputId, errorId) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);
        if (!input) return;

        input.addEventListener('change', function () {
            const hoy = new Date().toISOString().split('T')[0];
            if (this.value && this.value < hoy) {
                if (error) {
                    error.style.display = 'block';
                    this.setCustomValidity('Fecha inválida');
                    this.reportValidity();
                }
            } else {
                if (error) {
                    error.style.display = 'none';
                    this.setCustomValidity('');
                }
            }
        });

        input.addEventListener('blur', function () {
            const hoy = new Date().toISOString().split('T')[0];
            if (this.value && this.value < hoy) {
                if (error) error.style.display = 'block';
            }
        });
    }

    // Inicializar validaciones y fechas mínimas
    setMinDateToday('nueva-fecha-inicio');
    setMinDateToday('editar-fecha-inicio');
    setupFechaInicioValidation('nueva-fecha-inicio', 'nueva-fecha-inicio-error');
    setupFechaInicioValidation('editar-fecha-inicio', 'editar-fecha-inicio-error');

    // Inicializar toggle de comentario
    initToggleComentario();

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
                const estadoNorm = (inc.estado || '').toLowerCase().trim();

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

                // 🔔 NUEVO: Añadimos data-id-usuario para validación de ownership en frontend
                const html = `
                    <li class="incident-item"
                        data-id="${inc.id}"
                        data-id-usuario="${inc.id_usuario}"
                        data-tipo="${inc.tipo}"
                        data-urgencia="${inc.urgencia}"
                        data-titulo="${inc.titulo?.replace(/"/g, '&quot;')}"
                        data-desc="${inc.descripcion?.replace(/"/g, '&quot;')}"
                        data-estado="${inc.estado}"
                        data-fecha="${inc.fecha || inc.fecha_creacion || ''}"
                        data-imagen="${inc.imagen || ''}"
                        data-notificar="${inc.notificar_admin || 0}"
                        data-fecha-inicio="${inc.fecha_inicio || ''}"
                        data-fecha-fin="${inc.fecha_fin || ''}"
                        data-comentario="${(inc.comentario_admin || '').replace(/"/g, '&quot;')}">

                        ${iconoHTML}

                        <div class="incident-body">
                            <p class="incident-body__title">${inc.titulo}${notificarBadge}</p>
                            <p class="incident-body__desc">${inc.descripcion}</p>
                            <p class="incident-body__meta">
                                Reportado · ${inc.fecha || inc.fecha_creacion} · ${inc.tipo}
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

        const comentarioWrap = document.getElementById("detalle-comentario-wrap");
        const comentarioEl = document.getElementById("detalle-comentario");
        if (item.dataset.comentario) {
            comentarioEl.textContent = item.dataset.comentario;
            comentarioWrap.style.display = "block";
        } else {
            comentarioEl.textContent = "";
            comentarioWrap.style.display = "none";
        }

        const fechaInicio = item.dataset.fechaInicio ? new Date(item.dataset.fechaInicio).toLocaleDateString('es-ES') : '—';
        const fechaFin = item.dataset.fechaFin ? new Date(item.dataset.fechaFin).toLocaleDateString('es-ES') : 'Pendiente';
        document.getElementById("detalle-fecha-inicio").textContent = fechaInicio;
        document.getElementById("detalle-fecha-fin").textContent = fechaFin;

        const imagenWrap = document.getElementById("detalle-imagen-wrap");
        const imagenEl = document.getElementById("detalle-imagen");
        if (item.dataset.imagen) {
            imagenEl.src = item.dataset.imagen;
            imagenWrap.style.display = "block";
        } else {
            imagenWrap.style.display = "none";
        }

        actualizarBotonConversacion({
            id_incidencia: item.dataset.id,
            id_usuario: parseInt(item.dataset.idUsuario || 0),
            notificar_admin: parseInt(item.dataset.notificar || 0)
        });

        abrirModal("modal-detalle-incidencia");
    });

    // ─── BOTÓN NUEVA INCIDENCIA ──────────────────────────────────────
    document.querySelectorAll(".btn-abrir-nueva").forEach(btn => {
        btn.addEventListener("click", () => {
            limpiarFormulario("modal-nueva-incidencia");
            if (btnEnviar) btnEnviar.disabled = true;
            initToggleComentario();
            setMinDateToday('nueva-fecha-inicio');
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
            document.getElementById("editar-estado").value = item.dataset.estado;

            const count = document.getElementById("editar-titulo-count");
            if (count) count.textContent = item.dataset.titulo.length;

            if (item.dataset.fechaInicio) {
                document.getElementById("editar-fecha-inicio").value = item.dataset.fechaInicio;
            }
            if (item.dataset.fechaFin) {
                document.getElementById("editar-fecha-fin").value = item.dataset.fechaFin;
            }

            const urgencia = item.dataset.urgencia;
            modal.querySelectorAll(".modal__urgencia-btn").forEach(b => {
                b.classList.toggle("modal__urgencia-btn--active", b.dataset.urgencia === urgencia);
            });

            document.getElementById("editar-notificar-admin").checked =
                item.dataset.notificar === "1";

            const comentarioEditarEl = document.getElementById("editar-comentario-admin");
            if (comentarioEditarEl) {
                comentarioEditarEl.value = item.dataset.comentario || "";
            }

            initToggleComentario();
            setupFechaInicioValidation('editar-fecha-inicio', 'editar-fecha-inicio-error');

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
        const fechaInicio = document.getElementById("nueva-fecha-inicio").value;
        const fechaFin = document.getElementById("nueva-fecha-fin").value || null;
        const urgenciaBtn = document.querySelector(
            "#modal-nueva-incidencia .modal__urgencia-btn--active"
        );
        const notificar = document.getElementById("nueva-notificar-admin").checked ? 1 : 0;

        if (!titulo || !descripcion || !tipo || !fechaInicio) {
            alert("Rellena todos los campos obligatorios.");
            return;
        }

        const hoy = new Date().toISOString().split('T')[0];
        if (fechaInicio < hoy) {
            document.getElementById("nueva-fecha-inicio-error").style.display = 'block';
            return;
        }

        const idUsuario = obtenerIdUsuario();

        const formData = new FormData();
        formData.append("accion", "crear");
        formData.append("id_piso", 1);
        formData.append("id_usuario", idUsuario);
        formData.append("titulo", titulo);
        formData.append("descripcion", descripcion);
        formData.append("tipo", tipo);
        formData.append("fecha_inicio", fechaInicio);
        formData.append("fecha_fin", fechaFin);
        formData.append("urgencia", urgenciaBtn ? urgenciaBtn.dataset.urgencia : "bajo");
        formData.append("notificar_admin", notificar);

        if (notificar) {
            const comentario = document.getElementById("nueva-comentario-admin")?.value.trim();
            if (comentario) {
                formData.append("comentario_admin", comentario);
                formData.append("id_usuario_comentario", idUsuario);
            }
        }

        console.log("ID USUARIO:", idUsuario);
        console.log("DATOS:", Object.fromEntries(formData));

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
    document.getElementById("btn-confirmar-editar")?.addEventListener("click", async (e) => {
        e.preventDefault();

        const modal = document.getElementById("modal-editar-incidencia");
        const id = modal.dataset.incidenciaId;
        const titulo = document.getElementById("editar-titulo").value.trim();
        const descripcion = document.getElementById("editar-desc").value.trim();
        const tipo = document.getElementById("editar-tipo").value;
        const estado = document.getElementById("editar-estado").value;
        const fechaInicio = document.getElementById("editar-fecha-inicio").value;
        const fechaFin = document.getElementById("editar-fecha-fin").value || null;
        const urgenciaBtn = modal.querySelector(".modal__urgencia-btn--active");
        const notificar = document.getElementById("editar-notificar-admin").checked ? 1 : 0;

        if (!titulo || !descripcion || !fechaInicio) {
            alert("Rellena título, descripción y fecha de inicio.");
            return;
        }

        const hoy = new Date().toISOString().split('T')[0];
        if (fechaInicio < hoy) {
            document.getElementById("editar-fecha-inicio-error").style.display = 'block';
            return;
        }

        const formData = new FormData();
        formData.append("accion", "editar");
        formData.append("id", id);
        formData.append("titulo", titulo);
        formData.append("descripcion", descripcion);
        formData.append("tipo", tipo);
        formData.append("estado", estado);
        formData.append("fecha_inicio", fechaInicio);
        formData.append("fecha_fin", fechaFin);
        formData.append("urgencia", urgenciaBtn ? urgenciaBtn.dataset.urgencia : "bajo");
        formData.append("notificar_admin", notificar);

        if (notificar) {
            const comentario = document.getElementById("editar-comentario-admin")?.value.trim();
            if (comentario) {
                formData.append("comentario_admin", comentario);
                formData.append("id_usuario_comentario", obtenerIdUsuario());
            }
        }

        const imagenFile = document.getElementById("editar-imagen").files[0];
        if (imagenFile) formData.append("imagen", imagenFile);

        console.log("📤 Enviando accion:", formData.get("accion"));
        console.log("📋 Todos los datos:", Object.fromEntries(formData));

        try {
            const res = await fetch("../php/incidencias.php", {
                method: "POST",
                body: formData
            });

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
    const modal = document.getElementById("modal-eliminar-incidencia");
    const id = modal?.dataset.incidenciaId;
    
    console.log("🗑️ Intentando eliminar ID:", id, "tipo:", typeof id);
    
    if (!id || id === "undefined" || id === "null" || id.trim() === "") {
        console.error("❌ ID no válido para eliminar");
        alert("Error: No se pudo identificar la incidencia");
        cerrarModal("modal-eliminar-incidencia");
        return;
    }

    const formData = new FormData();
    formData.append("accion", "eliminar");
    formData.append("id", id.toString().trim());

    console.log("📤 Enviando FormData:", Object.fromEntries(formData));

    try {
        const res = await fetch("../php/incidencias.php", { 
            method: "POST", 
            body: formData
        });

        console.log("📡 Status:", res.status, "OK:", res.ok);
        
        const text = await res.text();
        console.log("📥 Respuesta raw:", text);
        
        if (!text.trim()) {
            throw new Error("Servidor devolvió respuesta vacía (HTTP " + res.status + ")");
        }
        
        const result = JSON.parse(text);

        if (result.success) {
            cerrarModal("modal-eliminar-incidencia");
            cargarIncidencias();
        } else {
            alert("Error: " + (result.error || "Desconocido"));
        }
    } catch (error) {
        console.error("💥 Error fatal en eliminar:", error);
        alert("Error de conexión. Revisa la consola para más detalles.");
    }
});

    // ─── Util ────────────────────────────────────────────────────────
    function limpiarFormulario(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.querySelectorAll("input, textarea, select").forEach(el => {
            if (el.type !== 'date' || !el.hasAttribute('required')) {
                el.value = "";
            }
        });
        modal.querySelectorAll(".modal__urgencia-btn--active")
            .forEach(b => b.classList.remove("modal__urgencia-btn--active"));
        modal.querySelectorAll("input[type=checkbox]")
            .forEach(cb => cb.checked = false);
        const tituloCount = modal.querySelector("[id$='-titulo-count']");
        if (tituloCount) tituloCount.textContent = "0";
        modal.querySelectorAll(".modal__hint").forEach(hint => {
            if (hint.id?.includes('error')) hint.style.display = 'none';
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔔 SISTEMA DE NOTIFICACIONES PARA USUARIO
    // ═══════════════════════════════════════════════════════════════

    let idUsuarioActual = null;
    let pollingNotificaciones = null;
    let idIncidenciaChatActual = null;

    async function comprobarNuevasNotificaciones() {
        const idUsuario = obtenerIdUsuario();
        if (!idUsuario) return;

        idUsuarioActual = idUsuario;

        try {
            const resp = await fetch(
                `../php/incidencias.php?accion=obtener_notificaciones_usuario&id_usuario=${idUsuario}`
            );
            const data = await resp.json();

            if (data.success && data.notificaciones.length > 0) {
                mostrarModalNotificaciones(data.notificaciones);
                actualizarBadgeNotificaciones(data.notificaciones.length);
            }
        } catch (error) {
            console.error("Error comprobando notificaciones:", error);
        }
    }

    function mostrarModalNotificaciones(notificaciones) {
        const modal = document.getElementById("modal-notificaciones-usuario");
        const lista = document.getElementById("lista-notificaciones-usuario");
        const vacio = document.getElementById("notify-vacio-usuario");

        if (!lista || !modal) return;

        lista.innerHTML = notificaciones.map(n => {
            const icono = {
                fontaneria: "💧", electricidad: "⚡", climatizacion: "❄️",
                carpinteria: "🔧", otros: "📋"
            }[n.tipo] || "📋";

            const fecha = n.fecha_creacion
                ? new Date(n.fecha_creacion).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                })
                : 'Ahora';

            return `
            <li class="notify-item" 
                data-id-notificacion="${n.id_notificacion}" 
                data-id-inincidencia="${n.id_incidencia}"
                data-urgencia="${n.urgencia}">
                
                <div class="notify-header">
                    <p class="notify-title">${icono} ${n.titulo}</p>
                    <span class="notify-fecha">${fecha}</span>
                </div>
                <p class="notify-mensaje">${n.mensaje}</p>
                <p class="notify-meta">Estado: ${formatearEstado(n.estado)}</p>
                
                <div class="notify-actions" style="margin-top:12px;display:flex;gap:8px;">
                    <button class="btn-ver-conversacion" 
                            data-id-notif="${n.id_notificacion}"
                            data-id-inc="${n.id_incidencia}"
                            style="flex:1;padding:8px 12px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600;">
                        💬 Ver conversación
                    </button>
                    <button class="btn-ver-detalle-notif"
                            data-id-inc="${n.id_incidencia}"
                            style="flex:1;padding:8px 12px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600;">
                        📋 Ver detalle
                    </button>
                </div>
            </li>
        `;
        }).join('');

        vacio.style.display = notificaciones.length > 0 ? 'none' : 'block';
        lista.style.display = notificaciones.length > 0 ? 'flex' : 'none';

        if (notificaciones.length > 0) {
            modal.classList.remove("modal--hidden");
            document.body.style.overflow = "hidden";
        }
    }

    function actualizarBadgeNotificaciones(cantidad) {
        const badge = document.getElementById("badge-incidencias");
        if (!badge) return;

        if (cantidad > 0) {
            badge.textContent = cantidad;
            badge.classList.add("show");
            badge.style.display = "inline-block";
        } else {
            badge.classList.remove("show");
            badge.style.display = "none";
        }
    }

    function formatearEstado(estado) {
        const estados = {
            'abierta': 'Abierta',
            'en_curso': 'En curso',
            'resuelta': 'Resuelta'
        };
        return estados[estado] || estado;
    }

    async function marcarNotificacionLeida(idNotificacion) {
        if (!idUsuarioActual) return;

        const formData = new FormData();
        formData.append("accion", "marcar_notificacion_usuario_leida");
        formData.append("id_notificacion", idNotificacion);
        formData.append("id_usuario", idUsuarioActual);

        try {
            await fetch("../php/incidencias.php", { method: "POST", body: formData });
        } catch (error) {
            console.error("Error marcando como leída:", error);
        }
    }

    async function marcarTodasLeidas() {
        if (!idUsuarioActual) return;

        const items = document.querySelectorAll("#lista-notificaciones-usuario .notify-item");
        for (const item of items) {
            const idNotif = item.dataset.idNotificacion;
            await marcarNotificacionLeida(idNotif);
        }
        comprobarNuevasNotificaciones();
    }

    function iniciarPollingNotificaciones() {
        comprobarNuevasNotificaciones();
        pollingNotificaciones = setInterval(comprobarNuevasNotificaciones, 30000);
    }

    function detenerPollingNotificaciones() {
        if (pollingNotificaciones) {
            clearInterval(pollingNotificaciones);
            pollingNotificaciones = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 💬 CONVERSACIÓN CON ADMINISTRADOR
    // ═══════════════════════════════════════════════════════════════

    async function abrirConversacionAdmin(idIncidencia, idNotificacion = null) {
        idIncidenciaChatActual = idIncidencia;

        if (idNotificacion) {
            await marcarNotificacionLeida(idNotificacion);
        }

        cerrarModal("modal-notificaciones-usuario");
        await cargarInfoIncidenciaChat(idIncidencia);
        await cargarMensajesChat(idIncidencia);

        const modal = document.getElementById("modal-conversacion-admin");
        modal.classList.remove("modal--hidden");
        document.body.style.overflow = "hidden";
        scrollToBottomChat();
    }

    async function cargarInfoIncidenciaChat(idIncidencia) {
        try {
            const resp = await fetch(`../php/incidencias.php?accion=obtener_incidencia&id=${idIncidencia}`);
            const data = await resp.json();

            if (data.success && data.incidencia) {
                const inc = data.incidencia;
                document.getElementById("chat-titulo-incidencia").textContent = inc.titulo;
                document.getElementById("chat-estado-incidencia").textContent = `Estado: ${formatearEstado(inc.estado)}`;
            }
        } catch (error) {
            console.error("Error cargando info incidencia:", error);
        }
    }

    async function cargarMensajesChat(idIncidencia) {
        const lista = document.getElementById("chat-mensajes-lista");

        try {
            const resp = await fetch(`../php/incidencias.php?accion=obtener_mensajes_incidencia&id_incidencia=${idIncidencia}`);
            const data = await resp.json();

            if (data.success && data.mensajes && data.mensajes.length > 0) {
                lista.innerHTML = data.mensajes.map(msg => {
                    const esUsuario = msg.origen === 'usuario' || msg.id_usuario == obtenerIdUsuario();
                    const clase = esUsuario ? 'mensaje-chat--usuario' : 'mensaje-chat--admin';
                    const autor = esUsuario ? 'Tú' : (msg.nombre || 'Administrador');
                    const fecha = msg.fecha_envio ? formatearFechaHora(msg.fecha_envio) : 'Ahora';

                    return `
                        <div class="mensaje-chat ${clase}">
                            <div class="mensaje-chat__autor">${autor}</div>
                            <div class="mensaje-chat__texto">${escapeHtml(msg.mensaje)}</div>
                            <div class="mensaje-chat__fecha">${fecha}</div>
                        </div>
                    `;
                }).join('');
            } else {
                lista.innerHTML = `
                    <div class="chat-sin-mensajes">
                        <div class="chat-sin-mensajes__icon">💬</div>
                        <p>Aún no hay mensajes en esta conversación</p>
                        <p style="font-size: 0.85rem; margin-top: 8px;">
                            El administrador te responderá pronto
                        </p>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error cargando mensajes:", error);
            lista.innerHTML = '<p style="text-align:center;color:#dc2626;">Error al cargar los mensajes</p>';
        }
    }

    function scrollToBottomChat() {
        const container = document.getElementById("chat-mensajes-container");
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }

    function formatearFechaHora(fechaStr) {
        const fecha = new Date(fechaStr);
        const ahora = new Date();
        const esHoy = fecha.toDateString() === ahora.toDateString();

        const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        if (esHoy) {
            return `Hoy ${hora}`;
        } else {
            return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ` ${hora}`;
        }
    }

    function escapeHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    // Event: Enviar mensaje al admin
    document.getElementById("btn-enviar-mensaje-admin")?.addEventListener("click", async () => {
        const input = document.getElementById("chat-input-mensaje");
        const mensaje = input.value.trim();

        if (!mensaje || !idIncidenciaChatActual) return;

        const formData = new FormData();
        formData.append("accion", "enviar_mensaje_admin");
        formData.append("id_incidencia", idIncidenciaChatActual);
        formData.append("id_usuario", obtenerIdUsuario());
        formData.append("mensaje", mensaje);

        try {
            const resp = await fetch("../php/incidencias.php", { method: "POST", body: formData });
            const data = await resp.json();

            if (data.success) {
                input.value = "";
                await cargarMensajesChat(idIncidenciaChatActual);
                scrollToBottomChat();
            } else {
                alert("Error al enviar el mensaje: " + (data.error || ""));
            }
        } catch (error) {
            console.error("Error enviando mensaje:", error);
            alert("Error de conexión al enviar el mensaje");
        }
    });

    // Event: Ver detalle completo desde el chat
    document.getElementById("btn-ver-detalle-completo")?.addEventListener("click", () => {
        cerrarModal("modal-conversacion-admin");
        const incidenciaEl = document.querySelector(`.incident-item[data-id="${idIncidenciaChatActual}"]`);
        if (incidenciaEl) {
            incidenciaEl.click();
        }
    });

    // Event: Enter para enviar mensaje (sin Shift)
    document.getElementById("chat-input-mensaje")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            document.getElementById("btn-enviar-mensaje-admin").click();
        }
    });

    // ═══════════════════════════════════════════════════════════════
    // 🔔 NUEVO: FUNCIONES PARA CONVERSACIÓN SEGURA DESDE DETALLE
    // ═══════════════════════════════════════════════════════════════

    // 🔔 NUEVO: Mostrar/ocultar botón conversación según condiciones
    function actualizarBotonConversacion(incidenciaData) {
        const btn = document.getElementById('btn-ver-conversacion');
        if (!btn) return;
        
        const idUsuarioLogueado = obtenerIdUsuario();
        const idCreador = parseInt(incidenciaData.id_usuario || 0);
        const requiereAdmin = parseInt(incidenciaData.notificar_admin || 0) === 1;
        
        // ✅ Solo mostrar si: es el creador Y necesita revisión admin
        if (idUsuarioLogueado && idCreador === idUsuarioLogueado && requiereAdmin) {
            btn.style.display = 'inline-block';
            btn.dataset.incidenciaId = incidenciaData.id_incidencia;
        } else {
            btn.style.display = 'none';
            btn.dataset.incidenciaId = '';
        }
    }

    // 🔔 NUEVO: Cargar conversación con validación de seguridad en backend
    async function cargarConversacionSegura(idIncidencia) {
        try {
            const resp = await fetch(
                `../php/incidencias.php?accion=obtener_conversacion_segura&id_incidencia=${idIncidencia}`,
                { credentials: 'same-origin' }
            );
            const data = await resp.json();
            
            if (!data.success) {
                console.warn('Acceso denegado a conversación:', data.error);
                alert('No tienes permiso para ver esta conversación');
                return null;
            }
            return data.mensajes;
        } catch (error) {
            console.error('Error cargando conversación:', error);
            alert('Error de conexión al cargar la conversación');
            return null;
        }
    }

    // 🔔 NUEVO: Abrir modal de conversación desde el detalle de incidencia
    async function abrirModalConversacionDesdeDetalle(idIncidencia) {
        const mensajes = await cargarConversacionSegura(idIncidencia);
        if (!mensajes) return; // Acceso denegado o error
        
        const lista = document.getElementById('chat-mensajes-lista');
        if (lista) {
            lista.innerHTML = mensajes.length > 0 
                ? mensajes.map(msg => {
                    const idUsuarioLogueado = obtenerIdUsuario();
                    const esUsuario = msg.origen === 'usuario' || msg.id_usuario == idUsuarioLogueado;
                    const clase = esUsuario ? 'mensaje-chat--usuario' : 'mensaje-chat--admin';
                    const autor = esUsuario ? 'Tú' : (msg.nombre || 'Administrador');
                    const fecha = msg.fecha_envio ? formatearFechaHora(msg.fecha_envio) : 'Ahora';
                    
                    return `
                        <div class="mensaje-chat ${clase}">
                            <div class="mensaje-chat__autor">${autor}</div>
                            <div class="mensaje-chat__texto">${escapeHtml(msg.mensaje)}</div>
                            <div class="mensaje-chat__fecha">${fecha}</div>
                        </div>
                    `;
                }).join('')
                : `<div class="chat-sin-mensajes"><p>Aún no hay mensajes en esta conversación</p></div>`;
        }
        
        const modal = document.getElementById('modal-conversacion-admin');
        if (modal) {
            modal.classList.remove('modal--hidden');
            document.body.style.overflow = 'hidden';
            scrollToBottomChat();
        }
    }

    // 🔔 NUEVO: Event listener para el botón de conversación en el detalle
    document.getElementById('btn-ver-conversacion')?.addEventListener('click', (e) => {
        const idIncidencia = e.currentTarget.dataset.incidenciaId;
        if (idIncidencia) {
            abrirModalConversacionDesdeDetalle(idIncidencia);
        }
    });

    // ═══════════════════════════════════════════════════════════════
    // 🔔 EVENT LISTENERS PARA NOTIFICACIONES
    // ═══════════════════════════════════════════════════════════════

    iniciarPollingNotificaciones();

    // Click en notificaciones (con botones)
    document.getElementById("lista-notificaciones-usuario")?.addEventListener("click", async (e) => {
        const btnConversacion = e.target.closest(".btn-ver-conversacion");
        const btnDetalle = e.target.closest(".btn-ver-detalle-notif");
        const notifyItem = e.target.closest(".notify-item");

        if (btnConversacion) {
            const idNotif = btnConversacion.dataset.idNotif;
            const idInc = btnConversacion.dataset.idInc;
            await abrirConversacionAdmin(idInc, idNotif);
            return;
        }

        if (btnDetalle) {
            const idInc = btnDetalle.dataset.idInc;
            cerrarModal("modal-notificaciones-usuario");
            const incidenciaEl = document.querySelector(`.incident-item[data-id="${idInc}"]`);
            if (incidenciaEl) {
                setTimeout(() => incidenciaEl.click(), 200);
            }
            return;
        }

        if (notifyItem && !btnConversacion && !btnDetalle) {
            const idNotificacion = notifyItem.dataset.idNotificacion;
            const idIncidencia = notifyItem.dataset.idInincidencia;

            await marcarNotificacionLeida(idNotificacion);
            cerrarModal("modal-notificaciones-usuario");

            const incidenciaEl = document.querySelector(`.incident-item[data-id="${idIncidencia}"]`);
            if (incidenciaEl) {
                incidenciaEl.click();
            }
            comprobarNuevasNotificaciones();
        }
    });

    document.getElementById("btn-marcar-todas-leidas-usuario")?.addEventListener("click", async () => {
        await marcarTodasLeidas();
    });

    const modalNotifUsuario = document.getElementById("modal-notificaciones-usuario");
    modalNotifUsuario?.addEventListener("click", (e) => {
        if (e.target === modalNotifUsuario) {
            cerrarModal("modal-notificaciones-usuario");
            comprobarNuevasNotificaciones();
        }
    });

    window.addEventListener("beforeunload", detenerPollingNotificaciones);
}

document.addEventListener("DOMContentLoaded", initIncidencias);