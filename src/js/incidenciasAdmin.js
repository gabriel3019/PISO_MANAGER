const incidenciasList = document.getElementById("incidenciasList");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter");

const countAbiertas = document.getElementById("stat-abiertas");
const countEnCurso = document.getElementById("stat-curso");
const countResueltas = document.getElementById("stat-resueltas");
const countTotal = document.getElementById("stat-total");

const btnNotificacionesUser = document.getElementById("btnNotificacionesUser");
const panelNotificacionesUser = document.getElementById("panelNotificacionesUser");
const cerrarPanelNotificacionesUser = document.getElementById("cerrarPanelNotificacionesUser");
const overlayNotificacionesUser = document.getElementById("overlayNotificacionesUser");
const listaNotificacionesUser = document.getElementById("listaNotificacionesUser");
const contadorNotificacionesUser = document.getElementById("contadorNotificacionesUser");

btnNotificacionesUser?.addEventListener("click", abrirPanelNotificacionesUser);

cerrarPanelNotificacionesUser?.addEventListener("click", cerrarPanelNotificaciones);

overlayNotificacionesUser?.addEventListener("click", cerrarPanelNotificaciones);

let incidencias = [];
let filtroActual = "todas";

document.addEventListener("DOMContentLoaded", () => {
    cargarIncidencias();
    cargarNotificaciones();
});

async function cargarIncidencias() {
    try {
        const response = await fetch("../php/incidenciasAdmin.php?accion=listar&id_piso=1");
        const data = await response.json();

        if (data.success) {
            incidencias = data.incidencias;
            pintarContadores();
            pintarIncidencias();
        }
    } catch (error) {
        console.error("Error al cargar incidencias:", error);
    }
}

function pintarContadores() {
    countAbiertas.textContent = incidencias.filter(i => i.estado === "abierta").length;
    countEnCurso.textContent = incidencias.filter(i => i.estado === "en_curso").length;
    countResueltas.textContent = incidencias.filter(i => i.estado === "resuelta").length;
    countTotal.textContent = incidencias.length;
}

function pintarIncidencias() {
    const textoBusqueda = searchInput.value.toLowerCase();

    const filtradas = incidencias.filter(incidencia => {
        const coincideFiltro =
            filtroActual === "todas"
                ? incidencia.estado !== "resuelta"
                : incidencia.estado === filtroActual;

        const coincideBusqueda =
            incidencia.titulo.toLowerCase().includes(textoBusqueda) ||
            incidencia.descripcion.toLowerCase().includes(textoBusqueda) ||
            incidencia.usuario.toLowerCase().includes(textoBusqueda);

        return coincideFiltro && coincideBusqueda;
    });

    incidenciasList.innerHTML = "";

    if (filtradas.length === 0) {
        incidenciasList.innerHTML = `<p class="empty">No hay incidencias</p>`;
        return;
    }

    filtradas.forEach(incidencia => {
        const li = document.createElement("li");
        li.classList.add("incident-item");
        li.dataset.id = incidencia.id_incidencia;

        const iconos = {
            fontaneria: "💧",
            electricidad: "⚡",
            climatizacion: "❄️",
            carpinteria: "🔧",
            otros: "📋"
        };
        const icono = iconos[incidencia.tipo] || "📋";

        const estadoClase =
            incidencia.estado === "abierta" ? "open" :
                incidencia.estado === "en_curso" ? "progress" : "done";

        const estadoLabel =
            incidencia.estado === "abierta" ? "Abierta" :
                incidencia.estado === "en_curso" ? "En curso" : "Resuelta";

        const prioridadClase =
            incidencia.urgencia === "alta" || incidencia.urgencia === "alto" ? "high" : "low";

        const urgenciaLabel =
            incidencia.urgencia === "alta" || incidencia.urgencia === "alto" ? "Alta" : "Baja";

        const notificarBadge = incidencia.notificar_inquilino == 1
            ? `<span style="font-size:.7rem;background:#dcfce7;color:#15803d;padding:2px 7px;border-radius:999px;font-weight:600;margin-left:6px;">Inquilino notificado</span>`
            : '';

        li.innerHTML = `
            <div class="incident-icon">${icono}</div>

            <div class="incident-body">
                <p class="incident-body__title">${incidencia.titulo}${notificarBadge}</p>
                <p class="incident-body__desc">${incidencia.descripcion}</p>
                <p class="incident-body__meta">
                    ${incidencia.usuario} · ${formatearFecha(incidencia.fecha || incidencia.fecha_creacion)} · ${incidencia.tipo}
                </p>
            </div>

            <div class="incident-status">
                <span class="status-badge status-badge--${estadoClase}">${estadoLabel}</span>
                <span class="priority-dot priority-dot--${prioridadClase}">${urgenciaLabel}</span>
            </div>

            <div class="incident-actions">
                <select class="admin-estado-select" onchange="cambiarEstado(${incidencia.id_incidencia}, this.value)" onclick="event.stopPropagation()">
                    <option value="abierta" ${incidencia.estado === "abierta" ? "selected" : ""}>Abierta</option>
                    <option value="en_curso" ${incidencia.estado === "en_curso" ? "selected" : ""}>En curso</option>
                    <option value="resuelta" ${incidencia.estado === "resuelta" ? "selected" : ""}>Resuelta</option>
                </select>
                <button class="incident-actions__btn incident-actions__btn--edit" title="Ver detalle"
                    onclick="event.stopPropagation(); abrirDetalleIncidencia(${incidencia.id_incidencia})">🔍</button>
            </div>
        `;

        li.addEventListener("click", () => abrirDetalleIncidencia(incidencia.id_incidencia));

        incidenciasList.appendChild(li);
    });
}

