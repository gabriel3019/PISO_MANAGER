
<?php
session_start();
require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

/* ================= SEGURIDAD ================= */
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "No autorizado"]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];
$id_piso    = $_SESSION['piso_id'] ?? null;

if (!$id_piso) {
    echo json_encode(["success" => false, "message" => "No hay piso activo"]);
    exit;
}

/* ================= DATOS ================= */
$accion   = $_POST['accion'] ?? '';
$id_gasto = $_POST['id_gasto'] ?? null;
$titulo   = trim($_POST['titulo'] ?? '');
$importe  = $_POST['importe'] ?? null;

try {

    /* ================= CREAR ================= */
    if ($accion === "crear") {

        if (!$titulo || !$importe) {
            echo json_encode(["success" => false, "message" => "Datos incompletos"]);
            exit;
        }

        // 1. insertar gasto
        $sql = "
            INSERT INTO gastos (id_piso, id_pagador, descripcion, monto_total)
            VALUES (?, ?, ?, ?)
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iisd", $id_piso, $id_usuario, $titulo, $importe);
        $stmt->execute();

        $id_gasto = $stmt->insert_id;

        // 2. dividir entre todos (simple)
        $sql = "SELECT id_usuario FROM usuarios_pisos WHERE id_piso=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id_piso);
        $stmt->execute();

        $res = $stmt->get_result();
        $usuarios = [];

        while ($row = $res->fetch_assoc()) {
            $usuarios[] = $row['id_usuario'];
        }

        $parte = $importe / count($usuarios);

        // 3. insertar participantes
        foreach ($usuarios as $uid) {

            $pagado = ($uid == $id_usuario) ? 1 : 0;

            $sql = "
                INSERT INTO gastos_participantes (id_gasto, id_usuario, importe, pagado)
                VALUES (?, ?, ?, ?)
            ";

            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iidi", $id_gasto, $uid, $parte, $pagado);
            $stmt->execute();
        }

        echo json_encode(["success" => true]);
        exit;
    }

    /* ================= ELIMINAR ================= */
    if ($accion === "eliminar" && $id_gasto) {

        $sql = "DELETE FROM gastos WHERE id_gasto=? AND id_piso=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $id_gasto, $id_piso);
        $stmt->execute();

        echo json_encode(["success" => true]);
        exit;
    }

    /* ================= LISTAR ================= */
    if ($accion === "listar") {

        $sql = "
            SELECT 
                g.id_gasto,
                g.descripcion AS titulo,
                g.monto_total AS importe,
                u.nombre AS pagador
            FROM gastos g
            JOIN usuarios u ON g.id_pagador = u.id_usuario
            WHERE g.id_piso = ?
            ORDER BY g.id_gasto DESC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id_piso);
        $stmt->execute();

        $res = $stmt->get_result();
        $gastos = [];

        while ($row = $res->fetch_assoc()) {
            $gastos[] = $row;
        }

        echo json_encode([
            "success" => true,
            "gastos" => $gastos
        ]);
        exit;
    }

    echo json_encode(["success" => false, "message" => "Acción no válida"]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

