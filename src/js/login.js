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

function showError(fieldId, message) {
    const field = document.getElementById(fieldId).closest('.field');
    clearError(fieldId);
    field.querySelector('input').classList.add('input-error');
    const msg = document.createElement('p');
    msg.className = 'field-error';
    msg.textContent = message;
    field.appendChild(msg);
}

function clearError(fieldId) {
    const field = document.getElementById(fieldId).closest('.field');
    field.querySelector('input').classList.remove('input-error');
    const existing = field.querySelector('.field-error');
    if (existing) existing.remove();
}

function clearAllErrors() {
    clearError('email');
    clearError('password');
    const general = document.getElementById('general-error');
    if (general) general.remove();
}

function showGeneralError(message) {
    const old = document.getElementById('general-error');
    if (old) old.remove();
    const btn = document.querySelector('.btn-primary');
    const div = document.createElement('p');
    div.id = 'general-error';
    div.className = 'field-error general-error';
    div.textContent = message;
    btn.insertAdjacentElement('afterend', div);
}

function showSuccess(message) {
    const old = document.getElementById('general-error');
    if (old) old.remove();
    const btn = document.querySelector('.btn-primary');
    const div = document.createElement('p');
    div.id = 'general-error';
    div.className = 'general-success';
    div.textContent = message;
    btn.insertAdjacentElement('afterend', div);
}

document.querySelector('.btn-primary').addEventListener('click', async () => {
    clearAllErrors();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    let hasError = false;

    if (!email) {
        showError('email', 'El correo electrónico es obligatorio.');
        hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('email', 'Introduce un correo electrónico válido.');
        hasError = true;
    }

    if (!password) {
        showError('password', 'La contraseña es obligatoria.');
        hasError = true;
    }

    if (hasError) return;

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
        const res    = await fetch('../php/login.php', { method: 'POST', body: formData });
        const result = await res.json();

        if (result.success) {
            showSuccess(`✓ Bienvenido/a, ${result.nombre}. Redirigiendo...`);
            document.querySelector('.btn-primary').disabled = true;
            setTimeout(() => {
                window.location.href = result.rol === 'admin' ? 'homeAdmin.html' : 'homeUser.html';
            }, 3000);
        } else {
            showGeneralError('Usuario o contraseña incorrectos.');
        }
    } catch (err) {
        console.error('Error en login:', err);
        showGeneralError('Error de conexión con el servidor. Inténtalo de nuevo.');
    }
});