async function cambiarEstado(idIncidencia, nuevoEstado) {
    const formData = new FormData();
    formData.append("accion", "cambiar_estado");
    formData.append("id", idIncidencia);
    formData.append("estado", nuevoEstado);

    try {
        const response = await fetch("../php/incidenciasAdmin.php", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            cargarIncidencias();
        } else {
            alert(data.error || "No se pudo actualizar la incidencia");
        }

    } catch (error) {
        console.error("Error al cambiar estado:", error);
    }
}

async function marcarEnCurso(idIncidencia) {
    const formData = new FormData();
    formData.append("accion", "cambiar_estado");
    formData.append("id", idIncidencia);
    formData.append("estado", "en_curso");

    await fetch("../php/incidenciasAdmin.php", {
        method: "POST",
        body: formData
    });
}

async function cargarMensajes(idIncidencia) {
    const res = await fetch(`../php/incidenciasAdmin.php?accion=mensajes&id_incidencia=${idIncidencia}`);
    const data = await res.json();

    const lista = document.getElementById("listaMensajes");
    lista.innerHTML = "";

    if (data.success && data.mensajes.length > 0) {
        data.mensajes.forEach(m => {
            lista.innerHTML += `
                <div class="mensaje ${m.origen === 'admin' ? 'mensaje--admin' : 'mensaje--user'}">
                    <strong>${m.origen === 'admin' ? 'Admin' : m.nombre}</strong>
                    <p>${m.mensaje}</p>
                    <small>${m.fecha_envio}</small>
                </div>
            `;
        });
    } else {
        lista.innerHTML = "<p>No hay mensajes todavía.</p>";
    }
}
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        filtroActual = button.dataset.filter;
        pintarIncidencias();
    });
});

searchInput.addEventListener("input", pintarIncidencias);

function obtenerIcono(tipo) {
    if (tipo === "fontaneria") return "🚿";
    if (tipo === "electricidad") return "💡";
    if (tipo === "internet") return "🌐";
    if (tipo === "limpieza") return "🧹";
    return "⚠️";
}

function formatearEstado(estado) {
    if (estado === "abierta") return "Abierta";
    if (estado === "en_curso") return "En curso";
    if (estado === "resuelta") return "Resuelta";
    return estado;
}

function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES");
}

