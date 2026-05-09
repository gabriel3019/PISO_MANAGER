/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  inicializar();
});

function inicializar() {
  cargarDatos();
  inicializarLogout();
  inicializarGuardar();
  inicializarRotacion();
}


/* ================= CARGAR DATOS ================= */
async function cargarDatos() {

  try {
    const res = await fetch("../php/homeAdmin.php", {
      method: "GET",
      credentials: "same-origin"
    });

    const data = await res.json();

    if (!data.success) {
      console.error(data.error);
      return;
    }

    /* ===== USUARIO ===== */
    if (data.usuario) {

      const nombre = data.usuario.nombre || "Admin";

      const nombreEl = document.getElementById("nombreAdmin");
      if (nombreEl) nombreEl.textContent = nombre;

      const avatar = document.querySelector(".avatar");
      if (avatar) {
        avatar.textContent = obtenerIniciales(nombre);
      }
    }

    /* ===== PISO ===== */
    if (data.piso) {
      document.getElementById("calle").value = data.piso.calle || "";
      document.getElementById("ciudad").value = data.piso.ciudad || "";
      document.getElementById("codigo_postal").value = data.piso.codigo_postal || "";
    }

  } catch (err) {
    console.error("Error cargando datos:", err);
  }
}


/* ================= GUARDAR ================= */
function inicializarGuardar() {

  const btn = document.querySelector(".save-btn");
  if (!btn) return;

  btn.addEventListener("click", guardarCambios);
}

async function guardarCambios() {

  const calle = document.getElementById("calle").value.trim();
  const ciudad = document.getElementById("ciudad").value.trim();
  const codigo_postal = document.getElementById("codigo_postal").value.trim();

  try {

    const res = await fetch("../php/guardarPiso.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        calle,
        ciudad,
        codigo_postal
      })
    });

    const data = await res.json();

    if (data.success) {
      mostrarToast("Guardado correctamente ✅");
    } else {
      mostrarToast("Error al guardar ❌");
    }

  } catch (err) {
    console.error(err);
    mostrarToast("Error de conexión ❌");
  }
}


/* ================= LOGOUT ================= */
function inicializarLogout() {

  const btn = document.getElementById("btn-cerrar-sesion");
  if (!btn) return;

  btn.addEventListener("click", cerrarSesion);
}

function cerrarSesion() {

  mostrarToast("Cerrando sesión...");

  setTimeout(async () => {

    try {
      await fetch("../php/logout.php", {
        method: "POST",
        credentials: "same-origin"
      });
    } catch (err) {
      console.error("Error logout:", err);
    }

    /* limpiar */
    sessionStorage.removeItem("usuario");

    /* redirigir 🔥 */
    window.location.href = "../html/login.html";

  }, 500);
}


/* ================= ROTACIÓN ================= */
function inicializarRotacion() {

  const botones = document.querySelectorAll(".rotation-buttons button");

  botones.forEach(btn => {
    btn.addEventListener("click", () => {

      botones.forEach(b => b.classList.remove("active-btn"));
      btn.classList.add("active-btn");

      console.log("Rotación:", btn.dataset.rotacion);
    });
  });
}


/* ================= UTIL ================= */
function obtenerIniciales(nombre) {
  return nombre
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}


/* ================= TOAST ================= */
function mostrarToast(mensaje) {

  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "#111",
      color: "#fff",
      padding: "10px 15px",
      borderRadius: "8px",
      fontSize: "14px",
      opacity: "0",
      transition: "0.3s"
    });
  }

  toast.textContent = mensaje;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}