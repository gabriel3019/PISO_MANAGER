const API_URL = "../php/companeros.php";

/* ================================================= */
/* ================= ELEMENTOS ===================== */
/* ================================================= */

const modal =
document.getElementById("modalMiembro");

const abrir =
document.getElementById("btnAbrirModal");

const cerrar =
document.getElementById("cerrarModal");

const form =
document.getElementById("formMiembro");

const container =
document.getElementById("companerosContainer");

/* ================================================= */
/* ================= PASOS ========================= */
/* ================================================= */

const pasos =
document.querySelectorAll(".form-step");

const indicadores =
document.querySelectorAll(".step");

const btnPaso1 =
document.getElementById("btnPaso1");

const btnPaso2 =
document.getElementById("btnPaso2");

const volver1 =
document.getElementById("volver1");

const volver2 =
document.getElementById("volver2");

let companeroSeleccionado = null;

/* ================================================= */
/* ================= INIT ========================== */
/* ================================================= */

document.addEventListener(
"DOMContentLoaded",
() => {

    cargarCompaneros();

}
);

/* ================================================= */
/* ================= MODAL ========================= */
/* ================================================= */

abrir.addEventListener(
"click",
() => {

    modal.classList.add("active");

    mostrarPaso(1);

}
);

cerrar.addEventListener(
"click",
() => {

    cerrarModal();

}
);

window.addEventListener(
"click",
(e) => {

    if(e.target === modal){

        cerrarModal();

    }

}
);

function cerrarModal(){

modal.classList.remove("active");

form.reset();

mostrarPaso(1);

limpiarTodosErrores();

}

/* ================================================= */
/* ================= PASOS ========================= */
/* ================================================= */

function mostrarPaso(numero){

pasos.forEach(step => {

    step.classList.add("hidden");

});

document
    .getElementById(`step${numero}`)
    .classList
    .remove("hidden");

indicadores.forEach((step,index) => {

    step.classList.toggle(
        "active",
        index < numero
    );

});

}

/* ================================================= */
/* ================= ERRORES ======================= */
/* ================================================= */

function mostrarError(input,mensaje){

input.classList.add(
    "input-error"
);

let error =
    input.parentElement.querySelector(
        ".error-text"
    );

if(!error){

    error =
        document.createElement("span");

    error.className =
        "error-text";

    input.parentElement.appendChild(
        error
    );

}

error.textContent =
    mensaje;

}

function limpiarError(input){

input.classList.remove(
    "input-error"
);

const error =
    input.parentElement.querySelector(
        ".error-text"
    );

if(error){

    error.remove();

}

}

function limpiarTodosErrores(){

document
    .querySelectorAll(".input-error")
    .forEach(input => {

        input.classList.remove(
            "input-error"
        );

    });

document
    .querySelectorAll(".error-text")
    .forEach(error => {

        error.remove();

    });

}

/* ================================================= */
/* ================= LIMPIAR ======================= */
/* ================================================= */

document
.querySelectorAll("input")
.forEach(input => {

    input.addEventListener(
        "input",
        () => {

            limpiarError(input);

        }
    );

});

/* ================================================= */
/* ================= VALIDACIONES ================== */
/* ================================================= */

