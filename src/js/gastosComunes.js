const API_GASTOS = "../php/gastosComunes.php";
const API_USUARIOS = "../php/usuariosPiso.php";
const API_BALANCE = "../php/homeUser.php";
const API_PAGOS = "../php/pagos.php";

/* ================================================= */
/* ================= ESTADO ======================== */
/* ================================================= */

let gastos = [];
let usuarios = [];

let gastoAEliminar = null;
let gastoDetalleActual = null;

let filtroActivo = "todos";

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
/* ================= REFRESH ======================= */
/* ================================================= */

async function refreshData(){

  await cargarGastos();

  await cargarBalance();

  await cargarResumen();

}

/* ================================================= */
/* ================= DOM =========================== */
/* ================================================= */

function initDOM(){

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

  textoConfirmarPago =
    document.getElementById(
      "textoConfirmarPago"
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

}

/* ================================================= */
/* ================= EVENTOS ======================= */
/* ================================================= */

function initEventos(){

  /* ================= GASTOS ================= */

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

  /* ================= DELETE ================= */

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

  /* ================= DIVISION ================= */

  document
    .getElementById("btnIgual")
    .onclick = dividirIgual;

  document
    .getElementById("btnManual")
    .onclick = dividirManual;

  /* ================= PAGOS ================= */

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

  /* ================= DETALLE ================= */

  document
    .getElementById("closeDetalleModal")
    .onclick = cerrarDetalle;

  document
    .getElementById("btnSaldar")
    .onclick = abrirConfirmacionPago;

  /* ================= CONFIRMAR PAGO ================= */

  document
    .getElementById("closeConfirmarPago")
    .onclick = cerrarConfirmacionPago;

  document
    .getElementById("cancelarConfirmarPago")
    .onclick = cerrarConfirmacionPago;

  document
    .getElementById("aceptarConfirmarPago")
    .onclick = confirmarSaldarDeuda;

  /* ================= FILTROS ================= */

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

  /* ================= SEARCH ================= */

  document
    .getElementById("searchInput")
    ?.addEventListener(
      "input",
      renderLista
    );

}

/* ================================================= */
/* ================= FILTROS ======================= */
/* ================================================= */

function cambiarFiltro(filtro){

  filtroActivo = filtro;

  document
    .querySelectorAll(
      ".filters button"
    )
    .forEach(btn => {

      btn.classList.remove("active");

    });

  const btnMap = {

    todos:
      "filterTodos",

    pendientes:
      "filterPendientes",

    liquidados:
      "filterLiquidados",

    mes:
      "filterMes"

  };

  const btn =
    document.getElementById(
      btnMap[filtro]
    );

  if(btn){

    btn.classList.add("active");

  }

  renderLista();

}

/* ================================================= */
/* ================= USUARIO ======================= */
/* ================================================= */

function cargarUsuario(){

  document.getElementById(
    "nombreUsuario"
  ).textContent =
    usuarioActual?.nombre || "";

}

/* ================================================= */
/* ================= BALANCE ======================= */
/* ================================================= */

async function cargarBalance(){

  const res =
    await fetch(API_BALANCE,{

      method:"POST",

      credentials:"same-origin"

    });

  const json =
    await res.json();

  if(!json.success) return;

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

    `${b.neto >= 0 ? "+" : ""}` +
    `${b.neto.toFixed(2)} €`;

  balanceEl.className =

    `amount ${
      b.neto >= 0
        ? "positive"
        : "negative"
    }`;

}

/* ================================================= */
/* ================= USUARIOS ====================== */
/* ================================================= */

async function cargarUsuarios(){

  const res =
    await fetch(API_USUARIOS,{

      method:"POST",

      credentials:"same-origin"

    });

  const data =
    await res.json();

  if(!data.success) return;

  usuarios =
    data.usuarios;

  selectPagador.innerHTML = "";

  const selectPago =
    document.getElementById(
      "pagoReceptor"
    );

  selectPago.innerHTML = "";

  usuarios.forEach(u => {

    /* ================= PAGADOR ================= */

    const option =
      document.createElement(
        "option"
      );

    option.value =
      u.id_usuario;

    option.textContent =
      u.nombre;

    selectPagador
      .appendChild(option);

    /* ================= PAGO ================= */

    if(
      u.id_usuario !=
      usuarioActual.id_usuario
    ){

      const opt =
        document.createElement(
          "option"
        );

      opt.value =
        u.id_usuario;

      opt.textContent =
        u.nombre;

      selectPago
        .appendChild(opt);

    }

  });

  renderCheckboxes();

}

/* ================================================= */
/* ================= CHECKBOXES ==================== */
/* ================================================= */

function renderCheckboxes(){

  usuariosCheckbox.innerHTML = "";

  usuarios.forEach(u => {

    const div =
      document.createElement("div");

    div.innerHTML = `

      <label class="checkbox-user">

        <input
          type="checkbox"
          value="${u.id_usuario}"
          checked
        >

        ${u.nombre}

      </label>

    `;

    usuariosCheckbox
      .appendChild(div);

  });

}

/* ================================================= */
/* ================= GASTOS ======================== */
/* ================================================= */

async function cargarGastos(){

  const fd =
    new FormData();

  fd.append(
    "accion",
    "listar"
  );

  const res =
    await fetch(API_GASTOS,{

      method:"POST",

      body:fd,

      credentials:"same-origin"

    });

  const data =
    await res.json();

  if(!data.success) return;

  gastos =
    data.gastos;

  renderLista();

}

/* ================================================= */
/* ================= RENDER ======================== */
/* ================================================= */

function renderLista(){

  lista.innerHTML = "";

  let gastosFiltrados =
    filtrarGastosUsuario();

  gastosFiltrados =
    aplicarFiltros(
      gastosFiltrados
    );

  gastosFiltrados =
    aplicarBusqueda(
      gastosFiltrados
    );

  if(!gastosFiltrados.length){

    lista.innerHTML = `

      <div class="empty-debts">

        No hay gastos disponibles

      </div>

    `;

    return;

  }

  gastosFiltrados.forEach(gasto => {

    lista.appendChild(
      crearCardGasto(gasto)
    );

  });

}

/* ================================================= */
/* ================= HELPERS ======================= */
/* ================================================= */

function filtrarGastosUsuario(){

  return gastos.filter(g => {

    const soyPagador =

      g.pagador ===
      usuarioActual.nombre;

    const participo =

      g.participantes?.some(
        p =>
          p.nombre ===
          usuarioActual.nombre
      );

    return (
      soyPagador ||
      participo
    );

  });

}

function aplicarFiltros(
  listaGastos
){

  /* ================= PENDIENTES ================= */

  if(
    filtroActivo ===
    "pendientes"
  ){

    return listaGastos.filter(g => {

      return g.participantes?.some(
        p => p.pagado == 0
      );

    });

  }

  /* ================= LIQUIDADOS ================= */

  if(
    filtroActivo ===
    "liquidados"
  ){

    return listaGastos.filter(g => {

      return g.participantes?.every(
        p => p.pagado == 1
      );

    });

  }

  /* ================= MES ================= */

  if(
    filtroActivo ===
    "mes"
  ){

    const ahora =
      new Date();

    return listaGastos.filter(g => {

      if(!g.fecha){

        return true;

      }

      const fecha =
        new Date(g.fecha);

      return (

        fecha.getMonth() ===
        ahora.getMonth()

        &&

        fecha.getFullYear() ===
        ahora.getFullYear()

      );

    });

  }

  return listaGastos;

}

function aplicarBusqueda(
  listaGastos
){

  const input =
    document.getElementById(
      "searchInput"
    );

  if(!input){

    return listaGastos;

  }

  const texto =

    input.value
      .toLowerCase()
      .trim();

  if(!texto){

    return listaGastos;

  }

  return listaGastos.filter(g => {

    return (

      g.titulo
        .toLowerCase()
        .includes(texto)

      ||

      g.pagador
        .toLowerCase()
        .includes(texto)

    );

  });

}

/* ================================================= */
/* ================= CARD GASTO ==================== */
/* ================================================= */

function crearCardGasto(gasto){

  const div =
    document.createElement("div");

  div.className =
    "expense-item";

  const pendiente =

    gasto.participantes?.some(
      p => p.pagado == 0
    );

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

          <div class="
            expense-status
            ${
              pendiente
                ? "pending"
                : "paid"
            }
          ">

            ${
              pendiente
                ? "Pendiente"
                : "Liquidado"
            }

          </div>

        </div>

      </div>

      <div class="right">

        <div class="amount">

          ${parseFloat(
            gasto.importe
          ).toFixed(2)} €

        </div>

        <div class="expense-actions">

          <button class="btn-light detail-btn">
            Ver detalles
          </button>

          <span class="delete-btn">
            🗑️
          </span>

        </div>

      </div>

    </div>

  `;

  div
    .querySelector(".delete-btn")
    .onclick = () =>
      abrirDelete(gasto);

  div
    .querySelector(".detail-btn")
    .onclick = () =>
      abrirDetalle(gasto);

  return div;

}

/* ================================================= */
/* ================= DETALLE ======================= */
/* ================================================= */

function abrirDetalle(gasto){

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

    parseFloat(
      gasto.importe
    ).toFixed(2) + " €";

  const contenedor =
    document.getElementById(
      "detalleParticipantes"
    );

  contenedor.innerHTML = "";

  let puedoSaldar = false;

  gasto.participantes?.forEach(p => {

    if(

      p.nombre ===
      usuarioActual.nombre

      &&

      p.pagado == 0

    ){

      puedoSaldar = true;

    }

    contenedor.innerHTML += `

      <div class="participant-row">

        <div class="participant-left">

          <div class="participant-name">
            ${p.nombre}
          </div>

          <div class="
            participant-status
            ${
              p.pagado
                ? "paid"
                : "pending"
            }
          ">

            ${
              p.pagado
                ? "Pagado"
                : "Pendiente"
            }

          </div>

        </div>

        <div class="participant-amount">

          ${parseFloat(
            p.importe
          ).toFixed(2)} €

        </div>

      </div>

    `;

  });

  const btnSaldar =
    document.getElementById(
      "btnSaldar"
    );

  if(

    puedoSaldar

    &&

    gasto.pagador !==
    usuarioActual.nombre

  ){

    btnSaldar
      .classList
      .remove("hidden");

  }else{

    btnSaldar
      .classList
      .add("hidden");

  }

  detalleModal
    .classList
    .remove("hidden");

}

function cerrarDetalle(){

  detalleModal
    .classList
    .add("hidden");

}

/* ================================================= */
/* ================= CONFIRMAR PAGO ================ */
/* ================================================= */

function abrirConfirmacionPago(){

  if(!gastoDetalleActual){

    return;

  }

  const miParte =

    gastoDetalleActual
      .participantes
      .find(
        p =>
          p.nombre ===
          usuarioActual.nombre
      );

  if(!miParte){

    return;

  }

  textoConfirmarPago.textContent =

    `¿Quieres saldar ${parseFloat(miParte.importe).toFixed(2)} € con ${gastoDetalleActual.pagador}?`;

  confirmarPagoModal
    .classList
    .remove("hidden");

}

function cerrarConfirmacionPago(){

  confirmarPagoModal
    .classList
    .add("hidden");

}

/* ================================================= */
/* ================= SALDAR ======================== */
/* ================================================= */

async function confirmarSaldarDeuda(){

  if(!gastoDetalleActual){

    return;

  }

  const miParte =

    gastoDetalleActual
      .participantes
      .find(
        p =>
          p.nombre ===
          usuarioActual.nombre
      );

  if(!miParte){

    return;

  }

  const btn =
    document.getElementById(
      "aceptarConfirmarPago"
    );

  btn.disabled = true;

  btn.textContent =
    "Procesando...";

  try{

    const fd =
      new FormData();

    fd.append(
      "accion",
      "crear"
    );

    fd.append(
      "receptor",
      gastoDetalleActual.id_pagador
    );

    fd.append(
      "importe",
      miParte.importe
    );

    const res =
      await fetch(API_PAGOS,{

        method:"POST",

        body:fd,

        credentials:"same-origin"

      });

    const data =
      await res.json();

    if(!data.success){

      mostrarToast(
        data.message || "Error al registrar el pago",
        "error"
      );

      return;

    }

    mostrarToast(
      "Pago registrado correctamente",
      "success"
    );

    cerrarConfirmacionPago();

    cerrarDetalle();

    await refreshData();

  }catch(error){

    mostrarToast(
      "Error inesperado",
      "error"
    );

  }finally{

    btn.disabled = false;

    btn.textContent =
      "Confirmar pago";

  }

}

/* ================================================= */
/* ================= MODAL GASTO =================== */
/* ================================================= */

function abrirModal(){

  limpiarFormulario();

  renderCheckboxes();

  modal
    .classList
    .remove("hidden");

}

function cerrarModal(){

  modal
    .classList
    .add("hidden");

}

function limpiarFormulario(){

  tituloInput.value = "";

  importeInput.value = "";

  divisionContainer.innerHTML = "";

}

/* ================================================= */
/* ================= DIVISION ====================== */
/* ================================================= */

function getSeleccionados(){

  return [

    ...usuariosCheckbox
      .querySelectorAll(
        "input:checked"
      )

  ];

}

function dividirIgual(){

  const total =
    parseFloat(
      importeInput.value
    );

  const seleccionados =
    getSeleccionados();

  if(

    !total

    ||

    seleccionados.length === 0

  ){

    return;

  }

  const parte =

    (
      total /
      seleccionados.length
    ).toFixed(2);

  divisionContainer.innerHTML = "";

  seleccionados.forEach(cb => {

    const user =

      usuarios.find(
        u =>
          u.id_usuario ==
          cb.value
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

function dividirManual(){

  const seleccionados =
    getSeleccionados();

  divisionContainer.innerHTML = "";

  seleccionados.forEach(cb => {

    const user =

      usuarios.find(
        u =>
          u.id_usuario ==
          cb.value
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

async function guardarGasto(){

  const titulo =

    tituloInput.value.trim();

  const importe =

    parseFloat(
      importeInput.value
    );

  const pagador =
    selectPagador.value;

  const participantes =

    getSeleccionados().map(
      cb => cb.value
    );

  if(

    !titulo

    ||

    isNaN(importe)

    ||

    participantes.length === 0

  ){

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
    await fetch(API_GASTOS,{

      method:"POST",

      body:fd,

      credentials:"same-origin"

    });

  const data =
    await res.json();

  if(!data.success){

    mostrarToast(
      data.message || "Error",
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
/* ================= ELIMINAR ====================== */
/* ================================================= */

function abrirDelete(gasto){

  gastoAEliminar = gasto;

  deleteModal
    .classList
    .remove("hidden");

}

async function eliminarGasto(){

  if(!gastoAEliminar){

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

  await fetch(API_GASTOS,{

    method:"POST",

    body:fd,

    credentials:"same-origin"

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
/* ================= PAGOS ========================= */
/* ================================================= */

function abrirPago(){

  pagoModal
    .classList
    .remove("hidden");

}

function cerrarPago(){

  pagoModal
    .classList
    .add("hidden");

}

async function guardarPago(){

  const receptor =
    document.getElementById(
      "pagoReceptor"
    ).value;

  const importe =
    document.getElementById(
      "pagoImporte"
    ).value;

  if(!importe){

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
    await fetch(API_PAGOS,{

      method:"POST",

      body:fd,

      credentials:"same-origin"

    });

  const data =
    await res.json();

  if(!data.success){

    mostrarToast(
      data.message || "Error",
      "error"
    );

    return;

  }

  cerrarPago();

  mostrarToast(
    "Pago registrado correctamente"
  );

  await refreshData();

}

/* ================================================= */
/* ================= RESUMEN ======================= */
/* ================================================= */

async function cargarResumen(){

  const fd =
    new FormData();

  fd.append(
    "accion",
    "resumen"
  );

  const res =
    await fetch(API_GASTOS,{

      method:"POST",

      body:fd,

      credentials:"same-origin"

    });

  const data =
    await res.json();

  if(!data.success){

    return;

  }

  const contenedor =
    document.getElementById(
      "resumenDeudas"
    );

  contenedor.innerHTML = "";

  let total = 0;

  /* ================= DEBES ================= */

  data.debes.forEach(d => {

    total++;

    contenedor.innerHTML += `

      <div class="deuda">

        Debes

        <strong>
          ${d.importe.toFixed(2)} €
        </strong>

        a

        <strong>
          ${d.nombre}
        </strong>

      </div>

    `;

  });

  /* ================= RECIBES ================= */

  data.recibes.forEach(r => {

    total++;

    contenedor.innerHTML += `

      <div class="recibe">

        <strong>
          ${r.nombre}
        </strong>

        te debe

        <strong>
          ${r.importe.toFixed(2)} €
        </strong>

      </div>

    `;

  });

  document.getElementById(
    "deudasCount"
  ).textContent = total;

  if(

    !data.debes.length

    &&

    !data.recibes.length

  ){

    contenedor.innerHTML = `

      <div class="empty-debts">

        Todo está saldado ✅

      </div>

    `;

  }

}

/* ================================================= */
/* ================= TOAST ========================= */
/* ================================================= */

function mostrarToast(
  mensaje,
  tipo = "success"
){

  const toast =
    document.createElement("div");

  toast.className =
    `toast toast-${tipo}`;

  toast.textContent =
    mensaje;

  document.body
    .appendChild(toast);

  setTimeout(() => {

    toast.classList.add("show");

  },100);

  setTimeout(() => {

    toast.classList.remove("show");

    setTimeout(() => {

      toast.remove();

    },300);

  },3000);

}