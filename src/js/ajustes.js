const API_URL = "../php/ajustes.php";

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  cargarPerfil();
});

/* ================= CARGAR PERFIL ================= */
async function cargarPerfil() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "perfil" })
    });

    const json = await res.json();
    if (!json.success) return;

    const u = json.usuario;

    /* ================= INPUTS ================= */
    document.getElementById("nombre").value = u.nombre || "";
    document.getElementById("apellidos").value = u.apellidos || "";
    document.getElementById("email").value = u.email || "";
    document.getElementById("telefono").value = u.telefono || "";
    document.getElementById("direccion").value = u.direccion || "";

    /* ================= FOTO ================= */
    const foto = document.getElementById("fotoPerfil");
    foto.src = u.foto
      ? "../" + u.foto
      : "../img/default-avatar.png";

    /* ================= SIDEBAR ================= */
    const nombreSidebar = document.getElementById("nombreUsuario");
    if (nombreSidebar) {
      nombreSidebar.textContent = u.nombre || "Usuario";
    }

    /* ================= MODO OSCURO ================= */
    const toggle = document.getElementById("modoOscuro");
    const activo = u.modo_oscuro == 1;

    toggle.checked = activo;

    /* 🔥 SINCRONIZAR TODO */
    localStorage.setItem("darkMode", activo);
    document.body.classList.toggle("dark", activo);

  } catch (err) {
    console.error("Error cargando perfil:", err);
  }
}

/* ================= GUARDAR PERFIL ================= */
document.getElementById("guardarPerfil").addEventListener("click", async () => {

  const data = {
    action: "guardar",
    nombre: document.getElementById("nombre").value.trim(),
    apellidos: document.getElementById("apellidos").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    direccion: document.getElementById("direccion").value.trim()
  };

  if (!data.nombre || !data.email) {
    alert("Nombre y email son obligatorios");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await res.json();

    if (json.success) {
      alert("Perfil actualizado ✅");

      /* ================= ACTUALIZAR SESSION ================= */
      const usuario = JSON.parse(sessionStorage.getItem("usuario")) || {};
      usuario.nombre = data.nombre;
      usuario.email = data.email;
      sessionStorage.setItem("usuario", JSON.stringify(usuario));

      /* ================= ACTUALIZAR SIDEBAR ================= */
      const nombreSidebar = document.getElementById("nombreUsuario");
      if (nombreSidebar) {
        nombreSidebar.textContent = data.nombre;
      }
    }

  } catch (err) {
    console.error("Error guardando:", err);
  }
});

/* ================= FOTO ================= */
document.getElementById("cambiarFoto").addEventListener("click", () => {
  document.getElementById("inputFoto").click();
});

document.getElementById("inputFoto").addEventListener("change", async (e) => {

  const file = e.target.files[0];
  if (!file) return;

  /* PREVIEW INMEDIATO */
  document.getElementById("fotoPerfil").src = URL.createObjectURL(file);

  const formData = new FormData();
  formData.append("foto", file);
  formData.append("action", "foto");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: formData
    });

    const json = await res.json();

    if (!json.success) {
      alert("Error subiendo imagen");
    } else {
      /* 🔥 ACTUALIZAR CON RUTA REAL */
      document.getElementById("fotoPerfil").src = "../" + json.ruta;
    }

  } catch (err) {
    console.error("Error subiendo foto:", err);
  }
});

/* ================= MODO OSCURO ================= */
const toggle = document.getElementById("modoOscuro");

toggle.addEventListener("change", async () => {

  const activo = toggle.checked;

  /* 🔥 GUARDAR GLOBAL */
  localStorage.setItem("darkMode", activo);

  /* 🔥 APLICAR INSTANTE */
  document.body.classList.toggle("dark", activo);

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "modoOscuro",
        valor: activo ? 1 : 0
      })
    });

  } catch (err) {
    console.error("Error modo oscuro:", err);
  }
});