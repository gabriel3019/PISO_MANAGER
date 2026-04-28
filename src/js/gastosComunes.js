document.addEventListener("DOMContentLoaded", () => {

  /* ================= ESTADO ================= */
  let modoDivision = "igual";
  let gastos = [];

  let gastoEditando = null;
  let gastoAEliminar = null;

  const personasLista = ["Tú", "Laura", "Pablo", "Marta"];

  /* ================= DOM ================= */
  const modal = document.getElementById("gastoModal");
  const deleteModal = document.getElementById("deleteModal");

  const detalleModal = document.getElementById("detalleModal");
  const detalleContenido = document.getElementById("detalleContenido");

  const btnAbrir = document.querySelector(".add-btn");
  const btnCerrar = document.getElementById("closeGastoModal");
  const btnCancelar = document.getElementById("cancelGasto");

  const confirmDelete = document.getElementById("confirmDelete");
  const cancelDelete = document.getElementById("cancelDelete");

  const tituloInput = document.getElementById("gastoTitulo");
  const importeInput = document.getElementById("gastoImporte");

  const btnGuardar = document.getElementById("guardarGasto");
  const lista = document.getElementById("gastosContainer");

  const divisionContainer = document.getElementById("divisionContainer");

  /* ================= CARGAR DATOS ================= */
  async function cargarGastos() {

    const fd = new FormData();
    fd.append("accion", "listar");

    const res = await fetch("../php/gastos.php", {
      method: "POST",
      body: fd,
      credentials: "same-origin"
    });

    const data = await res.json();

    if (data.success) {
      gastos = data.gastos;
      renderLista();
    }
  }

  cargarGastos();

  /* ================= MODAL ================= */
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

  cancelDelete.onclick = () => deleteModal.classList.add("hidden");

  /* ================= DIVISION ================= */
  function renderDivision() {
    divisionContainer.innerHTML = "";

    const importe = parseFloat(importeInput.value) || 0;
    const personas = 3;

    if (modoDivision === "igual") {
      const porPersona = (importe / personas || 0).toFixed(2);
      divisionContainer.innerHTML = `<p>${personas} personas · ${porPersona}€</p>`;
    }
  }

  /* ================= GUARDAR ================= */
  btnGuardar.onclick = async () => {

    const titulo = tituloInput.value.trim();
    const importe = parseFloat(importeInput.value);

    if (!titulo || !importe) return;

    const fd = new FormData();
    fd.append("accion", gastoEditando ? "editar" : "crear");
    fd.append("titulo", titulo);
    fd.append("importe", importe);

    if (gastoEditando) {
      fd.append("id_gasto", gastoEditando.id_gasto);
    }

    const res = await fetch("../php/gastos.php", {
      method: "POST",
      body: fd,
      credentials: "same-origin"
    });

    const data = await res.json();

    if (data.success) {
      gastoEditando = null;
      cerrarModal();
      cargarGastos();
    }
  };

  /* ================= ELIMINAR ================= */
  confirmDelete.onclick = async () => {

    const fd = new FormData();
    fd.append("accion", "eliminar");
    fd.append("id_gasto", gastoAEliminar.id_gasto);

    await fetch("../php/gastos.php", {
      method: "POST",
      body: fd,
      credentials: "same-origin"
    });

    deleteModal.classList.add("hidden");
    cargarGastos();
  };

  /* ================= DETALLE ================= */
  function abrirDetalle(gasto) {

    detalleContenido.innerHTML = `
      <h3>${gasto.titulo}</h3>
      <p>Total: ${parseFloat(gasto.importe).toFixed(2)}€</p>
    `;

    detalleModal.classList.remove("hidden");
  }

  /* ================= LISTA ================= */
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
          </div>
        </div>

        <div class="right">
          <div class="amount">${parseFloat(gasto.importe).toFixed(2)} €</div>
          <span class="edit-btn">✏️</span>
          <span class="delete-btn">🗑️</span>
        </div>
      `;

      /* DETALLE */
      div.onclick = () => abrirDetalle(gasto);

      /* EDITAR */
      div.querySelector(".edit-btn").onclick = (e) => {
        e.stopPropagation();

        gastoEditando = gasto;

        tituloInput.value = gasto.titulo;
        importeInput.value = gasto.importe;

        modal.classList.remove("hidden");
      };

      /* ELIMINAR */
      div.querySelector(".delete-btn").onclick = (e) => {
        e.stopPropagation();

        gastoAEliminar = gasto;
        deleteModal.classList.remove("hidden");
      };

      lista.appendChild(div);
    });
  }

  /* ================= LIMPIAR ================= */
  function limpiarFormulario() {
    tituloInput.value = "";
    importeInput.value = "";
  }

  /* ================= UX ================= */
  window.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarModal();
  });

});