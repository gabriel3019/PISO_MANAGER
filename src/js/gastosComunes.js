
// ================= ESTADO =================
let modoDivision = "igual";
const personasLista = ["Tú", "Laura", "Pablo", "Marta"];
let gastoAEliminar = null;

// ================= MODALES =================
const modal = document.getElementById("gastoModal");
const detalleModal = document.getElementById("detalleModal");
const detalleContenido = document.getElementById("detalleContenido");

// 👉 NUEVO (modal eliminar)
const deleteModal = document.getElementById("deleteModal");
const confirmDelete = document.getElementById("confirmDelete");
const cancelDelete = document.getElementById("cancelDelete");

// ================= FORM =================
const tituloInput = document.getElementById("gastoTitulo");
const importeInput = document.getElementById("gastoImporte");
const pagadorInput = document.getElementById("gastoPagador");
const personasInput = document.getElementById("gastoPersonas");

const btnGuardar = document.getElementById("guardarGasto");
const lista = document.querySelector(".list");

// ================= ABRIR / CERRAR =================
document.querySelector(".add-btn").onclick = () => {
  modal.classList.remove("hidden");
  renderDivision();
};

document.getElementById("closeGastoModal").onclick = cerrarModal;
document.getElementById("cancelGasto").onclick = cerrarModal;

document.getElementById("closeDetalleModal").onclick = () => {
  detalleModal.classList.add("hidden");
};

function cerrarModal() {
  modal.classList.add("hidden");
  limpiarFormulario();
}

// 👉 DELETE MODAL CONTROL
cancelDelete.onclick = () => {
  deleteModal.classList.add("hidden");
  gastoAEliminar = null;
};

confirmDelete.onclick = () => {
  if (!gastoAEliminar) return;

  let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  gastos = gastos.filter(g => g.id !== gastoAEliminar.id);

  localStorage.setItem("gastos", JSON.stringify(gastos));

  deleteModal.classList.add("hidden");
  gastoAEliminar = null;

  refrescarLista();
};

// ================= CONTENEDOR DIVISION =================
const containerDivision = document.createElement("div");
containerDivision.id = "divisionContainer";
document.querySelector(".modal-body").appendChild(containerDivision);

// ================= BOTONES =================
const btnIgual = document.querySelector(".split-actions button:nth-child(1)");
const btnManual = document.querySelector(".split-actions button:nth-child(2)");

btnIgual.onclick = () => {
  modoDivision = "igual";
  renderDivision();
};

btnManual.onclick = () => {
  modoDivision = "manual";
  renderDivision();
};

// ================= PERSONAS =================
function getPersonasActivas() {
  const total = parseInt(personasInput.value) || 1;
  return personasLista.slice(0, total);
}

// ================= RENDER DIVISION =================
function renderDivision() {
  containerDivision.innerHTML = "";

  const importe = parseFloat(importeInput.value) || 0;
  const personas = getPersonasActivas();

  if (modoDivision === "igual") {
    const porPersona = personas.length ? importe / personas.length : 0;

    containerDivision.innerHTML = `
      <p style="font-size:13px;color:#6b7280">
        ${personas.length} personas · ${porPersona.toFixed(2)}€ por persona
      </p>
    `;
  } else {
    personas.forEach(persona => {
      containerDivision.innerHTML += `
        <div style="display:flex; justify-content:space-between; padding:10px; background:#f3f4f6; border-radius:10px; margin-bottom:6px;">
          <span>${persona}</span>
          <input type="number" class="input-manual" placeholder="0.00">
        </div>
      `;
    });
  }
}

// ================= REACTIVIDAD =================
importeInput.addEventListener("input", renderDivision);
personasInput.addEventListener("change", renderDivision);

// ================= VALIDACIÓN =================
function mostrarError(input, errorId, mensaje) {
  input.classList.add("input-error");
  document.getElementById(errorId).textContent = mensaje;
}

function limpiarErrores() {
  document.querySelectorAll(".input-error").forEach(el => {
    el.classList.remove("input-error");
  });

  document.querySelectorAll(".error-text").forEach(el => {
    el.textContent = "";
  });
}

