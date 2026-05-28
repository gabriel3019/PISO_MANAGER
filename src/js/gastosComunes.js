const API_GASTOS = "../php/gastosComunes.php";
const API_USUARIOS = "../php/usuariosPiso.php";
const API_BALANCE = "../php/homeUser.php";
const API_PAGOS = "../php/pagos.php";

/* ================================================= */
/* ================= ESTADO ======================== */
/* ================================================= */

let gastoEditando = null;

let gastos = [];
let usuarios = [];

let gastoAEliminar = null;
let gastoDetalleActual = null;

let filtroActivo = "todos";
let paginaActual = 1;

const usuarioActual =
  JSON.parse(
    sessionStorage.getItem("usuario")
  );

/* ================================================= */
/* ================= DOM =========================== */
/* ================================================= */

let modal;
let deleteModal;
let pagoModal;
let detalleModal;
let confirmarPagoModal;

let tituloInput;
let importeInput;
let selectPagador;

let lista;
let divisionContainer;
let usuariosCheckbox;

let textoConfirmarPago;

/* ================================================= */
/* ================= INIT ========================== */
/* ================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    initDOM();

    initEventos();

    cargarUsuario();

    await cargarUsuarios();

    await refreshData();

  }
);

/* ================================================= */
/* ================= DOM =========================== */
/* ================================================= */

function initDOM() {

  modal =
    document.getElementById(
      "gastoModal"
    );

  deleteModal =
    document.getElementById(
      "deleteModal"
    );

  pagoModal =
    document.getElementById(
      "pagoModal"
    );

  detalleModal =
    document.getElementById(
      "detalleModal"
    );

  confirmarPagoModal =
    document.getElementById(
      "confirmarPagoModal"
    );

  tituloInput =
    document.getElementById(
      "gastoTitulo"
    );

  importeInput =
    document.getElementById(
      "gastoImporte"
    );

  selectPagador =
    document.getElementById(
      "gastoPagador"
    );

  lista =
    document.getElementById(
      "gastosContainer"
    );

  divisionContainer =
    document.getElementById(
      "divisionContainer"
    );

  usuariosCheckbox =
    document.getElementById(
      "usuariosCheckbox"
    );

  textoConfirmarPago =
    document.getElementById(
      "textoConfirmarPago"
    );

}

/* ================================================= */
/* ================= EVENTOS ======================= */
/* ================================================= */

function initEventos() {

  document
    .getElementById("btnContinuar")
    .onclick = continuarPaso2;

  document
    .getElementById("btnVolver")
    .onclick = volverPaso1;

  document
    .getElementById("btnIgual")
    .onclick = dividirIgual;

  document
    .getElementById("btnManual")
    .onclick = dividirManual;

  document
    .querySelector(".add-btn")
    .onclick = abrirModal;

  document
    .getElementById("closeGastoModal")
    .onclick = cerrarModal;

  document
    .getElementById("cancelGasto")
    .onclick = cerrarModal;

  document
    .getElementById("guardarGasto")
    .onclick = guardarGasto;

  document
    .getElementById("confirmDelete")
    .onclick = eliminarGasto;

  document
    .getElementById("cancelDelete")
    .onclick = () => {

      deleteModal
        .classList
        .add("hidden");

    };

  document
    .getElementById("btnPagar")
    .onclick = abrirPago;

  document
    .getElementById("closePagoModal")
    .onclick = cerrarPago;

  document
    .getElementById("cancelPago")
    .onclick = cerrarPago;

  document
    .getElementById("confirmPago")
    .onclick = guardarPago;

  document
    .getElementById("closeDetalleModal")
    .onclick = cerrarDetalle;

  document
    .getElementById("closeConfirmarPago")
    .onclick = cerrarConfirmacionPago;

  document
    .getElementById("cancelarConfirmarPago")
    .onclick = cerrarConfirmacionPago;

  document
    .getElementById("aceptarConfirmarPago")
    .onclick = confirmarSaldarDeuda;

  document
    .getElementById("btnSaldar")
    .onclick = abrirConfirmacionPago;

  document
    .getElementById("filterTodos")
    .onclick = () =>
      cambiarFiltro("todos");

  document
    .getElementById("filterPendientes")
    .onclick = () =>
      cambiarFiltro("pendientes");

  document
    .getElementById("filterLiquidados")
    .onclick = () =>
      cambiarFiltro("liquidados");

  document
    .getElementById("filterMes")
    .onclick = () =>
      cambiarFiltro("mes");

  document
    .getElementById("searchInput")
    .addEventListener(
      "input",
      renderLista
    );

}

