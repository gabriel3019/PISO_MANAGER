const API_GASTOS = "../php/gastosComunes.php";
const API_USUARIOS = "../php/usuariosPiso.php";
const API_BALANCE = "../php/homeUser.php";
const API_PAGOS = "../php/pagos.php";

/* ================= ESTADO ================= */
let gastos = [];
let usuarios = [];
let gastoAEliminar = null;

/* ================= DOM ================= */
let modal, deleteModal, pagoModal;
let tituloInput, importeInput, selectPagador;
let lista, divisionContainer, usuariosCheckbox;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {

  initDOM();

  cargarUsuario();
  cargarUsuarios();
  cargarGastos();
  cargarBalance();
  cargarResumen(); 

  initEventos();
});

/* ================= INIT DOM ================= */
function initDOM() {

  modal = document.getElementById("gastoModal");
  deleteModal = document.getElementById("deleteModal");
  pagoModal = document.getElementById("pagoModal");

  tituloInput = document.getElementById("gastoTitulo");
  importeInput = document.getElementById("gastoImporte");
  selectPagador = document.getElementById("gastoPagador");

  lista = document.getElementById("gastosContainer");
  divisionContainer = document.getElementById("divisionContainer");
  usuariosCheckbox = document.getElementById("usuariosCheckbox");
}

/* ================= EVENTOS ================= */
function initEventos() {

  document.querySelector(".add-btn").onclick = abrirModal;
  document.getElementById("closeGastoModal").onclick = cerrarModal;
  document.getElementById("cancelGasto").onclick = cerrarModal;

  document.getElementById("guardarGasto").onclick = guardarGasto;

  document.getElementById("confirmDelete").onclick = eliminarGasto;
  document.getElementById("cancelDelete").onclick = () => deleteModal.classList.add("hidden");

  document.getElementById("btnIgual").onclick = dividirIgual;
  document.getElementById("btnManual").onclick = dividirManual;

  document.getElementById("btnPagar").onclick = abrirPago;
  document.getElementById("closePagoModal").onclick = cerrarPago;
  document.getElementById("cancelPago").onclick = cerrarPago;
  document.getElementById("confirmPago").onclick = guardarPago;

  selectPagador.addEventListener("change", actualizarCheckboxes);
}

/* ================= USUARIO ================= */
function cargarUsuario() {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  document.getElementById("nombreUsuario").textContent = usuario?.nombre || "";
}

/* ================= BALANCE ================= */
async function cargarBalance() {

  const res = await fetch(API_BALANCE, {
    method: "POST",
    credentials: "same-origin"
  });

  const json = await res.json();
  if (!json.success) return;

  const b = json.data.balance;

  document.getElementById("totalPiso").textContent = b.total.toFixed(2) + " €";
  document.getElementById("pagado").textContent = b.pagado.toFixed(2) + " €";
  document.getElementById("debido").textContent = b.debido.toFixed(2) + " €";

  const balanceEl = document.getElementById("balance");

  balanceEl.textContent =
    (b.neto >= 0 ? "+" : "") + b.neto.toFixed(2) + " €";

  balanceEl.className =
    "amount " + (b.neto >= 0 ? "positive" : "negative");
}

/* ================= USUARIOS ================= */
async function cargarUsuarios() {

  const res = await fetch(API_USUARIOS, {
    method: "POST",
    credentials: "same-origin"
  });

  const data = await res.json();
  if (!data.success) return;

  usuarios = data.usuarios;

  selectPagador.innerHTML = "";
  const selectPago = document.getElementById("pagoReceptor");
  selectPago.innerHTML = "";

  usuarios.forEach(u => {

    const option = document.createElement("option");
    option.value = u.id_usuario;
    option.textContent = u.nombre;
    selectPagador.appendChild(option);

    const opt = document.createElement("option");
    opt.value = u.id_usuario;
    opt.textContent = u.nombre;
    selectPago.appendChild(opt);
  });

  renderCheckboxes();
}

/* ================= CHECKBOXES ================= */
function renderCheckboxes() {

  usuariosCheckbox.innerHTML = "";

  usuarios.forEach(u => {

    const div = document.createElement("div");

    div.innerHTML = `
      <label style="display:flex; gap:8px;">
        <input type="checkbox" value="${u.id_usuario}" checked>
        ${u.nombre}
      </label>
    `;

    usuariosCheckbox.appendChild(div);
  });
}

/* 🔥 EXCLUIR PAGADOR */
function actualizarCheckboxes() {

  const pagador = selectPagador.value;

  usuariosCheckbox.querySelectorAll("input").forEach(cb => {

    if (cb.value == pagador) {
      cb.checked = false;
      cb.disabled = true;
    } else {
      cb.disabled = false;
    }

  });
}

/* ================= GASTOS ================= */
async function cargarGastos() {

  const fd = new FormData();
  fd.append("accion", "listar");

  const res = await fetch(API_GASTOS, {
    method: "POST",
    body: fd,
    credentials: "same-origin"
  });

  const data = await res.json();
  if (!data.success) return;

  gastos = data.gastos;
  renderLista();
}