function abrirDetalleIncidencia(idIncidencia) {
    const incidencia = incidencias.find(i => i.id_incidencia == idIncidencia);
    if (!incidencia) return;

    const modal = document.getElementById("modal-detalle-incidencia");
    if (!modal) return;

    const estado = incidencia.estado || "abierta";
    const estadoClase =
        estado === "abierta" ? "open" :
            estado === "en_curso" ? "progress" : "done";

    const urgencia = incidencia.urgencia === "alta" || incidencia.urgencia === "alto" ? "alta" : "baja";
    const prioridadClase = urgencia === "alta" ? "high" : "low";

    document.getElementById("detalle-icono").textContent = obtenerIcono(incidencia.tipo);

    const badgeEstado = document.getElementById("detalle-estado-badge");
    badgeEstado.className = `status-badge status-badge--${estadoClase}`;
    badgeEstado.textContent = formatearEstado(estado);

    const prioridad = document.getElementById("detalle-prioridad-dot");
    prioridad.className = `priority-dot priority-dot--${prioridadClase}`;
    prioridad.textContent = urgencia === "alta" ? "Alta" : "Baja";

    document.getElementById("detalle-tipo").textContent = incidencia.tipo || "Sin tipo";
    document.getElementById("detalle-fecha").textContent = formatearFecha(incidencia.fecha || incidencia.fecha_creacion);
    document.getElementById("detalle-titulo").textContent = incidencia.titulo || "Sin título";
    document.getElementById("detalle-desc").textContent = incidencia.descripcion || "Sin descripción";

    document.getElementById("detalle-notificar").textContent =
        incidencia.notificar_admin == 1 ? "Sí" : "No";

    const comentarioWrap = document.getElementById("detalle-comentario-wrap");
    const comentario = document.getElementById("detalle-comentario");

    if (incidencia.comentario_admin) {
        comentarioWrap.style.display = "block";
        comentario.textContent = incidencia.comentario_admin;
    } else {
        comentarioWrap.style.display = "none";
        comentario.textContent = "";
    }

    document.getElementById("detalle-fecha-inicio").textContent =
        incidencia.fecha_inicio ? formatearFecha(incidencia.fecha_inicio) : "Pendiente";

    document.getElementById("detalle-fecha-fin").textContent =
        incidencia.fecha_fin ? formatearFecha(incidencia.fecha_fin) : "Pendiente";

    document.getElementById("btnEnviarRespuesta").dataset.id =
        idIncidencia;

    document.getElementById("btnMarcarResuelta").dataset.id =
        idIncidencia;

    document.getElementById("btnVerConversacionAdmin").dataset.id =
        idIncidencia;

    modal.classList.remove("modal--hidden");
    document.body.style.overflow = "hidden";
}

document.getElementById("btnVerConversacionAdmin")?.addEventListener("click", async () => {
    const idIncidencia = document.getElementById("btnVerConversacionAdmin").dataset.id;
    const incidencia = incidencias.find(i => i.id_incidencia == idIncidencia);

    document.getElementById("chat-admin-titulo").textContent = incidencia.titulo;
    document.getElementById("chat-admin-estado").textContent = "Estado: " + formatearEstado(incidencia.estado);

    document.getElementById("btnEnviarRespuesta").dataset.id = idIncidencia;
    document.getElementById("btnMarcarResuelta").dataset.id = idIncidencia;

    await cargarMensajes(idIncidencia);

    iniciarActualizacionChatAdmin(idIncidencia);

    document.getElementById("modal-detalle-incidencia").classList.add("modal--hidden");
    document.getElementById("modal-chat-admin").classList.remove("modal--hidden");
});

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    pararActualizacionChatAdmin();
    modal.classList.add("modal--hidden");
    document.body.style.overflow = "";
}

document.addEventListener("click", (e) => {
    const btnCerrar = e.target.closest("[data-modal-close]");
    if (btnCerrar) {
        cerrarModal(btnCerrar.dataset.modalClose);
    }

    const overlay = e.target.classList.contains("modal-overlay") ? e.target : null;
    if (overlay) {
        cerrarModal(overlay.id);
    }
});

