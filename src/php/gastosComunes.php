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
$id_piso = $_SESSION['piso_id'] ?? null;

if (!$id_piso) {
    echo json_encode(["success" => false, "message" => "No hay piso activo"]);
    exit;
}

/* ================= INPUT ================= */
$accion = $_POST['accion'] ?? '';
$id_gasto = $_POST['id_gasto'] ?? null;
$titulo = trim($_POST['titulo'] ?? '');
$importe = floatval($_POST['importe'] ?? 0);
$pagador = $_POST['pagador'] ?? $id_usuario;

$participantes = json_decode($_POST['participantes'] ?? '[]', true);
$importesManual = json_decode($_POST['importes'] ?? '[]', true);

try {

    /* ===================================================== */
    /* ================= CREAR GASTO ======================= */
    /* ===================================================== */
    if ($accion === "crear") {

        if (!$titulo || !$importe || empty($participantes)) {
            echo json_encode(["success" => false, "message" => "Datos incompletos"]);
            exit;
        }

        /* INSERT GASTO */
        $sql = "INSERT INTO gastos (id_piso, id_pagador, descripcion, monto_total)
                VALUES (?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iisd", $id_piso, $pagador, $titulo, $importe);
        $stmt->execute();

        $id_gasto = $stmt->insert_id;

        /* ===== DIVISIÓN ===== */

        // 🔥 MANUAL
        if (!empty($importesManual)) {

            foreach ($importesManual as $uid => $parte) {

                $parte = floatval($parte);
                if ($parte <= 0) continue;

                $pagado = ($uid == $pagador) ? 1 : 0;

                $sql = "INSERT INTO gastos_participantes 
                        (id_gasto, id_usuario, importe, pagado)
                        VALUES (?, ?, ?, ?)";

                $stmt = $conn->prepare($sql);
                $stmt->bind_param("iidi", $id_gasto, $uid, $parte, $pagado);
                $stmt->execute();
            }

        } else {

            // 🔥 IGUAL
            $parte = $importe / count($participantes);

            foreach ($participantes as $uid) {

                $pagado = ($uid == $pagador) ? 1 : 0;

                $sql = "INSERT INTO gastos_participantes 
                        (id_gasto, id_usuario, importe, pagado)
                        VALUES (?, ?, ?, ?)";

                $stmt = $conn->prepare($sql);
                $stmt->bind_param("iidi", $id_gasto, $uid, $parte, $pagado);
                $stmt->execute();
            }
        }

        echo json_encode(["success" => true]);
        exit;
    }

    /* ===================================================== */
    /* ================= ELIMINAR =========================== */
    /* ===================================================== */
    if ($accion === "eliminar" && $id_gasto) {

        $sql = "DELETE FROM gastos WHERE id_gasto=? AND id_piso=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $id_gasto, $id_piso);
        $stmt->execute();

        echo json_encode(["success" => true]);
        exit;
    }

    /* ===================================================== */
    /* ================= LISTAR ============================= */
    /* ===================================================== */
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

    /* ===================================================== */
    /* ================= RESUMEN PRO ======================== */
    /* ===================================================== */
    if ($accion === "resumen") {

        $debes = [];
        $recibes = [];

        /* 🔴 LO QUE DEBES */
        $sql = "
        SELECT 
            u.nombre,
            SUM(gp.importe) as total
        FROM gastos_participantes gp
        JOIN gastos g ON gp.id_gasto = g.id_gasto
        JOIN usuarios u ON g.id_pagador = u.id_usuario
        WHERE gp.id_usuario = ?
        AND g.id_pagador != ?
        AND g.id_piso = ?
        GROUP BY g.id_pagador
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $id_usuario, $id_usuario, $id_piso);
        $stmt->execute();
        $res = $stmt->get_result();

        while ($row = $res->fetch_assoc()) {
            $debes[] = [
                "nombre" => $row['nombre'],
                "importe" => (float)$row['total']
            ];
        }

        /* 🟢 LO QUE TE DEBEN */
        $sql = "
        SELECT 
            u.nombre,
            SUM(gp.importe) as total
        FROM gastos_participantes gp
        JOIN gastos g ON gp.id_gasto = g.id_gasto
        JOIN usuarios u ON gp.id_usuario = u.id_usuario
        WHERE g.id_pagador = ?
        AND gp.id_usuario != ?
        AND g.id_piso = ?
        GROUP BY gp.id_usuario
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $id_usuario, $id_usuario, $id_piso);
        $stmt->execute();
        $res = $stmt->get_result();

        while ($row = $res->fetch_assoc()) {
            $recibes[] = [
                "nombre" => $row['nombre'],
                "importe" => (float)$row['total']
            ];
        }

        echo json_encode([
            "success" => true,
            "debes" => $debes,
            "recibes" => $recibes
        ]);
        exit;
    }

    /* ===================================================== */
    echo json_encode(["success" => false, "message" => "Acción no válida"]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}