/* ================================================= */
/* ================= REFRESH ======================= */
/* ================================================= */

async function refreshData() {

  await cargarUsuarios();

  await cargarGastos();

  await cargarBalance();

  await cargarResumen();

}

/* ================================================= */
/* ================= USUARIO ======================= */
/* ================================================= */

function cargarUsuario() {

  document.getElementById(
    "nombreUsuario"
  ).textContent =
    usuarioActual?.nombre || "";

}

/* ================================================= */
/* ================= USUARIOS ====================== */
/* ================================================= */

async function cargarUsuarios() {

  const res =
    await fetch(API_USUARIOS, {
      method: "POST",
      credentials: "same-origin"
    });

  const data =
    await res.json();

  if (!data.success) {

    return;

  }

  usuarios =
    data.usuarios;

  selectPagador.innerHTML = "";

  usuariosCheckbox.innerHTML = "";

  const selectPago =
    document.getElementById(
      "pagoReceptor"
    );

  selectPago.innerHTML = "";

  usuarios.forEach(u => {

    const esActual =

      Number(u.id_usuario)
      ===
      Number(usuarioActual.id);

    /* ================= PAGADOR ================= */

    if (esActual) {

      selectPagador.innerHTML += `

        <option
          value="${u.id_usuario}"
          selected
        >
          ${u.nombre}
        </option>

      `;

    }

    /* ================= CHECKBOX ================= */

    usuariosCheckbox.innerHTML += `

      <label class="checkbox-user">

        <input
          type="checkbox"
          value="${u.id_usuario}"
          checked
          ${esActual ? "disabled" : ""}
        >

        ${u.nombre}

      </label>

    `;

    /* ================= PAGOS ================= */

    if (!esActual) {

      selectPago.innerHTML += `

        <option value="${u.id_usuario}">
          ${u.nombre}
        </option>

      `;

    }

  });

  selectPagador.disabled = true;

}

/* ================================================= */
/* ================= BALANCE ======================= */
/* ================================================= */

async function cargarBalance() {

  const res =
    await fetch(API_BALANCE, {
      method: "POST",
      credentials: "same-origin"
    });

  const json =
    await res.json();

  if (!json.success) {

    return;

  }

  const b =
    json.data.balance;

  document.getElementById(
    "totalPiso"
  ).textContent =
    b.total.toFixed(2) + " €";

  document.getElementById(
    "pagado"
  ).textContent =
    b.pagado.toFixed(2) + " €";

  document.getElementById(
    "debido"
  ).textContent =
    b.debido.toFixed(2) + " €";

  const balanceEl =
    document.getElementById(
      "balance"
    );

  balanceEl.textContent =

    `${b.neto >= 0 ? "+" : ""}${b.neto.toFixed(2)} €`;

  balanceEl.className =
    `amount ${b.neto >= 0
      ? "positive"
      : "negative"
    }`;

}

/* ================================================= */
/* ================= GASTOS ======================== */
/* ================================================= */

async function cargarGastos() {

  const fd =
    new FormData();

  fd.append(
    "accion",
    "listar"
  );

  const res =
    await fetch(API_GASTOS, {
      method: "POST",
      body: fd,
      credentials: "same-origin"
    });

  const data =
    await res.json();

  if (!data.success) {

    return;

  }

  gastos =
    data.gastos;

  renderLista();

}