function renderLista() {

  lista.innerHTML = "";

  if (!gastos.length) {
    lista.innerHTML = "<p>No hay gastos aún</p>";
    return;
  }

  gastos.forEach(gasto => {

    const div = document.createElement("div");
    div.className = "expense-item";

    div.innerHTML = `
      <div class="left">
        <div class="icon-box">💸</div>
        <div>
          <div class="title">${gasto.titulo}</div>
          <small>Pagado por ${gasto.pagador}</small>
        </div>
      </div>

      <div class="right">
        <div class="amount">${parseFloat(gasto.importe).toFixed(2)} €</div>
        <span class="delete-btn">🗑️</span>
      </div>
    `;

    div.querySelector(".delete-btn").onclick = () => abrirDelete(gasto);

    lista.appendChild(div);
  });
}

/* ================= MODAL ================= */
function abrirModal() {
  limpiarFormulario();
  renderCheckboxes();
  actualizarCheckboxes();
  modal.classList.remove("hidden");
}

function cerrarModal() {
  modal.classList.add("hidden");
}

function limpiarFormulario() {
  tituloInput.value = "";
  importeInput.value = "";
  divisionContainer.innerHTML = "";
}

/* ================= DIVISION ================= */
function getSeleccionados() {
  return [...usuariosCheckbox.querySelectorAll("input:checked")];
}

function dividirIgual() {

  const total = parseFloat(importeInput.value);
  const seleccionados = getSeleccionados();

  if (!total || seleccionados.length === 0) return;

  const parte = (total / seleccionados.length).toFixed(2);

  divisionContainer.innerHTML = "";

  seleccionados.forEach(cb => {

    const user = usuarios.find(u => u.id_usuario == cb.value);

    divisionContainer.innerHTML += `
      <div class="division-item">
        <span>${user.nombre}</span>
        <input type="number" value="${parte}" disabled>
      </div>
    `;
  });
}

function dividirManual() {

  const seleccionados = getSeleccionados();

  divisionContainer.innerHTML = "";

  seleccionados.forEach(cb => {

    const user = usuarios.find(u => u.id_usuario == cb.value);

    divisionContainer.innerHTML += `
      <div class="division-item">
        <span>${user.nombre}</span>
        <input type="number" placeholder="0.00">
      </div>
    `;
  });
}

/* ================= GUARDAR ================= */
async function guardarGasto() {

  const titulo = tituloInput.value.trim();
  const importe = parseFloat(importeInput.value);
  const pagador = selectPagador.value;

  const participantes = getSeleccionados().map(cb => cb.value);

  if (!titulo || isNaN(importe) || participantes.length === 0) return;

  const fd = new FormData();
  fd.append("accion", "crear");
  fd.append("titulo", titulo);
  fd.append("importe", importe);
  fd.append("pagador", pagador);
  fd.append("participantes", JSON.stringify(participantes));

  await fetch(API_GASTOS, {
    method: "POST",
    body: fd,
    credentials: "same-origin"
  });

  cerrarModal();
  cargarGastos();
  cargarBalance();
  cargarResumen(); // 🔥
}

/* ================= ELIMINAR ================= */
function abrirDelete(gasto) {
  gastoAEliminar = gasto;
  deleteModal.classList.remove("hidden");
}

async function eliminarGasto() {

  const fd = new FormData();
  fd.append("accion", "eliminar");
  fd.append("id_gasto", gastoAEliminar.id_gasto);

  await fetch(API_GASTOS, {
    method: "POST",
    body: fd,
    credentials: "same-origin"
  });

  deleteModal.classList.add("hidden");

  cargarGastos();
  cargarBalance();
  cargarResumen(); // 🔥
}

/* ================= PAGOS ================= */
function abrirPago() {
  pagoModal.classList.remove("hidden");
}

function cerrarPago() {
  pagoModal.classList.add("hidden");
}

async function guardarPago() {

  const receptor = document.getElementById("pagoReceptor").value;
  const importe = document.getElementById("pagoImporte").value;

  if (!importe) return;

  const fd = new FormData();
  fd.append("accion", "crear");
  fd.append("receptor", receptor);
  fd.append("importe", importe);

  await fetch(API_PAGOS, {
    method: "POST",
    body: fd,
    credentials: "same-origin"
  });

  cerrarPago();

  cargarBalance();
  cargarResumen(); // 🔥
}

/* ================= RESUMEN ================= */
async function cargarResumen() {

  const fd = new FormData();
  fd.append("accion", "resumen");

  const res = await fetch(API_GASTOS, {
    method: "POST",
    body: fd,
    credentials: "same-origin"
  });

  const data = await res.json();
  if (!data.success) return;

  const contenedor = document.getElementById("resumenDeudas");
  contenedor.innerHTML = "";

  data.debes.forEach(d => {
    contenedor.innerHTML += `
      <div class="deuda">
        Debes ${d.importe.toFixed(2)} € a ${d.nombre}
      </div>
    `;
  });

  data.recibes.forEach(r => {
    contenedor.innerHTML += `
      <div class="recibe">
        ${r.nombre} te debe ${r.importe.toFixed(2)} €
      </div>
    `;
  });

  if (!data.debes.length && !data.recibes.length) {
    contenedor.innerHTML = "<p>Todo está saldado ✅</p>";
  }
}