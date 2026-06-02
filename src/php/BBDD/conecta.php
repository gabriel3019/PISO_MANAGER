<?php

$servername = "sql203.infinityfree.com";
$username   = "if0_42079927";
$password   = "PisoManager2026";
$dbname     = "if0_42079927_piso_manager";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión con la base de datos: ' . $conn->connect_error
    ]);
    exit;
}

$conn->set_charset("utf8mb4");
?>