/* ================================================= */
/* ================= FILTROS ======================= */
/* ================================================= */

function cambiarFiltro(filtro) {

  filtroActivo = filtro;

  document
    .querySelectorAll(
      ".filters button"
    )
    .forEach(btn => {

      btn.classList.remove("active");

    });

  const mapa = {

    todos: "filterTodos",
    pendientes: "filterPendientes",
    liquidados: "filterLiquidados",
    mes: "filterMes"

  };

  document
    .getElementById(mapa[filtro])
    .classList
    .add("active");

  renderLista();

}

/* ================================================= */
/* ================= RENDER ======================== */
/* ================================================= */

function renderLista() {

  lista.innerHTML = "";

  let listaFinal =
    [...gastos];

  /* ================= PENDIENTES ================= */

  if (filtroActivo === "pendientes") {

    listaFinal =
      listaFinal.filter(g =>

        g.participantes.some(
          p => Number(p.pagado) === 0
        )

      );

  }

  /* ================= LIQUIDADOS ================= */

  if (filtroActivo === "liquidados") {

    listaFinal =
      listaFinal.filter(g =>

        g.participantes.every(
          p => Number(p.pagado) === 1
        )

      );

  }

  /* ================= ESTE MES ================= */

  if (filtroActivo === "mes") {

    const ahora = new Date();

    listaFinal =
      listaFinal.filter(g => {

        const fecha =
          new Date(g.fecha);

        return (

          fecha.getMonth() === ahora.getMonth() &&
          fecha.getFullYear() === ahora.getFullYear()

        );

      });

  }

  /* ================= BUSCADOR ================= */

  const texto =
    document
      .getElementById("searchInput")
      .value
      .toLowerCase()
      .trim();

  if (texto) {

    listaFinal =
      listaFinal.filter(g =>

        g.titulo
          .toLowerCase()
          .includes(texto)

      );

  }

  /* ================= VACIO ================= */

  if (!listaFinal.length) {

    lista.innerHTML = `

      <div class="empty-debts">
        No hay gastos
      </div>

    `;

    return;

  }

  /* ================= PAGINACION ================= */

  const GASTOS_POR_PAGINA = 4;

  const inicio =

    (paginaActual - 1)
    *
    GASTOS_POR_PAGINA;

  const fin =

    inicio +
    GASTOS_POR_PAGINA;

  const gastosPagina =

    listaFinal.slice(inicio, fin);

  /* ================= RENDER ================= */

  gastosPagina.forEach(gasto => {

    lista.appendChild(
      crearCardGasto(gasto)
    );

  });

  /* ================= PAGINACION UI ================= */

  renderPaginacion(
    listaFinal.length,
    GASTOS_POR_PAGINA
  );

}

function renderPaginacion(
  totalGastos,
  porPagina
) {

  const totalPaginas =

    Math.ceil(
      totalGastos / porPagina
    );

  const vieja =
    document.querySelector(
      ".pagination"
    );

  if (vieja) {

    vieja.remove();

  }

  if (totalPaginas <= 1) {

    return;

  }

  const div =
    document.createElement("div");

  div.className =
    "pagination";

  for (
    let i = 1;
    i <= totalPaginas;
    i++
  ) {

    div.innerHTML += `

      <button
        class="
          page-btn
          ${i === paginaActual ? "active" : ""}
        "
        data-page="${i}"
      >

        ${i}

      </button>

    `;

  }

  lista.after(div);

  div
    .querySelectorAll(".page-btn")
    .forEach(btn => {

      btn.onclick = () => {

        paginaActual =

          Number(
            btn.dataset.page
          );

        renderLista();

      };

    });

}