async function cargarNotificaciones() {
    const badge = document.getElementById("badge-notificaciones-admin");
    const lista = document.getElementById("lista-notificaciones");
    const vacio = document.getElementById("notify-empty");
    const modal = document.getElementById("modal-notificaciones-admin");

    if (!lista || !modal) return;

    function abrirModalNotif() {
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }

    function cerrarModalNotif() {
        modal.classList.add("hidden");
        document.body.style.overflow = "";
    }

    // Abrir con el botón campana
    const btnBell = document.getElementById("btn-abrir-notificaciones");
    if (btnBell && !btnBell._notifListenerAdded) {
        btnBell.addEventListener("click", abrirModalNotif);
        btnBell._notifListenerAdded = true;
    }

    modal.querySelectorAll("[data-modal-close]").forEach(b =>
        b.addEventListener("click", cerrarModalNotif)
    );

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            cerrarModalNotif();
        }
    });

    try {
        const resp = await fetch(`../php/incidenciasAdmin.php?accion=obtener_notificaciones_admin&id_piso=1`);
        const data = await resp.json();

        if (data.success && Array.isArray(data.notificaciones) && data.notificaciones.length > 0) {
            lista.innerHTML = "";
            data.notificaciones.forEach(n => {
                const urg = n.urgencia === 'alta' ? 'alta' : 'baja';
                const icono = { fontaneria: "🚿", electricidad: "💡", internet: "🌐", limpieza: "🧹", otros: "⚠️" }[n.tipo] || "⚠️";
                const fecha = n.fecha_creacion ? new Date(n.fecha_creacion).toLocaleDateString('es-ES') : 'Hoy';

                const li = document.createElement("li");
                li.className = "notify-item";
                li.dataset.id = n.id_incidencia;
                li.innerHTML = `
    <div class="notify-card">
        <div class="notify-icon">${icono}</div>

        <div class="notify-info">
            <h4>${n.titulo}</h4>
            <p>${n.usuario_nombre || 'Usuario'} · ${fecha} · ${n.tipo}</p>
        </div>

        <span class="notify-priority ${urg}">
            ${urg === 'alta' ? 'ALTA' : 'BAJA'}
        </span>
    </div>
`;
                lista.appendChild(li);
            });
            vacio.style.display = "none";
            // Solo actualizamos el badge — el modal se abre con el botón campana
            if (badge) {
                badge.textContent = data.notificaciones.length;
                badge.style.display = "inline-block";
            }
        } else {
            cerrarModalNotif();
            lista.innerHTML = "";

            if (vacio) vacio.style.display = "block";

            if (badge) {
                badge.textContent = "0";
                badge.style.display = "none";
            }
        }
    } catch (e) {
        console.error("Error cargando notificaciones admin:", e);
    }

    // Click en una notificación -> marcar leída
    lista.addEventListener("click", async (e) => {
        const item = e.target.closest(".notify-item");
        if (!item) return;
        const fd = new FormData();
        fd.append("accion", "marcar_notificacion_leida");
        fd.append("id_incidencia", item.dataset.id);
        await fetch("../php/incidenciasAdmin.php", { method: "POST", body: fd });
        cargarNotificaciones();
    });

    // Cerrar modal (botón X o click fuera)
    modal.querySelectorAll("[data-modal-close]").forEach(b =>
        b.addEventListener("click", cerrarModalNotif)
    );
    modal.addEventListener("click", (e) => {
        if (e.target === modal) cerrarModalNotif();
    });

    // Marcar todas como leídas
    document.getElementById("btn-marcar-todas-leidas")?.addEventListener("click", async () => {
        const fd = new FormData();
        fd.append("accion", "marcar_todas_leidas");
        fd.append("id_piso", 1);
        await fetch("../php/incidenciasAdmin.php", { method: "POST", body: fd });
        cerrarModalNotif();
        cargarNotificaciones();
    });
}

document
    .getElementById("modalDetalleIncidencia")
    ?.addEventListener("click", (e) => {

        // Si haces click fuera del contenido del modal
        if (e.target.id === "modalDetalleIncidencia") {

            document
                .getElementById("modalDetalleIncidencia")
                .classList.add("hidden");
        }
    });

