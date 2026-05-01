
<?php
session_start();
require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];
$id_piso    = $_SESSION['piso_id'];

$data = [
    "balance" => [],
    "gastos" => [],
    "tareas" => [],
    "avisos" => [],
    "reparto" => []
];

/* ================= BALANCE ================= */

// total piso
$sql = "SELECT SUM(monto_total) as total FROM gastos WHERE id_piso=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();
$total = $stmt->get_result()->fetch_assoc()["total"] ?? 0;

// pagado por ti
$sql = "SELECT SUM(monto_total) as pagado FROM gastos WHERE id_pagador=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$pagado = $stmt->get_result()->fetch_assoc()["pagado"] ?? 0;

// lo que debes
$sql = "SELECT SUM(importe) as debido FROM gastos_participantes WHERE id_usuario=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$debido = $stmt->get_result()->fetch_assoc()["debido"] ?? 0;

$data["balance"] = [
    "total" => (float)$total,
    "pagado" => (float)$pagado,
    "debido" => (float)$debido,
    "neto" => (float)($pagado - $debido)
];

/* ================= GASTOS RECIENTES ================= */

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
SELECT t.titulo, t.estado, u.nombre as usuario
FROM tareas t
JOIN usuarios u ON t.id_usuario = u.id_usuario
WHERE t.id_piso=?
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

$sql = "SELECT titulo, descripcion FROM avisos WHERE id_piso=? LIMIT 3";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();
$res = $stmt->get_result();

while ($row = $res->fetch_assoc()) {
    $data["avisos"][] = $row;
}

/* ================= REPARTO (simple) ================= */

$sql = "
SELECT u.nombre, SUM(gp.importe) as debe
FROM gastos_participantes gp
JOIN usuarios u ON gp.id_usuario = u.id_usuario
GROUP BY u.id_usuario
";

$res = $conn->query($sql);

while ($row = $res->fetch_assoc()) {
    $data["reparto"][] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $data
]);