/* ================================================= */
/* ================= CARD GASTO ==================== */
/* ================================================= */
function crearCardGasto(gasto) {

  const div =
    document.createElement("div");

  div.className =
    "expense-item";

  /* ================= PENDIENTE ================= */

  const pendiente =

    gasto.participantes.some(
      p => Number(p.pagado) === 0
    );

  /* ================= ES MIO ================= */

  const esMio =

    Number(gasto.id_pagador)
    ===
    Number(usuarioActual.id);

  div.innerHTML = `

    <div class="expense-main">

      <div class="left">

        <div class="icon-box">
          💸
        </div>

        <div>

          <div class="title">
            ${gasto.titulo}
          </div>

          <div class="meta">
            Pagado por ${gasto.pagador}
          </div>

          <div class="expense-date">

            ${new Date(gasto.fecha)
              .toLocaleDateString("es-ES")}

          </div>

          <div class="
            expense-status
            ${pendiente ? "pending" : "paid"}
          ">

            ${pendiente
              ? "Pendiente"
              : "Liquidado"}

          </div>

        </div>

      </div>

      <div class="right">

        <div class="amount">
          ${parseFloat(gasto.importe)
            .toFixed(2)} €
        </div>

        <div class="expense-actions">

          <button class="btn-light detail-btn">
            Ver detalles
          </button>

          ${esMio ? `

            <span class="edit-btn">
              ✏️
            </span>

            <span class="delete-btn">
              🗑️
            </span>

          ` : ""}

        </div>

      </div>

    </div>

  `;

  /* ================= DETALLE ================= */

  div
    .querySelector(".detail-btn")
    .onclick = () =>
      abrirDetalle(gasto);

  /* ================= EDITAR ================= */

  const editBtn =
    div.querySelector(".edit-btn");

  if (editBtn) {

    editBtn.onclick = () =>
      editarGasto(gasto);

  }

  /* ================= ELIMINAR ================= */

  const deleteBtn =
    div.querySelector(".delete-btn");

  if (deleteBtn) {

    deleteBtn.onclick = () =>
      abrirDelete(gasto);

  }

  return div;

}
/* ================================================= */
/* ================= MODAL GASTO =================== */
/* ================================================= */

function abrirModal() {

  document
    .getElementById("step1")
    .classList
    .remove("hidden");

  document
    .getElementById("step2")
    .classList
    .add("hidden");

  tituloInput.value = "";

  importeInput.value = "";

  divisionContainer.innerHTML = "";

  modal.classList.remove("hidden");

}

function editarGasto(gasto) {

  gastoEditando = gasto;

  modal.classList.remove("hidden");

  document
    .getElementById("step1")
    .classList
    .remove("hidden");

  document
    .getElementById("step2")
    .classList
    .add("hidden");

  tituloInput.value =
    gasto.titulo;

  importeInput.value =
    gasto.importe;

  usuariosCheckbox
    .querySelectorAll("input")
    .forEach(cb => {

      cb.checked = false;

    });

  gasto.participantes.forEach(p => {

    const checkbox =
      usuariosCheckbox.querySelector(
        `input[value="${p.id_usuario}"]`
      );

    if (checkbox) {

      checkbox.checked = true;

    }

  });

}

function cerrarModal() {

  modal.classList.add("hidden");

}

/* ================================================= */
/* ================= PASOS ========================= */
/* ================================================= */

function continuarPaso2() {

  const titulo =
    tituloInput.value.trim();

  const importe =
    parseFloat(
      importeInput.value
    );

  const participantes =
    getSeleccionados();

  if (
    !titulo ||
    isNaN(importe) ||
    participantes.length === 0
  ) {

    mostrarToast(
      "Completa todos los campos",
      "error"
    );

    return;

  }

  document
    .getElementById("step1")
    .classList
    .add("hidden");

  document
    .getElementById("step2")
    .classList
    .remove("hidden");

  dividirIgual();

}

function volverPaso1() {

  document
    .getElementById("step2")
    .classList
    .add("hidden");

  document
    .getElementById("step1")
    .classList
    .remove("hidden");

}

/* ================================================= */
/* ================= HELPERS ======================= */
/* ================================================= */

function getSeleccionados() {

  return [

    ...usuariosCheckbox.querySelectorAll(
      "input:checked"
    )

  ].map(cb => cb.value);

}

