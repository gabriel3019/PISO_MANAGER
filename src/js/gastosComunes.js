// ================= ESTADO =================
let modoDivision = "igual";
let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let pagos = JSON.parse(localStorage.getItem("pagos")) || [];

let gastoEditando = null;
let gastoAEliminar = null;

const personasLista = ["Tú", "Laura", "Pablo", "Marta"];

// ================= MODALES =================
const modal = document.getElementById("gastoModal");
const deleteModal = document.getElementById("deleteModal");

// 🔥 NUEVO (DETALLE)
const detalleModal = document.getElementById("detalleModal");
const detalleContenido = document.getElementById("detalleContenido");
const closeDetalle = document.getElementById("closeDetalle");

const btnAbrir = document.querySelector(".add-btn");
const btnCerrar = document.getElementById("closeGastoModal");
const btnCancelar = document.getElementById("cancelGasto");

const confirmDelete = document.getElementById("confirmDelete");
const cancelDelete = document.getElementById("cancelDelete");

// ================= INPUTS =================
const tituloInput = document.getElementById("gastoTitulo");
const importeInput = document.getElementById("gastoImporte");
const pagadorInput = document.getElementById("gastoPagador");
const personasInput = document.getElementById("gastoPersonas");

const btnGuardar = document.getElementById("guardarGasto");
const lista = document.getElementById("gastosContainer");
const resumen = document.getElementById("resumenDeudas");

// ================= ERRORES =================
const errorTitulo = document.getElementById("errorTitulo");
const errorImporte = document.getElementById("errorImporte");

// ================= DIVISION =================
const divisionContainer = document.getElementById("divisionContainer");

// ================= ABRIR / CERRAR =================
btnAbrir.onclick = () => {
  modal.classList.remove("hidden");
  renderDivision();
};

btnCerrar.onclick = cerrarModal;
btnCancelar.onclick = cerrarModal;

function cerrarModal() {
  modal.classList.add("hidden");
  limpiarFormulario();
}

// cerrar detalle
closeDetalle.onclick = () => {
  detalleModal.classList.add("hidden");
};

// ================= BOTONES =================
document.getElementById("btnIgual").onclick = () => {
  modoDivision = "igual";
  renderDivision();
};

document.getElementById("btnManual").onclick = () => {
  modoDivision = "manual";
  renderDivision();
};

// ================= DIVISION =================
function renderDivision() {
  divisionContainer.innerHTML = "";

  const importe = parseFloat(importeInput.value) || 0;
  const personas = parseInt(personasInput.value) || 1;

  if (modoDivision === "igual") {
    const porPersona = (importe / personas || 0).toFixed(2);

    divisionContainer.innerHTML = `
      <p>${personas} personas · ${porPersona}€ por persona</p>
    `;
  } else {
    for (let i = 0; i < personas; i++) {
      divisionContainer.innerHTML += `
        <div style="display:flex; justify-content:space-between; margin-top:6px;">
          <span>${personasLista[i]}</span>
          <input type="number" class="input-manual" placeholder="0.00">
        </div>
      `;
    }
  }
}

importeInput.addEventListener("input", renderDivision);
personasInput.addEventListener("change", renderDivision);

// ================= VALIDACIÓN =================
function limpiarErrores() {
  errorTitulo.textContent = "";
  errorImporte.textContent = "";
  tituloInput.classList.remove("input-error");
  importeInput.classList.remove("input-error");
}

tituloInput.addEventListener("input", limpiarErrores);
importeInput.addEventListener("input", limpiarErrores);

// ================= GUARDAR =================
btnGuardar.onclick = () => {

  limpiarErrores();

  const titulo = tituloInput.value.trim();
  const importe = parseFloat(importeInput.value);
  const pagador = pagadorInput.value;
  const personas = parseInt(personasInput.value) || 1;

  let valido = true;

  if (!titulo) {
    errorTitulo.textContent = "Introduce un título";
    tituloInput.classList.add("input-error");
    valido = false;
  }

  if (!importe || importe <= 0) {
    errorImporte.textContent = "Importe inválido";
    importeInput.classList.add("input-error");
    valido = false;
  }

  if (!valido) return;

  let division = [];

  if (modoDivision === "igual") {
    const porPersona = importe / personas;

    for (let i = 0; i < personas; i++) {
      division.push({
        nombre: personasLista[i],
        paga: porPersona
      });
    }
  } else {
    const inputs = document.querySelectorAll(".input-manual");
    let suma = 0;

    inputs.forEach((input, i) => {
      const valor = parseFloat(input.value) || 0;
      suma += valor;

      division.push({
        nombre: personasLista[i],
        paga: valor
      });
    });

    if (suma.toFixed(2) != importe.toFixed(2)) {
      errorImporte.textContent = "La suma no coincide";
      return;
    }
  }

  const gasto = {
    id: Date.now(),
    titulo,
    importe,
    pagador,
    division
  };

  if (gastoEditando) {
    gastos = gastos.filter(g => g.id !== gastoEditando.id);
    gastoEditando = null;
  }

  gastos.push(gasto);
  guardarLocalStorage();
  renderTodo();
  cerrarModal();
};

