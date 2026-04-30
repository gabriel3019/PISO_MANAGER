
document.addEventListener("DOMContentLoaded", () => {

  /* ================= ESTADO ================= */
  let gastos = [];
  let usuarios = [];
  let gastoEditando = null;
  let gastoAEliminar = null;

  /* ================= DOM ================= */
  const modal = document.getElementById("gastoModal");
  const deleteModal = document.getElementById("deleteModal");

  const tituloInput = document.getElementById("gastoTitulo");
  const importeInput = document.getElementById("gastoImporte");
  const selectPagador = document.getElementById("gastoPagador");

  const btnGuardar = document.getElementById("guardarGasto");
  const lista = document.getElementById("gastosContainer");

  const btnAbrir = document.querySelector(".add-btn");
  const btnCerrar = document.getElementById("closeGastoModal");
  const btnCancelar = document.getElementById("cancelGasto");

  const confirmDelete = document.getElementById("confirmDelete");
  const cancelDelete = document.getElementById("cancelDelete");

  /* ================= INIT ================= */
  cargarUsuarios();
  cargarGastos();

  /* ================= USUARIOS ================= */
  async function cargarUsuarios() {
    try {
      const res = await fetch("../php/usuariosPiso.php", {
        method: "POST",
        credentials: "same-origin"
      });

      const data = await res.json();

      if (!data.success) return;

      usuarios = data.usuarios;
      renderSelectUsuarios();

    } catch (err) {
      console.error("Error usuarios:", err);
    }
  }

  function renderSelectUsuarios() {
    selectPagador.innerHTML = "";

    usuarios.forEach(u => {
      const option = document.createElement("option");
      option.value = u.id_usuario;
      option.textContent = u.nombre;
      selectPagador.appendChild(option);
    });
  }

  /* ================= GASTOS ================= */
  async function cargarGastos() {
    try {
      const fd = new FormData();
      fd.append("accion", "listar");

      const res = await fetch("../php/gastosComunes.php", {
        method: "POST",
        body: fd,
        credentials: "same-origin"
      });

      const data = await res.json();

      if (!data.success) {
        console.error(data.message);
        return;
      }

      gastos = data.gastos;
      renderLista();

    } catch (err) {
      console.error("Error gastos:", err);
    }
  }

  /* ================= RENDER ================= */
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
          <span class="edit-btn">✏️</span>
          <span class="delete-btn">🗑️</span>
        </div>
      `;

      div.querySelector(".edit-btn").onclick = (e) => {
        e.stopPropagation();

        gastoEditando = gasto;
        tituloInput.value = gasto.titulo;
        importeInput.value = gasto.importe;

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

  /* ================= MODAL ================= */
  btnAbrir.onclick = () => modal.classList.remove("hidden");
  btnCerrar.onclick = cerrarModal;
  btnCancelar.onclick = cerrarModal;

  function cerrarModal() {
    modal.classList.add("hidden");
    limpiarFormulario();
  }

  cancelDelete.onclick = () => deleteModal.classList.add("hidden");

  /* ================= GUARDAR ================= */
  btnGuardar.onclick = async () => {

    const titulo = tituloInput.value.trim();
    const importe = parseFloat(importeInput.value);
    const pagador = selectPagador.value;

    if (!titulo || !importe) return;

    try {

      const fd = new FormData();
      fd.append("accion", "crear");
      fd.append("titulo", titulo);
      fd.append("importe", importe);
      fd.append("pagador", pagador); // 🔥 IMPORTANTE

      const res = await fetch("../php/gastosComunes.php", {
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

    try {
      const fd = new FormData();
      fd.append("accion", "eliminar");
      fd.append("id_gasto", gastoAEliminar.id_gasto);

      await fetch("../php/gastosComunes.php", {
        method: "POST",
        body: fd,
        credentials: "same-origin"
      });

      deleteModal.classList.add("hidden");
      cargarGastos();

    } catch (err) {
      console.error("Error eliminar:", err);
    }
  };

  /* ================= LIMPIAR ================= */
  function limpiarFormulario() {
    tituloInput.value = "";
    importeInput.value = "";
  }

});

