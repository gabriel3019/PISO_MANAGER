const form = document.getElementById("formPassword");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    // LIMPIAR MENSAJES
    const oldError = document.querySelector(".error");
    const oldSuccess = document.querySelector(".success");

    if (oldError) oldError.remove();
    if (oldSuccess) oldSuccess.remove();

    // INPUTS
    const password = document
        .getElementById("password")
        .value
        .trim();

    const confirmPassword = document
        .getElementById("confirmPassword")
        .value
        .trim();

    // VALIDACIONES
    if (password.length < 6) {

        showError(
            "La contraseña debe tener al menos 6 caracteres."
        );

        return;
    }

    if (password !== confirmPassword) {

        showError(
            "Las contraseñas no coinciden."
        );

        return;
    }

    // PETICION
    const formData = new FormData();

    formData.append("password", password);

    try {

        const response = await fetch(
            "../php/cambiarPasswordObligatoria.php",
            {
                method: "POST",
                body: formData
            }
        );

        const result = await response.json();

        if (result.success) {

            showSuccess(
                "✓ Contraseña actualizada correctamente."
            );

            setTimeout(() => {

                window.location.href =
                    "../html/homeUser.html";

            }, 1500);

        } else {

            showError(
                result.message ||
                "Error al actualizar contraseña."
            );
        }

    } catch (error) {

        console.error(error);

        showError(
            "Error de conexión con el servidor."
        );
    }

});

/* ================= ERROR ================= */

function showError(message) {

    const div = document.createElement("p");

    div.className = "error";

    div.textContent = message;

    form.appendChild(div);
}

/* ================= SUCCESS ================= */

function showSuccess(message) {

    const div = document.createElement("p");

    div.className = "success";

    div.textContent = message;

    form.appendChild(div);
}