/* ================================================= */
/* ================= DIVISION ====================== */
/* ================================================= */

function dividirIgual() {

  const total =
    parseFloat(
      importeInput.value
    );

  const seleccionados =
    getSeleccionados();

  if (
    !total ||
    seleccionados.length === 0
  ) {
    return;
  }

  const parte =
    (
      total /
      seleccionados.length
    ).toFixed(2);

  divisionContainer.innerHTML = "";

  seleccionados.forEach(idUsuario => {

    const user =
      usuarios.find(
        u =>
          Number(u.id_usuario)
          ===
          Number(idUsuario)
      );

    divisionContainer.innerHTML += `

      <div class="division-item">

        <span>
          ${user.nombre}
        </span>

        <input
          type="number"
          value="${parte}"
          disabled
        >

      </div>

    `;

  });

}

function dividirManual() {

  const seleccionados =
    getSeleccionados();

  divisionContainer.innerHTML = "";

  seleccionados.forEach(idUsuario => {

    const user =
      usuarios.find(
        u =>
          Number(u.id_usuario)
          ===
          Number(idUsuario)
      );

    divisionContainer.innerHTML += `

      <div class="division-item">

        <span>
          ${user.nombre}
        </span>

        <input
          type="number"
          placeholder="0.00"
        >

      </div>

    `;

  });

}

/* ================================================= */
/* ================= GUARDAR ======================= */
/* ================================================= */

async function guardarGasto() {

  const titulo =
    tituloInput.value.trim();

  const importe =
    parseFloat(
      importeInput.value
    );

  const pagador =
    selectPagador.value;

  const participantes =
    getSeleccionados();

  if (
    !titulo ||
    !importe ||
    !participantes.length
  ) {

    mostrarToast(
      "Completa todos los campos",
      "error"
    );

    return;

  }

  const fd =
    new FormData();

  fd.append(
    "accion",
    "crear"
  );

  fd.append(
    "titulo",
    titulo
  );

  fd.append(
    "importe",
    importe
  );

  fd.append(
    "pagador",
    pagador
  );

  fd.append(
    "participantes",
    JSON.stringify(participantes)
  );

  const res =
    await fetch(API_GASTOS, {
      method: "POST",
      body: fd,
      credentials: "same-origin"
    });

  const data =
    await res.json();

  if (!data.success) {

    mostrarToast(
      data.message,
      "error"
    );

    return;

  }

  cerrarModal();

  mostrarToast(
    "Gasto creado correctamente"
  );

  await refreshData();

}

/* ================================================= */
/* ================= DELETE ======================== */
/* ================================================= */

function abrirDelete(gasto) {

  gastoAEliminar = gasto;

  deleteModal
    .classList
    .remove("hidden");

}

async function eliminarGasto() {

  if (!gastoAEliminar) {

    return;

  }

  const fd =
    new FormData();

  fd.append(
    "accion",
    "eliminar"
  );

  fd.append(
    "id_gasto",
    gastoAEliminar.id_gasto
  );

  await fetch(API_GASTOS, {
    method: "POST",
    body: fd,
    credentials: "same-origin"
  });

  deleteModal
    .classList
    .add("hidden");

  mostrarToast(
    "Gasto eliminado"
  );

  await refreshData();

}

/* ================================================= */
/* ================= DETALLE ======================= */
/* ================================================= */

function abrirDetalle(gasto) {

  gastoDetalleActual = gasto;

  document.getElementById(
    "detalleTitulo"
  ).textContent =
    gasto.titulo;

  document.getElementById(
    "detallePagador"
  ).textContent =
    gasto.pagador;

  document.getElementById(
    "detalleImporte"
  ).textContent =
    parseFloat(gasto.importe).toFixed(2) + " €";

  const contenedor =
    document.getElementById(
      "detalleParticipantes"
    );

  contenedor.innerHTML = "";

  gasto.participantes.forEach(p => {

    contenedor.innerHTML += `

      <div class="participant-row">

        <div class="participant-left">

          <div class="participant-name">
            ${p.nombre}
          </div>

          <div class="
            participant-status
            ${p.pagado ? "paid" : "pending"}
          ">

            ${p.pagado ? "Pagado" : "Pendiente"}

          </div>

        </div>

        <div class="participant-amount">
          ${parseFloat(p.importe).toFixed(2)} €
        </div>

      </div>

    `;

  });

  detalleModal
    .classList
    .remove("hidden");

}

