<?php
session_start();
require_once 'BBDD/conecta.php'; // ajusta la ruta a tu archivo de conexión

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

$email    = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if (!$email || !$password) {
    echo json_encode(['success' => false, 'error' => 'Faltan campos']);
    exit;
}

$stmt = $conn->prepare("
    SELECT u.id_usuario, u.nombre, u.password, up.rol
    FROM usuarios u
    JOIN usuarios_pisos up ON u.id_usuario = up.id_usuario
    WHERE u.email = ?
    LIMIT 1
");
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user   = $result->fetch_assoc();

if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode(['success' => false, 'error' => 'Credenciales incorrectas']);
    exit;
}

// Guardar sesión
$_SESSION['id_usuario'] = $user['id_usuario'];
$_SESSION['nombre']     = $user['nombre'];
$_SESSION['rol']        = $user['rol'];

echo json_encode([
    'success'  => true,
    'rol'      => $user['rol'],
    'nombre'   => $user['nombre']
]);