
const API_URL = "../php/homeUser.php";

/* ================= DOM ================= */
const nombreUsuario = document.getElementById("nombreUsuario");
const gastosPreview = document.getElementById("gastosPreview");

const balanceEl = document.getElementById("balance");
const totalEl = document.getElementById("totalPiso");
const pagadoEl = document.getElementById("pagado");
const debidoEl = document.getElementById("debido");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    cargarUsuario();
    cargarDashboard();
});

/* ================= USUARIO ================= */
function cargarUsuario() {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    if (usuario) nombreUsuario.textContent = usuario.nombre;
}

/* ================= FETCH ================= */
async function cargarDashboard() {

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
}

/* ================= BALANCE ================= */
function renderBalance(b) {

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

    gastosPreview.innerHTML = "";

    gastos.forEach(g => {

        const div = document.createElement("div");
        div.className = "gasto-item";

        div.innerHTML = `
            <div>
                <strong>${g.descripcion}</strong>
                <small>Pagado por ${g.pagador}</small>
            </div>
            <div>${g.monto_total} €</div>
        `;

        gastosPreview.appendChild(div);
    });
}

/* ================= TAREAS ================= */
function renderTareas(tareas) {

    const cont = document.querySelector(".tasks");
    cont.innerHTML = "";

    tareas.forEach(t => {

        const li = document.createElement("li");

        li.innerHTML = `
            <input type="checkbox" ${t.estado === 'completada' ? 'checked' : ''}>
            ${t.titulo} - <b>${t.usuario}</b>
        `;

        cont.appendChild(li);
    });
}

/* ================= AVISOS ================= */
function renderAvisos(avisos) {

    const cont = document.querySelector(".avisos");
    if (!cont) return;

    cont.innerHTML = "";

    avisos.forEach(a => {

        const div = document.createElement("div");

        div.innerHTML = `
            <strong>${a.titulo}</strong>
            <p>${a.descripcion}</p>
        `;

        cont.appendChild(div);
    });
}

