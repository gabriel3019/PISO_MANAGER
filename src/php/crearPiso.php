<?php
header('Content-Type: application/json');
require_once("BBDD/conecta.php");

$data = json_decode(file_get_contents("php://input"), true);

$calle = trim($data["calle"] ?? "");
$ciudad = trim($data["ciudad"] ?? "");
$codigo_postal = trim($data["codigo_postal"] ?? "");

if ($calle === "" || $ciudad === "" || $codigo_postal === "") {
    echo json_encode(["success" => false, "error" => "Faltan datos"]);
    exit;
}

$stmt = $conn->prepare("
    INSERT INTO pisos (nombre_casero, calle, ciudad, codigo_postal)
    VALUES ('', ?, ?, ?)
");

$stmt->bind_param("sss", $calle, $ciudad, $codigo_postal);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "id_piso" => $stmt->insert_id]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}

$stmt->close();
$conn->close();
?>