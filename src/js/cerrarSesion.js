async function cerrarSesion() {
    try {
        const res = await fetch('../php/logout.php', {
            method: 'POST'
        });

        const result = await res.json();

        console.log(result);
        if (result.success) {
            sessionStorage.clear(); // limpiar datos cliente
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
    const btn = document.getElementById('btn-cerrar-sesion');
    if (btn) btn.addEventListener('click', cerrarSesion);
});