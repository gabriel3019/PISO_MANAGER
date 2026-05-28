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

/* BOTONES */

const btnPaso1 =
    document.getElementById("btnPaso1");

const btnPaso2 =
    document.getElementById("btnPaso2");

const volver1 =
    document.getElementById("volver1");

const volver2 =
    document.getElementById("volver2");

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

abrir.addEventListener("click", () => {

    modal.classList.add("active");

    mostrarPaso(1);

});

cerrar.addEventListener("click", () => {

    cerrarModal();

});

window.addEventListener("click", (e) => {

    if (e.target === modal) {

        cerrarModal();

    }

});

function cerrarModal() {

    modal.classList.remove("active");

    form.reset();

    mostrarPaso(1);

}

/* ================================================= */
/* ================= PASOS ========================= */
/* ================================================= */

function mostrarPaso(numero) {

    pasos.forEach(step => {

        step.classList.add("hidden");

    });

    document
        .getElementById(`step${numero}`)
        .classList
        .remove("hidden");

    indicadores.forEach((step, index) => {

        step.classList.toggle(
            "active",
            index < numero
        );

    });

}

/* ================================================= */
/* ================= VALIDACIONES ================== */
/* ================================================= */

btnPaso1.addEventListener("click", () => {

    const nombre =
        form.nombre.value.trim();

    const apellidos =
        form.apellidos.value.trim();

    const email =
        form.email.value.trim();

    const password =
        form.password.value.trim();

    if (
        !nombre ||
        !apellidos ||
        !email ||
        !password
    ) {

        mostrarToast(
            "Completa todos los campos",
            "error"
        );

        return;

    }

    mostrarPaso(2);

});

btnPaso2.addEventListener("click", () => {

    mostrarPaso(3);

});

volver1.addEventListener("click", () => {

    mostrarPaso(1);

});

volver2.addEventListener("click", () => {

    mostrarPaso(2);

});

/* ================================================= */
/* ================= FORMULARIO ==================== */
/* ================================================= */

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const formData =
        new FormData(form);

    try {

        const response =
            await fetch(
                "../php/crearMiembro.php",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        if (data.success) {

            mostrarToast(
                "Miembro creado correctamente",
                "success"
            );

            cerrarModal();

            cargarCompaneros();

        } else {

            mostrarToast(
                data.message ||
                "Error al crear miembro",
                "error"
            );

        }

    } catch (error) {

        mostrarToast(
            "Error del servidor",
            "error"
        );

    }

});

/* ================================================= */
/* ================= CARGAR ======================== */
/* ================================================= */

async function cargarCompaneros() {

    try {

        const res =
            await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    action: "listar"
                })
            });

        const data =
            await res.json();

        if (data.success) {

            renderCompaneros(
                data.usuarios
            );

        }

    } catch (error) {

        console.error(error);

    }

}

/* ================================================= */
/* ================= RENDER ======================== */
/* ================================================= */

function renderCompaneros(lista) {

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

        /* ================= CLICK MODAL ================= */

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
) {

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${tipo}`;

    toast.textContent =
        mensaje;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.classList.add("show");

    }, 100);

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);

}

/* ================================================= */
/* ================= MODAL INFO ==================== */
/* ================================================= */

const modalCompanero =
    document.getElementById(
        "modalCompanero"
    );

function abrirInfo(u){

    document.getElementById(
        "modalNombre"
    ).textContent =
        u.nombre || "-";

    document.getElementById(
        "modalEmail"
    ).textContent =
        u.email || "-";

    document.getElementById(
        "modalRol"
    ).textContent =
        u.rol || "-";

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