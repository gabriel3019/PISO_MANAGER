const API_URL = "../php/homeUser.php";

/* ================= DOM ================= */
const nombreUsuario = document.getElementById("nombreUsuario");

const gastosPreview = document.getElementById("gastosPreview");
const listaTareas = document.getElementById("listaTareas");
const avisosPreview = document.getElementById("avisosPreview");
const repartoPreview = document.getElementById("repartoPreview");

const balanceEl = document.getElementById("balance");
const totalEl = document.getElementById("totalPiso");
const pagadoEl = document.getElementById("pagado");
const debidoEl = document.getElementById("debido");

const barraProgreso = document.getElementById("barraProgreso");
const contadorTareas = document.getElementById("contadorTareas");

/* ===== MODAL ===== */
const modal = document.getElementById("modalConfirm");
const confirmarBtn = document.getElementById("confirmarBtn");
const cancelarBtn = document.getElementById("cancelarBtn");
const modalText = document.getElementById("modalText");

let tareaSeleccionada = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    cargarUsuario();
    cargarDashboard();
});

/* ================= USUARIO ================= */
function cargarUsuario() {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    if (usuario && nombreUsuario) {
        nombreUsuario.textContent = usuario.nombre;
    }
}

/* ================= FETCH ================= */
async function cargarDashboard() {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            credentials: "same-origin"
        });

        const json = await res.json();
        if (!json.success) return;

        const d = json.data;

        renderBalance(d.balance);
        renderGastos(d.gastos);
        renderTareas(d.tareas);
        renderAvisos(d.avisos);
        renderReparto(d.reparto);

    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
}

/* ================= BALANCE ================= */
function renderBalance(b) {
    if (!b) return;

    totalEl.textContent = b.total.toFixed(2) + " €";
    pagadoEl.textContent = b.pagado.toFixed(2) + " €";
    debidoEl.textContent = b.debido.toFixed(2) + " €";

    balanceEl.textContent =
        (b.neto >= 0 ? "+" : "") + b.neto.toFixed(2) + " €";

    balanceEl.className =
        "amount " + (b.neto >= 0 ? "positive" : "negative");
}

/* ================= GASTOS ================= */
function renderGastos(gastos) {
    if (!gastosPreview) return;

    gastosPreview.innerHTML = "";

    gastos.forEach(g => {
        const div = document.createElement("div");
        div.className = "gasto-item";

        div.innerHTML = `
            <div>
                <strong>${g.descripcion}</strong>
                <p class="sub">Pagado por ${g.pagador}</p>
            </div>
            <div>${parseFloat(g.monto_total).toFixed(2)} €</div>
        `;

        gastosPreview.appendChild(div);
    });
}

/* ================= TAREAS ================= */
function renderTareas(tareas) {
    if (!listaTareas) return;

    listaTareas.innerHTML = "";

    let completadas = 0;

    tareas.forEach(t => {

        const completada = t.estado.trim().toLowerCase() === "completada";
        if (completada) completadas++;

        const li = document.createElement("li");
        li.className = completada ? "tarea completada" : "tarea";

        li.innerHTML = `
            <input type="checkbox" ${completada ? 'checked' : ''}>
            <span class="texto">
                ${t.titulo} - <b>${t.usuario}</b>
            </span>
        `;

        const checkbox = li.querySelector("input");

        checkbox.addEventListener("change", (e) => {
            e.preventDefault();

            tareaSeleccionada = t;

            // texto dinámico del modal
            if (modalText) {
                modalText.textContent = completada
                    ? "¿Marcar tarea como pendiente?"
                    : "¿Marcar tarea como completada?";
            }

            modal.classList.remove("hidden");
        });

        listaTareas.appendChild(li);
    });

    /* PROGRESO */
    if (barraProgreso && tareas.length > 0) {
        const porcentaje = (completadas / tareas.length) * 100;
        barraProgreso.style.width = porcentaje + "%";
    }

    /* CONTADOR */
    if (contadorTareas) {
        contadorTareas.textContent =
            `${completadas} / ${tareas.length} completadas`;
    }
}

/* ================= MODAL ================= */

// cancelar
cancelarBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    tareaSeleccionada = null;
});

// confirmar
confirmarBtn.addEventListener("click", async () => {

    if (!tareaSeleccionada) return;

    try {
        const nuevoEstado =
            tareaSeleccionada.estado.trim().toLowerCase() === "completada"
                ? "pendiente"
                : "completada";

        await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "actualizarTarea",
                id_tarea: tareaSeleccionada.id_tarea,
                estado: nuevoEstado
            })
        });

        modal.classList.add("hidden");
        tareaSeleccionada = null;

        cargarDashboard();

    } catch (err) {
        console.error("Error actualizando tarea:", err);
    }
});

/* ================= AVISOS ================= */
function renderAvisos(avisos) {
    if (!avisosPreview) return;

    avisosPreview.innerHTML = "";

    avisos.forEach(a => {
        const div = document.createElement("div");

        let tipo = "info";
        const titulo = a.titulo.toLowerCase();

        if (titulo.includes("fuga") || titulo.includes("urgente")) {
            tipo = "warning";
        }
        if (titulo.includes("error")) {
            tipo = "error";
        }

        div.className = "aviso " + tipo;

        div.innerHTML = `
            <span class="dot"></span>
            <div>
                <p><strong>${a.titulo}</strong></p>
                <span class="sub">${a.descripcion}</span>
            </div>
        `;

        avisosPreview.appendChild(div);
    });
}

/* ================= REPARTO ================= */
function renderReparto(reparto) {
    if (!repartoPreview) return;

    repartoPreview.innerHTML = "";

    reparto.forEach(r => {
        const p = document.createElement("p");

        const cantidad = parseFloat(r.debe);

        p.innerHTML = `
            ${r.nombre}
            <span class="${cantidad >= 0 ? 'red' : 'green'}">
                ${cantidad.toFixed(2)} €
            </span>
        `;

        repartoPreview.appendChild(p);
    });
}