function cerrarDetalle() {

  detalleModal
    .classList
    .add("hidden");

}

/* ================================================= */
/* ================= PAGOS ========================= */
/* ================================================= */

function abrirPago() {

  pagoModal
    .classList
    .remove("hidden");

}

function cerrarPago() {

  pagoModal
    .classList
    .add("hidden");

}

async function guardarPago() {

  const receptor =
    document.getElementById(
      "pagoReceptor"
    ).value;

  const importe =
    document.getElementById(
      "pagoImporte"
    ).value;

  if (!importe) {

    mostrarToast(
      "Introduce un importe",
      "error"
    );

    return;

  }

  const fd =
    new FormData();

  fd.append(
    "accion",
    "crear"
  );

  fd.append(
    "receptor",
    receptor
  );

  fd.append(
    "importe",
    importe
  );

  const res =
    await fetch(API_PAGOS, {
      method: "POST",
      body: fd,
      credentials: "same-origin"
    });

  const data =
    await res.json();

  if (!data.success) {

    mostrarToast(
      data.message,
      "error"
    );

    return;

  }

  cerrarPago();

  mostrarToast(
    "Pago registrado"
  );

  await refreshData();

}

/* ================================================= */
/* ================= RESUMEN ======================= */
/* ================================================= */

async function cargarResumen() {

  const fd =
    new FormData();

  fd.append(
    "accion",
    "resumen"
  );

  const res =
    await fetch(API_GASTOS, {
      method: "POST",
      body: fd,
      credentials: "same-origin"
    });

  const data =
    await res.json();

  if (!data.success) {

    return;

  }

  const contenedor =
    document.getElementById(
      "resumenDeudas"
    );

  contenedor.innerHTML = "";

  let total = 0;

  data.debes.forEach(d => {

    total++;

    contenedor.innerHTML += `

      <div class="deuda">

        Debes
        <strong>${d.importe.toFixed(2)} €</strong>
        a
        <strong>${d.nombre}</strong>

      </div>

    `;

  });

  data.recibes.forEach(r => {

    total++;

    contenedor.innerHTML += `

      <div class="recibe">

        <strong>${r.nombre}</strong>
        te debe
        <strong>${r.importe.toFixed(2)} €</strong>

      </div>

    `;

  });

  document.getElementById(
    "deudasCount"
  ).textContent = total;

  if (
    !data.debes.length &&
    !data.recibes.length
  ) {

    contenedor.innerHTML = `

      <div class="empty-debts">
        Todo está saldado ✅
      </div>

    `;

  }

}

/* ================================================= */
/* ================= CONFIRMAR ===================== */
/* ================================================= */

function abrirConfirmacionPago() {

  confirmarPagoModal
    .classList
    .remove("hidden");

}

function cerrarConfirmacionPago() {

  confirmarPagoModal
    .classList
    .add("hidden");

}

async function confirmarSaldarDeuda() {

  cerrarConfirmacionPago();

  mostrarToast(
    "Pago confirmado"
  );

}

/* ================================================= */
/* ================= TOAST ========================= */
/* ================================================= */

function mostrarToast(
  mensaje,
  tipo = "success"
) {

  const toast =
    document.createElement("div");

  toast.className =
    `toast toast-${tipo}`;

  toast.textContent =
    mensaje;

  document.body.appendChild(toast);

  setTimeout(() => {

    toast.classList.add("show");

  }, 100);

  setTimeout(() => {

    toast.classList.remove("show");

    setTimeout(() => {

      toast.remove();

    }, 300);

  }, 3000);

}