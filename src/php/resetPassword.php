<?php

require_once __DIR__ . '/BBDD/conecta.php';

$token = $_GET['token'] ?? '';

$stmt = $conn->prepare(
    "SELECT *
     FROM usuarios
     WHERE reset_token = ?
     AND reset_expira > NOW()"
);

$stmt->bind_param("s", $token);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    die("Token inválido o caducado");
}

?>

<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Nueva contraseña</title>

    <style>

        * {

            margin: 0;
            padding: 0;
            box-sizing: border-box;

        }

        body {

            min-height: 100vh;

            display: flex;
            justify-content: center;
            align-items: center;

            background:
                linear-gradient(
                    135deg,
                    #0f172a,
                    #1e293b
                );

            font-family:
                "Segoe UI",
                sans-serif;

            padding: 20px;

        }

        .card {

            width: 100%;
            max-width: 450px;

            background: white;

            border-radius: 24px;

            padding: 35px;

            box-shadow:
                0 20px 40px
                rgba(0,0,0,.2);

        }

        .card h2 {

            text-align: center;

            color: #1e293b;

            margin-bottom: 10px;

        }

        .card p {

            text-align: center;

            color: #64748b;

            margin-bottom: 25px;

            font-size: 14px;

        }

        .form-group {

            margin-bottom: 18px;

        }

        input {

            width: 100%;

            padding: 14px;

            border: 1px solid #cbd5e1;

            border-radius: 12px;

            font-size: 15px;

            outline: none;

        }

        input:focus {

            border-color: #2563eb;

        }

        .btn {

            width: 100%;

            padding: 14px;

            border: none;

            border-radius: 12px;

            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #1d4ed8
                );

            color: white;

            font-size: 15px;

            font-weight: 600;

            cursor: pointer;

            transition: .2s;

        }

        .btn:hover {

            transform: translateY(-2px);

        }

    </style>

</head>

<body>

    <div class="card">

        <h2>Nueva contraseña</h2>

        <p>
            Introduce una nueva contraseña para tu cuenta.
        </p>

        <form
            action="updatePassword.php"
            method="POST"
        >

            <input
                type="hidden"
                name="token"
                value="<?= $token ?>"
            >

            <div class="form-group">

                <input
                    type="password"
                    name="password"
                    placeholder="Nueva contraseña"
                    required
                >

            </div>

            <button
                type="submit"
                class="btn"
            >
                Cambiar contraseña
            </button>

        </form>

    </div>

</body>

</html>