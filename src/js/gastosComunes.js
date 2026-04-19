// ================= ESTADO =================
let modoDivision = "igual";
let gastos = [];
let gastoEditando = null;
let gastoAEliminar = null;

// ================= MODALES =================
const modal = document.getElementById("gastoModal");
const deleteModal = document.getElementById("deleteModal");

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

// ================= ERRORES =================
const errorTitulo = document.getElementById("errorTitulo");
const errorImporte = document.getElementById("errorImporte");

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

// ================= BOTONES =================
const btnIgual = document.querySelector(".extra-options button:nth-child(1)");
const btnManual = document.querySelector(".extra-options button:nth-child(2)");

// contenedor división
const divisionContainer = document.createElement("div");
divisionContainer.id = "divisionContainer";
document.querySelector(".modal-body").appendChild(divisionContainer);

btnIgual.onclick = () => {
  modoDivision = "igual";
  renderDivision();
};

btnManual.onclick = () => {
  modoDivision = "manual";
  renderDivision();
};

// ================= DIVISION =================
function renderDivision() {
  divisionContainer.innerHTML = "";

  const importe = parseFloat(importeInput.value) || 0;
  const personas = parseInt(personasInput.value) || 1;

  if (modoDivision === "igual") {
    const porPersona = personas ? (importe / personas).toFixed(2) : 0;

    divisionContainer.innerHTML = `
      <p style="font-size:13px;color:#6b7280">
        ${personas} personas · ${porPersona}€ por persona
      </p>
    `;
  } else {
    for (let i = 0; i < personas; i++) {
      divisionContainer.innerHTML += `
        <div style="display:flex; justify-content:space-between; padding:10px; background:#f3f4f6; border-radius:10px; margin-top:6px;">
          <span>Persona ${i + 1}</span>
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

  let divisionTexto = "";
  let esManual = false;

  if (modoDivision === "igual") {
    const porPersona = (importe / personas).toFixed(2);
    divisionTexto = `${personas} personas · ${porPersona}€/c`;
  } else {
    esManual = true;

    const inputs = document.querySelectorAll(".input-manual");
    let suma = 0;

    inputs.forEach(input => {
      suma += parseFloat(input.value) || 0;
    });

    if (suma.toFixed(2) != importe.toFixed(2)) {
      errorImporte.textContent = "La suma no coincide";
      importeInput.classList.add("input-error");
      return;
    }

    divisionTexto = "Importe ajustado";
  }

  const gasto = {
    id: Date.now(),
    titulo,
    importe,
    pagador,
    personas,
    divisionTexto,
    esManual
  };

  if (gastoEditando) {
    gastos = gastos.filter(g => g.id !== gastoEditando.id);
    gastoEditando = null;
  }

  gastos.push(gasto);
  renderLista();
  cerrarModal();
};

// ================= RENDER =================
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

      <div class="right" style="display:flex; gap:12px">

        <div>
          <span class="badge ${gasto.esManual ? "gray" : "blue"}">
            ${gasto.esManual ? "Ajustado" : "A dividir"}
          </span>
          <div class="split">${gasto.divisionTexto}</div>
          <div class="amount">${gasto.importe.toFixed(2)} €</div>
        </div>

        <div style="display:flex; gap:6px">
          <span class="edit-btn">✏️</span>
          <span class="delete-btn">🗑️</span>
        </div>

      </div>
    `;

    // EDITAR
    div.querySelector(".edit-btn").onclick = (e) => {
      e.stopPropagation();
      gastoEditando = gasto;

      tituloInput.value = gasto.titulo;
      importeInput.value = gasto.importe;
      pagadorInput.value = gasto.pagador;
      personasInput.value = gasto.personas;

      modoDivision = gasto.esManual ? "manual" : "igual";

      modal.classList.remove("hidden");
      renderDivision();
    };

    // ELIMINAR
    div.querySelector(".delete-btn").onclick = (e) => {
      e.stopPropagation();
      gastoAEliminar = gasto;
      deleteModal.classList.remove("hidden");
    };

    lista.appendChild(div);
  });
}

// ================= ELIMINAR =================
cancelDelete.onclick = () => {
  deleteModal.classList.add("hidden");
};

confirmDelete.onclick = () => {
  gastos = gastos.filter(g => g.id !== gastoAEliminar.id);
  deleteModal.classList.add("hidden");
  renderLista();
};

// ================= LIMPIAR =================
function limpiarFormulario() {
  tituloInput.value = "";
  importeInput.value = "";
  personasInput.value = "3";
  modoDivision = "igual";
  divisionContainer.innerHTML = "";
}

// ================= UX =================
window.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarModal();
});