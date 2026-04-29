async function cerrarSesion() {
    const formData = new FormData();
    formData.append('action', 'cerrarSesion');

    try {
        const res    = await fetch('../php/login.php', { method: 'POST', body: formData });
        const result = await res.json();

        if (result.status === 'success') {
            window.location.href = 'login.html';
        } else {
            alert('Error al cerrar sesión.');
        }
    } catch (err) {
        console.error('Error al cerrar sesión:', err);
        alert('Error de conexión con el servidor.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
});