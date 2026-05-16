const modal = document.getElementById("modalMiembro");
const abrir = document.getElementById("btnAbrirModal");
const cerrar = document.getElementById("cerrarModal");

abrir.addEventListener("click", () => {
    modal.classList.add("active");
});

cerrar.addEventListener("click", () => {
    modal.classList.remove("active");
});

window.addEventListener("click", (e) => {

    if (e.target === modal) {
        modal.classList.remove("active");
    }

});

// FORMULARIO
document.getElementById("formMiembro")
    .addEventListener("submit", async (e) => {

        e.preventDefault();

        const formData = new FormData(e.target);

        try {

            const response = await fetch("../php/crearMiembro.php", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.success) {

                alert("Miembro creado correctamente");

                modal.classList.remove("active");

                e.target.reset();

                location.reload();

            } else {

                alert(data.message || "Error al crear miembro");
            }

        } catch (error) {

            alert("Error del servidor");
        }

    });