tituloInput.addEventListener("input", limpiarErrores);
importeInput.addEventListener("input", limpiarErrores);

// ================= GUARDAR =================
btnGuardar.addEventListener("click", () => {

  let valido = true;
  limpiarErrores();

  const titulo = tituloInput.value.trim();
  const importe = parseFloat(importeInput.value);
  const pagador = pagadorInput.value;
  const personas = getPersonasActivas();

  if (!titulo) {
    mostrarError(tituloInput, "errorTitulo", "El título es obligatorio");
    valido = false;
  }

  if (!importe || importe <= 0) {
    mostrarError(importeInput, "errorImporte", "Introduce un importe válido");
    valido = false;
  }

  if (!valido) return;

  let divisionData = [];
  let esManual = false;

  if (modoDivision === "igual") {
    const porPersona = (importe / personas.length).toFixed(2);

    divisionData = personas.map(p => ({
      nombre: p,
      paga: parseFloat(porPersona),
      manual: false
    }));

  } else {
    esManual = true;
    const inputs = document.querySelectorAll(".input-manual");
    let suma = 0;

    inputs.forEach((input, i) => {
      const valor = parseFloat(input.value) || 0;
      suma += valor;

      divisionData.push({
        nombre: personas[i],
        paga: valor,
        manual: true
      });
    });

    if (suma.toFixed(2) != importe.toFixed(2)) {
      alert("La suma no coincide con el total");
      return;
    }
  }

  const gasto = {
    id: Date.now(),
    titulo,
    importe,
    pagador,
    personas: divisionData,
    manual: esManual
  };

  let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  gastos.push(gasto);
  localStorage.setItem("gastos", JSON.stringify(gastos));

  refrescarLista();
  cerrarModal();
});

// ================= RENDER =================
function renderGasto(gasto) {

  const textoBadge = gasto.manual ? "Ajustado" : "A dividir";
  const claseBadge = gasto.manual ? "gray" : "blue";

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

    <div class="right" style="display:flex; gap:12px">
      <div>
        <span class="badge ${claseBadge}">${textoBadge}</span>
        <span class="split">${gasto.personas.length} personas</span>
        <span class="amount">${gasto.importe.toFixed(2)} €</span>
      </div>

      <div style="display:flex; gap:6px">
        <span class="edit-btn">✏️</span>
        <span class="delete-btn">🗑️</span>
      </div>
    </div>
  `;

  div.addEventListener("click", () => abrirDetalle(gasto));

  // ================= EDITAR =================
  div.querySelector(".edit-btn").onclick = (e) => {
    e.stopPropagation();

    tituloInput.value = gasto.titulo;
    importeInput.value = gasto.importe;
    pagadorInput.value = gasto.pagador;
    personasInput.value = gasto.personas.length;

    modoDivision = gasto.manual ? "manual" : "igual";

    modal.classList.remove("hidden");
    renderDivision();

    let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
    gastos = gastos.filter(g => g.id !== gasto.id);
    localStorage.setItem("gastos", JSON.stringify(gastos));

    refrescarLista();
  };

  // ================= ELIMINAR (CON MODAL) =================
  div.querySelector(".delete-btn").onclick = (e) => {
    e.stopPropagation();

    gastoAEliminar = gasto;
    deleteModal.classList.remove("hidden");
  };

  lista.appendChild(div);
}

// ================= DETALLE =================
function abrirDetalle(gasto) {
  detalleContenido.innerHTML = `
    <strong>${gasto.titulo}</strong>
    <span>Total: ${gasto.importe.toFixed(2)} €</span>
    <span>Pagado por: ${gasto.pagador}</span>
  `;
  detalleModal.classList.remove("hidden");
}

// ================= REFRESCAR =================
function refrescarLista() {
  lista.innerHTML = "";
  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  gastos.forEach(g => renderGasto(g));
}

// ================= INIT =================
window.addEventListener("DOMContentLoaded", refrescarLista);

// ================= LIMPIAR =================
function limpiarFormulario() {
  tituloInput.value = "";
  importeInput.value = "";
  personasInput.value = "3";
  modoDivision = "igual";
  containerDivision.innerHTML = "";
}

