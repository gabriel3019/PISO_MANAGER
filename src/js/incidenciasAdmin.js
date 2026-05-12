const incidenciasList = document.getElementById("incidenciasList");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter");

const countAbiertas = document.getElementById("count-abiertas");
const countEnCurso = document.getElementById("count-en-curso");
const countResueltas = document.getElementById("count-resueltas");

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
}

function pintarIncidencias() {
    const textoBusqueda = searchInput.value.toLowerCase();

    const filtradas = incidencias.filter(incidencia => {
        const coincideFiltro =
            filtroActual === "todas" || incidencia.estado === filtroActual;

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
        const div = document.createElement("div");
        div.classList.add("incidencia");

        div.innerHTML = `
            <div class="icon ${incidencia.urgencia}">
                ${obtenerIcono(incidencia.tipo)}
            </div>

            <div class="info">
                <h4>${incidencia.titulo}</h4>
                <p class="meta">
                    Reportado por ${incidencia.usuario} · ${formatearFecha(incidencia.fecha_creacion)}
                </p>
                <p class="descripcion">${incidencia.descripcion}</p>
                <p class="prioridad">${incidencia.urgencia} prioridad</p>
            </div>

            <div class="actions">
                <span class="estado ${incidencia.estado}">
                    ${formatearEstado(incidencia.estado)}
                </span>

                <select onchange="cambiarEstado(${incidencia.id_incidencia}, this.value)">
                    <option value="abierta" ${incidencia.estado === "abierta" ? "selected" : ""}>Abierta</option>
                    <option value="en_curso" ${incidencia.estado === "en_curso" ? "selected" : ""}>En curso</option>
                    <option value="resuelta" ${incidencia.estado === "resuelta" ? "selected" : ""}>Resuelta</option>
                </select>

                <button onclick="abrirChat(${incidencia.id_incidencia})">
                    Ver mensajes
                </button>

                <button onclick="responderIncidencia(${incidencia.id_incidencia})">
                    Responder
                </button>

                <button onclick="resolverIncidencia(${incidencia.id_incidencia})">
                    Marcar resuelta
                </button>
            </div>
        `;

        incidenciasList.appendChild(div);
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

async function responderIncidencia(idIncidencia) {
    const mensaje = prompt("Escribe la respuesta para el usuario:");

    if (!mensaje || mensaje.trim() === "") {
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

        const data = await response.json();

        if (data.success) {
            alert("Respuesta enviada correctamente");
            cargarIncidencias();
        } else {
            alert(data.error || "No se pudo enviar la respuesta");
        }

    } catch (error) {
        console.error("Error al responder incidencia:", error);
    }
}

async function resolverIncidencia(idIncidencia) {
    const confirmar = confirm("¿Seguro que quieres marcar esta incidencia como resuelta?");

    if (!confirmar) {
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

        const data = await response.json();

        if (data.success) {
            alert("Incidencia marcada como resuelta");
            cargarIncidencias();
        } else {
            alert(data.error || "No se pudo resolver la incidencia");
        }

    } catch (error) {
        console.error("Error al resolver incidencia:", error);
    }
}

async function abrirChat(idIncidencia) {
    try {
        const response = await fetch(`../php/incidenciasAdmin.php?accion=mensajes&id_incidencia=${idIncidencia}`);
        const data = await response.json();

        if (data.success) {
            let texto = "Mensajes de la incidencia:\n\n";

            if (data.mensajes.length === 0) {
                texto += "Todavía no hay mensajes.";
            } else {
                data.mensajes.forEach(m => {
                    texto += `${m.nombre}: ${m.mensaje}\n`;
                });
            }

            alert(texto);
        } else {
            alert(data.error || "No se pudieron cargar los mensajes");
        }

    } catch (error) {
        console.error("Error al cargar mensajes:", error);
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

/* ═══════════════════════════════════════════════════════
   🔔 NOTIFICACIONES ADMIN - AUTO-EJECUTABLE
   ═══════════════════════════════════════════════════════ */
async function cargarNotificaciones() {
    const badge = document.getElementById("badge-notificaciones-admin");
    const lista = document.getElementById("lista-notificaciones");
    const vacio = document.getElementById("notify-empty");
    const modal = document.getElementById("modal-notificaciones-admin");
    
    if (!lista || !modal) return;

    function abrirModalNotif() {
        modal.classList.remove("modal--hidden");
        document.body.style.overflow = "hidden";
    }
    
    function cerrarModalNotif() {
        modal.classList.add("modal--hidden");
        document.body.style.overflow = "";
    }

    try {
        const resp = await fetch(`../php/incidenciasAdmin.php?accion=obtener_notificaciones_admin&id_piso=1`);
        const data = await resp.json();

        if (data.success && Array.isArray(data.notificaciones) && data.notificaciones.length > 0) {
            lista.innerHTML = "";
            data.notificaciones.forEach(n => {
                const urg = n.urgencia === 'alta' ? 'alta' : 'baja';
                const icono = {fontaneria:"🚿",electricidad:"💡",internet:"🌐",limpieza:"🧹",otros:"⚠️"}[n.tipo]||"⚠️";
                const fecha = n.fecha_creacion ? new Date(n.fecha_creacion).toLocaleDateString('es-ES') : 'Hoy';
                
                const li = document.createElement("li");
                li.className = "notify-item";
                li.dataset.id = n.id_incidencia;
                li.innerHTML = `
                    <div class="notify-item__icon">${icono}</div>
                    <div class="notify-item__body">
                        <p class="notify-item__title">${n.titulo}</p>
                        <p class="notify-item__meta">${n.usuario_nombre||'Usuario'} · ${fecha} · ${n.tipo}</p>
                    </div>
                    <span class="notify-item__urgencia notify-item__urgencia--${urg}">${urg==='alta'?'Alta':'Baja'}</span>
                `;
                lista.appendChild(li);
            });
            vacio.style.display = "none";
            abrirModalNotif();
            if (badge) { 
                badge.textContent = data.notificaciones.length; 
                badge.style.display = "inline-block"; 
            }
        } else {
            vacio.style.display = "block";
            lista.innerHTML = "";
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