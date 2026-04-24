function togglePw() {
    const pw = document.getElementById('password');
    const icon = document.getElementById('eye-icon');
    const isHidden = pw.type === 'password';
    pw.type = isHidden ? 'text' : 'password';
    icon.innerHTML = isHidden
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>`;
}

document.querySelector('.btn-primary').addEventListener('click', async () => {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert('Por favor, rellena todos los campos.');
        return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
        const res    = await fetch('../php/login.php', { method: 'POST', body: formData });
        const result = await res.json();

        if (result.success) {
            if (result.rol === 'admin') {
                window.location.href = 'homeAdmin.html';
            } else {
                window.location.href = 'homeUser.html';
            }
        } else {
            alert('Error: ' + (result.error || 'Credenciales incorrectas'));
        }
    } catch (err) {
        console.error('Error en login:', err);
        alert('Error de conexión con el servidor.');
    }
});