document.getElementById("btnMarcarResuelta")?.addEventListener("click", async () => {
    const idIncidencia = document.getElementById("btnMarcarResuelta").dataset.id;

    console.log("ID incidencia para resolver:", idIncidencia);

    if (!idIncidencia) {
        alert("No se ha encontrado la incidencia");
        return;
    }

    const formData = new FormData();
    formData.append("accion", "resolver");
    formData.append("id_incidencia", idIncidencia);

    try {
        const response = await fetch("../php/incidenciasAdmin.php", {
            method: "POST",
            body: formData
        });

        const texto = await response.text();
        console.log("Respuesta resolver:", texto);

        const data = JSON.parse(texto);

        if (data.success) {
            const modalChat = document.getElementById("modal-chat-admin");

            if (modalChat) {
                modalChat.classList.add("modal--hidden");
            }

            pararActualizacionChatAdmin();
            document.body.style.overflow = "";

            await cargarIncidencias();
        } else {
            alert(data.error || "No se pudo marcar como resuelta");
        }

    } catch (error) {
        console.error("Error al resolver incidencia:", error);
    }
});

document.getElementById("btnEnviarRespuesta")?.addEventListener("click", async () => {
    const idIncidencia = document.getElementById("btnEnviarRespuesta").dataset.id;
    const mensaje = document.getElementById("mensajeAdmin").value.trim();

    if (!idIncidencia) {
        alert("No se ha encontrado la incidencia");
        return;
    }

    if (!mensaje) {
        return;
    }

    const formData = new FormData();
    formData.append("accion", "responder");
    formData.append("id_incidencia", idIncidencia);
    formData.append("id_usuario", 1);
    formData.append("mensaje", mensaje);

    try {
        const response = await fetch("../php/incidenciasAdmin.php", {
            method: "POST",
            body: formData
        });

        const texto = await response.text();
        console.log("Respuesta responder:", texto);

        const data = JSON.parse(texto);

        if (data.success) {
            document.getElementById("mensajeAdmin").value = "";
            await cargarMensajes(idIncidencia);
            await cargarIncidencias();
        } else {
            alert(data.error || "No se pudo enviar la respuesta");
        }

    } catch (error) {
        console.error("Error al responder:", error);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    inicializarModalNuevaIncidenciaAdmin();
});

function inicializarModalNuevaIncidenciaAdmin() {
    // Modal viejo eliminado — se usa modal-nueva-incidencia (2 pasos) igual que en user
}

let pasoActualNueva = 1;

function abrirModalNuevaIncidenciaAdmin() {
    document.getElementById("modal-nueva-incidencia").classList.remove("modal--hidden");
    irAPasoNuevaAdmin(1);
}

function cerrarModalNuevaIncidenciaAdmin() {
    document.getElementById("modal-nueva-incidencia").classList.add("modal--hidden");
}

function irAPasoNuevaAdmin(paso) {
    pasoActualNueva = paso;

    const paso1 = document.getElementById("nueva-paso-1");
    const paso2 = document.getElementById("nueva-paso-2");
    const ind1 = document.getElementById("step-indicator-1");
    const ind2 = document.getElementById("step-indicator-2");
    const btnIzq = document.getElementById("btn-nueva-izquierda");
    const btnDer = document.getElementById("btn-nueva-derecha");

    if (paso === 1) {
        paso1.classList.remove("modal--hidden");
        paso2.classList.add("modal--hidden");

        ind1.classList.add("stepper__step--active");
        ind2.classList.remove("stepper__step--active");

        btnIzq.textContent = "Cancelar";
        btnDer.textContent = "Siguiente →";
    } else {
        paso1.classList.add("modal--hidden");
        paso2.classList.remove("modal--hidden");

        ind1.classList.remove("stepper__step--active");
        ind2.classList.add("stepper__step--active");

        btnIzq.textContent = "← Volver";
        btnDer.textContent = "Crear incidencia";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".btn-abrir-nueva").forEach(btn => {
        btn.addEventListener("click", abrirModalNuevaIncidenciaAdmin);
    });

    document.querySelectorAll('[data-modal-close="modal-nueva-incidencia"]').forEach(btn => {
        btn.addEventListener("click", cerrarModalNuevaIncidenciaAdmin);
    });

    document.getElementById("btn-nueva-izquierda")?.addEventListener("click", () => {
        if (pasoActualNueva === 2) {
            irAPasoNuevaAdmin(1);
        } else {
            cerrarModalNuevaIncidenciaAdmin();
        }
    });

    document.getElementById("btn-nueva-derecha")?.addEventListener("click", () => {
        if (pasoActualNueva === 1) {
            irAPasoNuevaAdmin(2);
        } else {
            crearIncidenciaAdmin();
        }
    });

    document.querySelectorAll("#modal-nueva-incidencia .modal__urgencia-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#modal-nueva-incidencia .modal__urgencia-btn")
                .forEach(b => b.classList.remove("modal__urgencia-btn--active"));

            btn.classList.add("modal__urgencia-btn--active");
        });
    });
});