// ================= LOCAL STORAGE =================
function guardarLocalStorage() {
  localStorage.setItem("gastos", JSON.stringify(gastos));
  localStorage.setItem("pagos", JSON.stringify(pagos));
}

// ================= BALANCE =================
function calcularBalance() {
  const balance = {};
  personasLista.forEach(p => balance[p] = 0);

  gastos.forEach(g => {
    balance[g.pagador] += g.importe;

    g.division.forEach(p => {
      balance[p.nombre] -= p.paga;
    });
  });

  pagos.forEach(p => {
    balance[p.deudor] += p.cantidad;
    balance[p.acreedor] -= p.cantidad;
  });

  return balance;
}

// ================= RENDER DEUDAS =================
function renderDeudas() {
  const balance = calcularBalance();
  resumen.innerHTML = "";

  const deudores = [];
  const acreedores = [];

  Object.keys(balance).forEach(p => {
    if (balance[p] < 0) deudores.push({ persona: p, valor: Math.abs(balance[p]) });
    if (balance[p] > 0) acreedores.push({ persona: p, valor: balance[p] });
  });

  deudores.forEach(d => {
    const a = acreedores[0];
    if (!a) return;

    resumen.innerHTML += `
      <div style="display:flex; gap:10px; align-items:center;">
        <span style="color:red">${d.persona} → ${a.persona}: ${d.valor.toFixed(2)}€</span>
        <button class="btn-pagar" data-deudor="${d.persona}" data-acreedor="${a.persona}" data-cantidad="${d.valor}">
          Pagar
        </button>
      </div>
    `;
  });
}

// ================= PAGAR =================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-pagar")) {

    pagos.push({
      deudor: e.target.dataset.deudor,
      acreedor: e.target.dataset.acreedor,
      cantidad: parseFloat(e.target.dataset.cantidad)
    });

    guardarLocalStorage();
    renderTodo();
  }
});

// ================= DETALLE =================
function abrirDetalle(gasto) {

  let html = `
    <h3>${gasto.titulo}</h3>
    <p>Total: ${gasto.importe.toFixed(2)}€</p>
    <p>Pagado por: ${gasto.pagador}</p>
    <hr>
    <b>División:</b>
  `;

  gasto.division.forEach(p => {
    html += `
      <div style="display:flex; justify-content:space-between; margin-top:6px;">
        <span>${p.nombre}</span>
        <span>${p.paga.toFixed(2)}€</span>
      </div>
    `;
  });

  detalleContenido.innerHTML = html;
  detalleModal.classList.remove("hidden");
}

// ================= LISTA =================
function renderLista() {
  lista.innerHTML = "";

  gastos.forEach(gasto => {

    const div = document.createElement("div");
    div.className = "expense-item";

    div.innerHTML = `
      <div class="left">
        <div class="icon-box">💸</div>
        <div>
          <div class="title">${gasto.titulo}</div>
          <div class="meta">Pagado por ${gasto.pagador}</div>
        </div>
      </div>

      <div class="right">
        <div class="amount">${gasto.importe.toFixed(2)} €</div>
        <span class="edit-btn">✏️</span>
        <span class="delete-btn">🗑️</span>
      </div>
    `;

    // 👉 CLICK DETALLE
    div.onclick = () => abrirDetalle(gasto);

    div.querySelector(".edit-btn").onclick = (e) => {
      e.stopPropagation();
      gastoEditando = gasto;

      tituloInput.value = gasto.titulo;
      importeInput.value = gasto.importe;
      pagadorInput.value = gasto.pagador;
      personasInput.value = gasto.division.length;

      modal.classList.remove("hidden");
    };

    div.querySelector(".delete-btn").onclick = (e) => {
      e.stopPropagation();
      gastoAEliminar = gasto;
      deleteModal.classList.remove("hidden");
    };

    lista.appendChild(div);
  });
}

// ================= ELIMINAR =================
cancelDelete.onclick = () => deleteModal.classList.add("hidden");

confirmDelete.onclick = () => {
  gastos = gastos.filter(g => g.id !== gastoAEliminar.id);
  guardarLocalStorage();
  deleteModal.classList.add("hidden");
  renderTodo();
};

// ================= LIMPIAR =================
function limpiarFormulario() {
  tituloInput.value = "";
  importeInput.value = "";
  personasInput.value = "3";
  modoDivision = "igual";
  divisionContainer.innerHTML = "";
}

// ================= RENDER =================
function renderTodo() {
  renderLista();
  renderDeudas();
}

// ================= INIT =================
renderTodo();

// UX
window.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarModal();
});