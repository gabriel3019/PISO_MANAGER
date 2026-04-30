
<?php
session_start();

require_once __DIR__ . "/BBDD/conecta.php";
header("Content-Type: application/json");

/* ================= SEGURIDAD ================= */
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode([
        "success" => false,
        "message" => "No autorizado"
    ]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];
$id_piso    = $_SESSION['piso_id'] ?? null;

if (!$id_piso) {
    echo json_encode([
        "success" => false,
        "message" => "No hay piso activo"
    ]);
    exit;
}

/* ================= DATOS ================= */
$accion   = $_POST['accion'] ?? '';
$id_gasto = $_POST['id_gasto'] ?? null;
$titulo   = trim($_POST['titulo'] ?? '');
$importe  = $_POST['importe'] ?? null;

/* ================= VALIDACIÓN ================= */
if ($accion !== "eliminar" && $accion !== "listar") {
    if (!$titulo || !$importe) {
        echo json_encode([
            "success" => false,
            "message" => "Datos incompletos"
        ]);
        exit;
    }
}

try {

    /* ================= CREAR ================= */
    if ($accion === "crear") {

        $sql = "
            INSERT INTO gastos (id_piso, descripcion, monto)
            VALUES (?, ?, ?)
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isd", $id_piso, $titulo, $importe);
        $stmt->execute();

        echo json_encode([
            "success" => true,
            "id_gasto" => $stmt->insert_id
        ]);
        exit;
    }

    /* ================= EDITAR ================= */
    if ($accion === "editar" && $id_gasto) {

        $sql = "
            UPDATE gastos
            SET descripcion = ?, monto = ?
            WHERE id_gasto = ? AND id_piso = ?
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sdii", $titulo, $importe, $id_gasto, $id_piso);
        $stmt->execute();

        echo json_encode([
            "success" => true
        ]);
        exit;
    }

    /* ================= ELIMINAR ================= */
    if ($accion === "eliminar" && $id_gasto) {

        $sql = "
            DELETE FROM gastos
            WHERE id_gasto = ? AND id_piso = ?
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $id_gasto, $id_piso);
        $stmt->execute();

        echo json_encode([
            "success" => true
        ]);
        exit;
    }

    /* ================= LISTAR ================= */
    if ($accion === "listar") {

        $sql = "
            SELECT id_gasto, descripcion AS titulo, monto AS importe
            FROM gastos
            WHERE id_piso = ?
            ORDER BY id_gasto DESC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id_piso);
        $stmt->execute();

        $result = $stmt->get_result();
        $gastos = [];

        while ($row = $result->fetch_assoc()) {
            $gastos[] = $row;
        }

        echo json_encode([
            "success" => true,
            "gastos" => $gastos
        ]);
        exit;
    }

    echo json_encode([
        "success" => false,
        "message" => "Acción no válida"
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