async function crearIncidenciaAdmin() {
    const tipo = document.getElementById("nueva-tipo").value;
    const titulo = document.getElementById("nueva-titulo").value.trim();
    const descripcion = document.getElementById("nueva-desc").value.trim();
    const fechaInicio = document.getElementById("nueva-fecha-inicio").value;
    const notificarInquilino = document.getElementById("nueva-notificar-inquilino")?.checked ? 1 : 0;

    const urgenciaBtn = document.querySelector(
        "#modal-nueva-incidencia .modal__urgencia-btn--active"
    );

    if (!tipo || !titulo || !descripcion) {
        alert("Rellena los campos obligatorios");
        irAPasoNuevaAdmin(1);
        return;
    }

    if (!fechaInicio) {
        alert("Selecciona una fecha de inicio");
        irAPasoNuevaAdmin(2);
        return;
    }

    const formData = new FormData();
    formData.append("accion", "crear");
    formData.append("id_piso", 1);
    formData.append("id_usuario", 1);
    formData.append("tipo", tipo);
    formData.append("titulo", titulo);
    formData.append("descripcion", descripcion);
    formData.append("urgencia", urgenciaBtn ? urgenciaBtn.dataset.urgencia : "baja");
    formData.append("fecha_inicio", fechaInicio);
    formData.append("notificar_inquilino", notificarInquilino);

    const response = await fetch("../php/incidenciasAdmin.php", {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    if (data.success) {
        cerrarModalNuevaIncidenciaAdmin();
        cargarIncidencias();
    } else {
        alert(data.error || "No se pudo crear la incidencia");
    }
}

async function abrirPanelNotificacionesUser() {
    panelNotificacionesUser.classList.remove("hidden");
    overlayNotificacionesUser.classList.remove("hidden");

    await cargarNotificacionesUser();
}

function cerrarPanelNotificaciones() {
    panelNotificacionesUser.classList.add("hidden");
    overlayNotificacionesUser.classList.add("hidden");
}

async function cargarNotificacionesUser() {

    const response = await fetch(
        "../php/incidencias.php?accion=obtener_notificaciones_usuario&id_usuario=1"
    );
    const data = await response.json();

    if (!data.success) return;

    listaNotificacionesUser.innerHTML = "";

    if (data.notificaciones.length === 0) {

        listaNotificacionesUser.innerHTML = `
            <p class="notifications-empty">
                Sin notificaciones nuevas
            </p>
        `;

        contadorNotificacionesUser.classList.add("hidden");

        return;
    }

    contadorNotificacionesUser.textContent =
        data.notificaciones.length;

    contadorNotificacionesUser.classList.remove("hidden");

    data.notificaciones.forEach(notif => {

        listaNotificacionesUser.innerHTML += `
            <div class="notification-item">
                <strong>${notif.mensaje}</strong>

                <span>
                    ${notif.fecha}
                </span>
            </div>
        `;
    });
}

let intervaloChatAdmin = null;
let idChatAdminActual = null;

function iniciarActualizacionChatAdmin(idIncidencia) {
    idChatAdminActual = idIncidencia;

    if (intervaloChatAdmin) {
        clearInterval(intervaloChatAdmin);
    }

    intervaloChatAdmin = setInterval(() => {
        cargarMensajes(idChatAdminActual);
    }, 3000);
}

function pararActualizacionChatAdmin() {
    if (intervaloChatAdmin) {
        clearInterval(intervaloChatAdmin);
        intervaloChatAdmin = null;
    }
}