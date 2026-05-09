<?php
session_start();
require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];
$id_piso = $_SESSION['piso_id'];

$receptor = $_POST['receptor'];
$importe = $_POST['importe'];

$stmt = $conn->prepare("
INSERT INTO pagos (id_piso, id_pagador, id_receptor, importe)
VALUES (?, ?, ?, ?)
");

$stmt->bind_param("iiid", $id_piso, $id_usuario, $receptor, $importe);
$stmt->execute();

echo json_encode(["success" => true]);