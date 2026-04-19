// ================= MODAL =================
const modal = document.getElementById("gastoModal");

document.querySelector(".add-btn").addEventListener("click", () => {
  modal.classList.remove("hidden");
});

document.getElementById("closeGastoModal").onclick = cerrarModal;
document.getElementById("cancelGasto").onclick = cerrarModal;

function cerrarModal() {
  modal.classList.add("hidden");
  limpiarFormulario();
}

// ================= FORM =================
const tituloInput = document.getElementById("gastoTitulo");
const importeInput = document.getElementById("gastoImporte");
const pagadorInput = document.getElementById("gastoPagador");
const personasInput = document.getElementById("gastoPersonas");

const btnGuardar = document.getElementById("guardarGasto");

// contenedor donde añadir gastos
const lista = document.querySelector(".list");

// ================= GUARDAR GASTO =================
btnGuardar.addEventListener("click", () => {

  const titulo = tituloInput.value.trim();
  const importe = parseFloat(importeInput.value);
  const pagador = pagadorInput.value;
  const personas = parseInt(personasInput.value) || 1;

  // validación básica
  if (!titulo || !importe || importe <= 0) {
    alert("Completa los campos correctamente");
    return;
  }

  // cálculo
  const porPersona = (importe / personas).toFixed(2);

  // crear elemento
  const gastoHTML = `
    <div class="expense-item">
      <div class="left">
        <div class="icon-box">💸</div>
        <div>
          <div class="title">${titulo}</div>
          <div class="meta">Pagado por ${pagador} · ahora</div>
        </div>
      </div>

      <div class="right">
        <span class="badge blue">A dividir</span>
        <span class="split">${personas} personas · ${porPersona}€/c</span>
        <span class="amount">${importe.toFixed(2)} €</span>
      </div>
    </div>
  `;

  // insertar al principio
  lista.insertAdjacentHTML("beforeend", gastoHTML);

  cerrarModal();
});

// ================= LIMPIAR =================
function limpiarFormulario() {
  tituloInput.value = "";
  importeInput.value = "";
  personasInput.value = "3";
}