const modal =
    document.getElementById("modalMiembro");

const abrir =
    document.getElementById("btnAbrirModal");

const cerrar =
    document.getElementById("cerrarModal");

const form =
    document.getElementById("formMiembro");

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
/* ================= CAMBIO PASOS ================== */
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

            setTimeout(() => {

                location.reload();

            }, 1000);

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