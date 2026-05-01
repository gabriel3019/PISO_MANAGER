
<?php
session_start();
require_once __DIR__ . "/BBDD/conecta.php";

header('Content-Type: application/json');

/* ================= MÉTODO ================= */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

/* ================= ACCIONES ================= */
$action = $_POST['action'] ?? '';

/* ===== CERRAR SESIÓN ===== */
if ($action === 'cerrarSesion') {
    session_unset();
    session_destroy();

    echo json_encode([
        'success' => true,
        'message' => 'Sesión cerrada correctamente'
    ]);
    exit;
}

/* ================= LOGIN ================= */
$email    = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if (!$email || !$password) {
    echo json_encode([
        'success' => false,
        'message' => 'Faltan campos'
    ]);
    exit;
}

/* ================= QUERY ================= */
$stmt = $conn->prepare("
    SELECT 
        u.id_usuario,
        u.nombre,
        u.password,
        up.rol,
        up.id_piso
    FROM usuarios u
    JOIN usuarios_pisos up 
        ON u.id_usuario = up.id_usuario
    WHERE u.email = ?
    LIMIT 1
");

$stmt->bind_param('s', $email);
$stmt->execute();

$result = $stmt->get_result();
$user   = $result->fetch_assoc();

/* ================= VALIDACIÓN ================= */
if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Credenciales incorrectas'
    ]);
    exit;
}

/* ================= SESIÓN ================= */
$_SESSION['id_usuario'] = $user['id_usuario'];
$_SESSION['nombre']     = $user['nombre'];
$_SESSION['rol']        = $user['rol'];
$_SESSION['piso_id']    = $user['id_piso']; // 🔥 CLAVE PARA GASTOS

/* ================= RESPUESTA ================= */
echo json_encode([
    'success' => true,
    'usuario' => [
        'id'     => $user['id_usuario'],
        'nombre' => $user['nombre'],
        'rol'    => $user['rol']
    ]
]);
