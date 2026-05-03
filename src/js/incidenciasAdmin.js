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
        const response = await fetch("../php/incidenciasAdmin.php?id_piso=1");
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
    countEnCurso.textContent = incidencias.filter(i => i.estado === "en_proceso").length;
    countResueltas.textContent = incidencias.filter(i => i.estado === "resueltas").length;
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
                    <option value="abiertas" ${incidencia.estado === "abiertas" ? "selected" : ""}>Abiertas</option>
                    <option value="en_proceso" ${incidencia.estado === "en_proceso" ? "selected" : ""}>En proceso</option>
                    <option value="resueltas" ${incidencia.estado === "resueltas" ? "selected" : ""}>Resueltas</option>
                </select>
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
    if (estado === "abiertas") return "Abiertas";
    if (estado === "en_proceso") return "En proceso";
    if (estado === "resueltas") return "Resueltas";
    return estado;
}

function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES");
}