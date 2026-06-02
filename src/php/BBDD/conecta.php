<?php

$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "piso_manager";

$conn = new mysqli(
    $servername,
    $username,
    $password,
    $dbname
);

if ($conn->connect_error) {
    die(
        "Error de conexión: " .
        $conn->connect_error
    );
}

$conn->set_charset("utf8mb4");