btnPaso1.addEventListener(
"click",
() => {

    limpiarTodosErrores();

    const nombre =
        form.nombre.value.trim();

    const apellidos =
        form.apellidos.value.trim();

    const email =
        form.email.value.trim();

    const password =
        form.password.value.trim();

    let valido = true;

    if(!nombre){

        mostrarError(
            form.nombre,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(!apellidos){

        mostrarError(
            form.apellidos,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(!email){

        mostrarError(
            form.email,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(!password){

        mostrarError(
            form.password,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(
        password &&
        password.length < 6
    ){

        mostrarError(
            form.password,
            "Mínimo 6 caracteres"
        );

        valido = false;

    }

    if(!valido){

        mostrarToast(
            "Revisa los campos",
            "error"
        );

        return;

    }

    mostrarPaso(2);

}
);

/* ================= PASO 2 ================= */

btnPaso2.addEventListener(
"click",
() => {

    limpiarTodosErrores();

    const dni =
        form.dni.value.trim();

    const nacimiento =
        form.fecha_nacimiento.value;

    const nacionalidad =
        form.nacionalidad.value.trim();

    const telefono =
        form.telefono.value.trim();

    let valido = true;

    if(!dni){

        mostrarError(
            form.dni,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(!nacimiento){

        mostrarError(
            form.fecha_nacimiento,
            "Selecciona una fecha"
        );

        valido = false;

    }

    if(!nacionalidad){

        mostrarError(
            form.nacionalidad,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(!telefono){

        mostrarError(
            form.telefono,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(
        telefono &&
        telefono.length < 9
    ){

        mostrarError(
            form.telefono,
            "Teléfono inválido"
        );

        valido = false;

    }

    if(!valido){

        mostrarToast(
            "Revisa los campos",
            "error"
        );

        return;

    }

    mostrarPaso(3);

}
);

/* ================= VOLVER ================= */

volver1.addEventListener(
"click",
() => {

    mostrarPaso(1);

}
);

volver2.addEventListener(
"click",
() => {

    mostrarPaso(2);

}
);

/* ================================================= */
/* ================= FORMULARIO ==================== */
/* ================================================= */

form.addEventListener(
"submit",
async (e) => {

    e.preventDefault();

    limpiarTodosErrores();

    const direccion =
        form.direccion.value.trim();

    const ciudad =
        form.ciudad.value.trim();

    const codigoPostal =
        form.codigo_postal.value.trim();

    const fechaEntrada =
        form.fecha_entrada.value;

    const contacto =
        form.contacto_emergencia.value.trim();

    const telefonoEmergencia =
        form.telefono_emergencia.value.trim();

    let valido = true;

    if(!direccion){

        mostrarError(
            form.direccion,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(!ciudad){

        mostrarError(
            form.ciudad,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(!codigoPostal){

        mostrarError(
            form.codigo_postal,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(!fechaEntrada){

        mostrarError(
            form.fecha_entrada,
            "Selecciona una fecha"
        );

        valido = false;

    }

    if(!contacto){

        mostrarError(
            form.contacto_emergencia,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(!telefonoEmergencia){

        mostrarError(
            form.telefono_emergencia,
            "Por favor completa este campo"
        );

        valido = false;

    }

    if(!valido){

        mostrarToast(
            "Revisa los campos",
            "error"
        );

        return;

    }

    const formData =
        new FormData(form);

    try{

        const response =
            await fetch(
                "../php/crearMiembro.php",
                {
                    method:"POST",
                    body:formData
                }
            );

        const data =
            await response.json();

        if(data.success){

            mostrarToast(
                "Miembro creado correctamente",
                "success"
            );

            cerrarModal();

            cargarCompaneros();

        }else{

            mostrarToast(
                data.message ||
                "Error al crear miembro",
                "error"
            );

        }

    }catch(error){

        mostrarToast(
            "Error del servidor",
            "error"
        );

    }

}
);

/* ================================================= */
/* ================= CARGAR ======================== */
/* ================================================= */

async function cargarCompaneros(){

try{

    const res =
        await fetch(
            API_URL,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({
                    action:"listar"
                })
            }
        );

    const data =
        await res.json();

    if(data.success){

        renderCompaneros(
            data.usuarios
        );

    }

}catch(error){

    console.error(error);

}

}

/* ================================================= */
/* ================= RENDER ======================== */
/* ================================================= */

function renderCompaneros(lista){

container.innerHTML = "";

lista.forEach(u => {

    const div =
        document.createElement("div");

    div.className =
        "companero";

    div.innerHTML = `

        <div class="left">

            <img
                src="../${u.foto}"
                class="mini-avatar"
            >

            <div>

                <p>${u.nombre}</p>

                <div class="meta">

                    <span class="date">
                        ${u.email}
                    </span>

                </div>

            </div>

        </div>

        <div class="right">

            <span class="rol ${u.rol}">
                ${u.rol}
            </span>

        </div>

    `;

    div.addEventListener(
        "click",
        () => {

            abrirInfo(u);


        }
    );

    container.appendChild(div);

});

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

document.body.appendChild(
    toast
);

setTimeout(() => {

    toast.classList.add(
        "show"
    );

},100);

setTimeout(() => {

    toast.classList.remove(
        "show"
    );

    setTimeout(() => {

        toast.remove();

    },300);

},3000);

}

/* ================================================= */
/* ================= MODAL INFO ==================== */
/* ================================================= */

const modalCompanero =
document.getElementById(
    "modalCompanero"
);

const modalEliminarCompanero =
document.getElementById(
    "modalEliminarCompanero"
);

const btnEliminarCompanero =
document.getElementById(
    "btnEliminarCompanero"
);

const cancelarEliminarCompanero =
document.getElementById(
    "cancelarEliminarCompanero"
);

const confirmarEliminarCompanero =
document.getElementById(
    "confirmarEliminarCompanero"
);

function abrirInfo(u){

companeroSeleccionado = u;

    document.getElementById(
        "modalNombre"
    ).textContent =
        u.nombre || "-";


document.getElementById(
    "modalNombre"
).textContent =
    u.nombre || "-";

document.getElementById(
    "modalEmail"
).textContent =
    u.email || "-";

const modalRol =
    document.getElementById(
        "modalRol"
    );

modalRol.textContent =
    u.rol || "-";

modalRol.className =
    `modal-rol ${u.rol}`;

document.getElementById(
    "modalDni"
).textContent =
    u.dni || "-";

document.getElementById(
    "modalTelefono"
).textContent =
    u.telefono || "-";

document.getElementById(
    "modalFoto"
).src =
    "../" + u.foto;

modalCompanero.classList.add(
    "active"
);

}

btnEliminarCompanero.addEventListener(
    "click",
    () => {

        modalEliminarCompanero.classList.add(
            "active"
        );

    }
);

cancelarEliminarCompanero.addEventListener(
    "click",
    () => {

        modalEliminarCompanero.classList.remove(
            "active"
        );

    }
);

confirmarEliminarCompanero.addEventListener(
    "click",
    () => {

        eliminarCompanero(
            companeroSeleccionado.id_usuario
        );

    }
);

/* ================= CERRAR ================= */

document
.getElementById(
    "cerrarInfoModal"
)
.addEventListener(
    "click",
    () => {

        modalCompanero.classList.remove(
            "active"
        );

    }
);

modalCompanero.addEventListener(
"click",
(e) => {

    if(
        e.target === modalCompanero
    ){

        modalCompanero.classList.remove(
            "active"
        );

    }

}
);

async function eliminarCompanero(idUsuario){

    try{

        const res =
            await fetch(
                API_URL,
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                        "application/json"
                    },

                    body:JSON.stringify({
                        action:"eliminar",
                        id_usuario:idUsuario
                    })
                }
            );

        const data =
            await res.json();

        if(data.success){

            mostrarToast(
                "Miembro eliminado correctamente",
                "success"
            );

            modalEliminarCompanero.classList.remove(
                "active"
            );

            modalCompanero.classList.remove(
                "active"
            );

            cargarCompaneros();

        }else{

            mostrarToast(
                data.message ||
                "Error al eliminar miembro",
                "error"
            );

        }

    }catch(error){

        mostrarToast(
            "Error del servidor",
            "error"
        );

    }

}

/* ================= MENU HAMBURGUESA ================= */

const menuToggle =
    document.getElementById("menuToggle");

const sidebar =
    document.getElementById("sidebar");

if (menuToggle && sidebar) {

    menuToggle.addEventListener("click", () => {

        sidebar.classList.toggle("active");

        if (sidebar.classList.contains("active")) {

            menuToggle.innerHTML = "✕";

        } else {

            menuToggle.innerHTML = "☰";

        }

    });

}