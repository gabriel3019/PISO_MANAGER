const API_GASTOS = "../php/gastosComunes.php";
const API_USUARIOS = "../php/usuariosPiso.php";

/* ================= ESTADO ================= */
let gastos = [];
let usuarios = [];
let gastoEditando = null;
let gastoAEliminar = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {

  cargarUsuario();
  cargarUsuarios();
  cargarGastos();

  /* ================= DOM ================= */
  const modal = document.getElementById("gastoModal");
  const deleteModal = document.getElementById("deleteModal");

  const tituloInput = document.getElementById("gastoTitulo");
  const importeInput = document.getElementById("gastoImporte");
  const selectPagador = document.getElementById("gastoPagador");
  const selectPersonas = document.getElementById("gastoPersonas");

  const btnGuardar = document.getElementById("guardarGasto");
  const lista = document.getElementById("gastosContainer");

  const btnAbrir = document.querySelector(".add-btn");
  const btnCerrar = document.getElementById("closeGastoModal");
  const btnCancelar = document.getElementById("cancelGasto");

  const confirmDelete = document.getElementById("confirmDelete");
  const cancelDelete = document.getElementById("cancelDelete");

  /* 🔥 NUEVO */
  const btnIgual = document.getElementById("btnIgual");
  const btnManual = document.getElementById("btnManual");
  const divisionContainer = document.getElementById("divisionContainer");

  /* ================= MODAL ================= */
  btnAbrir.onclick = () => {
    gastoEditando = null;
    limpiarFormulario();
    modal.classList.remove("hidden");
  };

  btnCerrar.onclick = cerrarModal;
  btnCancelar.onclick = cerrarModal;

  function cerrarModal() {
    modal.classList.add("hidden");
    limpiarFormulario();
  }

  cancelDelete.onclick = () => {
    deleteModal.classList.add("hidden");
    gastoAEliminar = null;
  };

  /* ================= DIVIDIR IGUAL ================= */
  btnIgual.addEventListener("click", () => {

    const total = parseFloat(importeInput.value);
    const personas = parseInt(selectPersonas.value);

    if (!total || !personas) {
      alert("Introduce importe primero");
      return;
    }

    const parte = (total / personas).toFixed(2);

    divisionContainer.innerHTML = "";

    usuarios.slice(0, personas).forEach(u => {
      const div = document.createElement("div");
      div.className = "division-item";

      div.innerHTML = `
        <span>${u.nombre}</span>
        <input type="number" value="${parte}" disabled>
      `;

      divisionContainer.appendChild(div);
    });
  });

  /* ================= AJUSTE MANUAL ================= */
  btnManual.addEventListener("click", () => {

    const personas = parseInt(selectPersonas.value);

    divisionContainer.innerHTML = "";

    usuarios.slice(0, personas).forEach(u => {
      const div = document.createElement("div");
      div.className = "division-item";

      div.innerHTML = `
        <span>${u.nombre}</span>
        <input type="number" placeholder="0.00">
      `;

      divisionContainer.appendChild(div);
    });
  });

  /* ================= GUARDAR ================= */
  btnGuardar.onclick = async () => {

    const titulo = tituloInput.value.trim();
    const importe = parseFloat(importeInput.value);
    const pagador = selectPagador.value;

    if (!titulo || isNaN(importe)) {
      alert("Rellena título e importe");
      return;
    }

    try {
      const fd = new FormData();

      if (gastoEditando) {
        fd.append("accion", "editar");
        fd.append("id_gasto", gastoEditando.id_gasto);
      } else {
        fd.append("accion", "crear");
      }

      fd.append("titulo", titulo);
      fd.append("importe", importe);
      fd.append("pagador", pagador);

      const res = await fetch(API_GASTOS, {
        method: "POST",
        body: fd,
        credentials: "same-origin"
      });

      const data = await res.json();

      if (!data.success) {
        console.error(data.message);
        return;
      }

      cerrarModal();
      cargarGastos();

    } catch (err) {
      console.error("Error guardar:", err);
    }
  };

  /* ================= ELIMINAR ================= */
  confirmDelete.onclick = async () => {

    if (!gastoAEliminar) return;

    try {
      const fd = new FormData();
      fd.append("accion", "eliminar");
      fd.append("id_gasto", gastoAEliminar.id_gasto);

      await fetch(API_GASTOS, {
        method: "POST",
        body: fd,
        credentials: "same-origin"
      });

      deleteModal.classList.add("hidden");
      gastoAEliminar = null;

      cargarGastos();

    } catch (err) {
      console.error("Error eliminar:", err);
    }
  };

  /* ================= LIMPIAR ================= */
  function limpiarFormulario() {
    tituloInput.value = "";
    importeInput.value = "";
    divisionContainer.innerHTML = "";
  }

});

/* ================= SIDEBAR ================= */
function cargarUsuario() {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  const nombre = document.getElementById("nombreUsuario");

  if (usuario && nombre) {
    nombre.textContent = usuario.nombre;
  }
}

/* ================= USUARIOS ================= */
async function cargarUsuarios() {
  try {
    const res = await fetch(API_USUARIOS, {
      method: "POST",
      credentials: "same-origin"
    });

    const data = await res.json();
    if (!data.success) return;

    usuarios = data.usuarios;

    const selectPagador = document.getElementById("gastoPagador");
    selectPagador.innerHTML = "";

    usuarios.forEach(u => {
      const option = document.createElement("option");
      option.value = u.id_usuario;
      option.textContent = u.nombre;
      selectPagador.appendChild(option);
    });

  } catch (err) {
    console.error("Error usuarios:", err);
  }
}

/* ================= GASTOS ================= */
async function cargarGastos() {
  try {
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

  } catch (err) {
    console.error("Error gastos:", err);
  }
}

/* ================= RENDER ================= */
function renderLista() {

  const lista = document.getElementById("gastosContainer");
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
        <span class="edit-btn">✏️</span>
        <span class="delete-btn">🗑️</span>
      </div>
    `;

    div.querySelector(".edit-btn").onclick = () => {
      gastoEditando = gasto;
      document.getElementById("gastoTitulo").value = gasto.titulo;
      document.getElementById("gastoImporte").value = gasto.importe;
      document.getElementById("gastoModal").classList.remove("hidden");
    };

    div.querySelector(".delete-btn").onclick = () => {
      gastoAEliminar = gasto;
      document.getElementById("deleteModal").classList.remove("hidden");
    };

    lista.appendChild(div);
  });
}