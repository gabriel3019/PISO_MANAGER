const incidenciasList = document.getElementById("incidenciasList");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter");

const countAbiertas = document.getElementById("count-abiertas");
const countEnCurso = document.getElementById("count-en-curso");
const countResueltas = document.getElementById("count-resueltas");

let incidencias = [];
let filtroActual = "todas";

document.addEventListener("DOMContentLoaded", cargarIncidencias);

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
                    Reportado por ${incidencia.usuario} · ${formatearFecha(incidencia.fecha || incidencia.fecha_creacion)}
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

                <button onclick="abrirDetalleAdmin(${incidencia.id_incidencia})">
                    Ver detalle
                </button>

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

let incidenciaSeleccionada = null;

async function abrirDetalleAdmin(idIncidencia) {
    incidenciaSeleccionada = idIncidencia;

    const incidencia = incidencias.find(i => i.id_incidencia == idIncidencia);

    document.getElementById("detalleTitulo").textContent = incidencia.titulo;
    document.getElementById("detalleDescripcion").textContent = incidencia.descripcion;
    document.getElementById("detalleUsuario").textContent = incidencia.usuario;
    document.getElementById("detalleEstado").textContent = incidencia.estado;

    document.getElementById("modalDetalleIncidencia").classList.remove("hidden");

    await marcarEnCurso(idIncidencia);
    await cargarMensajes(idIncidencia);
    await cargarIncidencias();
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
                <div class="mensaje">
                    <strong>${m.nombre}</strong>
                    <p>${m.mensaje}</p>
                    <small>${m.fecha_envio}</small>
                </div>
            `;
        });
    } else {
        lista.innerHTML = "<p>No hay mensajes todavía.</p>";
    }
}

document.getElementById("btnEnviarRespuesta").addEventListener("click", async () => {
    const mensaje = document.getElementById("mensajeAdmin").value.trim();

    if (!mensaje) return;

    const formData = new FormData();
    formData.append("accion", "responder");
    formData.append("id_incidencia", incidenciaSeleccionada);
    formData.append("id_usuario", 1);
    formData.append("mensaje", mensaje);

    await fetch("../php/incidenciasAdmin.php", {
        method: "POST",
        body: formData
    });

    document.getElementById("mensajeAdmin").value = "";
    await cargarMensajes(incidenciaSeleccionada);
    await cargarIncidencias();
});

document.getElementById("btnMarcarResuelta").addEventListener("click", async () => {
    const formData = new FormData();
    formData.append("accion", "resolver");
    formData.append("id_incidencia", incidenciaSeleccionada);

    await fetch("../php/incidenciasAdmin.php", {
        method: "POST",
        body: formData
    });

    document.getElementById("modalDetalleIncidencia").classList.add("hidden");
    await cargarIncidencias();
});

document.getElementById("cerrarModalDetalle").addEventListener("click", () => {
    document.getElementById("modalDetalleIncidencia").classList.add("hidden");
});

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