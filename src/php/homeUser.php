<?php
session_start();
require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set('display_errors', 1);

/* ================= SESSION ================= */
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode([
        "success" => false,
        "error" => "No hay sesión"
    ]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

/* ================= INPUT JSON ================= */
$input = json_decode(file_get_contents("php://input"), true);

/* ================= ACTUALIZAR TAREA ================= */
if (isset($input['action']) && $input['action'] === 'actualizarTarea') {

    if (!isset($input['id_tarea']) || !isset($input['estado'])) {
        echo json_encode([
            "success" => false,
            "error" => "Datos incompletos"
        ]);
        exit;
    }

    $id_tarea = (int)$input['id_tarea'];
    $estado   = $input['estado'];

    $stmt = $conn->prepare("UPDATE tareas SET estado=? WHERE id_tarea=?");
    $stmt->bind_param("si", $estado, $id_tarea);
    $stmt->execute();

    echo json_encode([
        "success" => true
    ]);
    exit;
}

/* ================= OBTENER PISO ================= */
$sql = "SELECT id_piso FROM usuarios_pisos WHERE id_usuario=? LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "error" => "Usuario sin piso"
    ]);
    exit;
}

$id_piso = $res->fetch_assoc()['id_piso'];

/* ================= DATA ================= */
$data = [
    "balance" => [],
    "gastos" => [],
    "tareas" => [],
    "avisos" => [],
    "reparto" => []
];

/* ================= BALANCE ================= */

// total piso
$sql = "SELECT COALESCE(SUM(monto_total),0) as total FROM gastos WHERE id_piso=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();
$total = $stmt->get_result()->fetch_assoc()["total"];

// pagado
$sql = "SELECT COALESCE(SUM(monto_total),0) as pagado FROM gastos WHERE id_pagador=? AND id_piso=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_piso);
$stmt->execute();
$pagado = $stmt->get_result()->fetch_assoc()["pagado"];

// debido
$sql = "
SELECT COALESCE(SUM(gp.importe),0) as debido
FROM gastos_participantes gp
JOIN gastos g ON gp.id_gasto = g.id_gasto
WHERE gp.id_usuario=? AND g.id_piso=?
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_piso);
$stmt->execute();
$debido = $stmt->get_result()->fetch_assoc()["debido"];

$data["balance"] = [
    "total" => (float)$total,
    "pagado" => (float)$pagado,
    "debido" => (float)$debido,
    "neto" => (float)($pagado - $debido)
];

/* ================= GASTOS ================= */

$sql = "
SELECT g.descripcion, g.monto_total, u.nombre as pagador
FROM gastos g
JOIN usuarios u ON g.id_pagador = u.id_usuario
WHERE g.id_piso=?
ORDER BY g.id_gasto DESC
LIMIT 3
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();
$res = $stmt->get_result();

while ($row = $res->fetch_assoc()) {
    $data["gastos"][] = $row;
}

/* ================= TAREAS ================= */

$sql = "
SELECT 
    t.id_tarea,
    t.titulo,
    t.estado,
    u.nombre as usuario
FROM tareas t
JOIN usuarios u ON t.id_usuario = u.id_usuario
WHERE t.id_piso=?
ORDER BY t.id_tarea DESC
LIMIT 5
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();
$res = $stmt->get_result();

while ($row = $res->fetch_assoc()) {
    $data["tareas"][] = $row;
}

/* ================= AVISOS ================= */

$sql = "
SELECT titulo, descripcion
FROM avisos
WHERE id_piso=?
ORDER BY id_aviso DESC
LIMIT 3
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();
$res = $stmt->get_result();

while ($row = $res->fetch_assoc()) {
    $data["avisos"][] = $row;
}

/* ================= REPARTO ================= */

$sql = "
SELECT 
    u.nombre, 
    COALESCE(SUM(gp.importe),0) as debe
FROM gastos_participantes gp
JOIN usuarios u ON gp.id_usuario = u.id_usuario
JOIN gastos g ON gp.id_gasto = g.id_gasto
WHERE g.id_piso=?
GROUP BY u.id_usuario
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();
$res = $stmt->get_result();

while ($row = $res->fetch_assoc()) {
    $data["reparto"][] = $row;
}

/* ================= RESPONSE ================= */

echo json_encode([
    "success" => true,
    "data" => $data
]);