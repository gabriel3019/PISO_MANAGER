
const botonesRotacion = document.querySelectorAll(".rotation-buttons button");

botonesRotacion.forEach(boton => {
    boton.addEventListener("click", () => {
        botonesRotacion.forEach(b => b.classList.remove("active-btn"));
        boton.classList.add("active-btn");

        console.log("Rotación seleccionada:", boton.dataset.rotacion);
    });
});


document.addEventListener("DOMContentLoaded", cargarDatosPiso);

async function cargarDatosPiso() {
    try {
        const response = await fetch("../php/homeAdmin.php");
        const data = await response.json();

        if (data.success) {
            document.getElementById("calle").value = data.piso.calle;
            document.getElementById("ciudad").value = data.piso.ciudad;
            document.getElementById("codigo_postal").value = data.piso.codigo_postal;
        } else {
            console.error(data.error);
        }

    } catch (error) {
        console.error("Error al cargar datos del piso:", error);
    }
}