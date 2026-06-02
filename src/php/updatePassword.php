<?php

require_once __DIR__ . '/BBDD/conecta.php';

$token = $_POST['token'] ?? '';
$password = $_POST['password'] ?? '';

if (!$token || !$password) {
    die("Datos incompletos");
}

$nuevaPassword = password_hash(
    $password,
    PASSWORD_DEFAULT
);

$stmt = $conn->prepare(
    "UPDATE usuarios
     SET password = ?,
         reset_token = NULL,
         reset_expira = NULL
     WHERE reset_token = ?"
);

$stmt->bind_param(
    "ss",
    $nuevaPassword,
    $token
);

$stmt->execute();

?>

<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Contraseña actualizada</title>

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

        .success-card {

            width: 100%;
            max-width: 500px;

            background: white;

            padding: 40px;

            border-radius: 24px;

            text-align: center;

            box-shadow:
                0 20px 40px
                rgba(0,0,0,.2);

        }

        .icon {

            width: 80px;
            height: 80px;

            margin: 0 auto 20px;

            border-radius: 50%;

            background: #dcfce7;

            display: flex;
            justify-content: center;
            align-items: center;

            font-size: 40px;

        }

        h2 {

            color: #1e293b;

            margin-bottom: 12px;

        }

        p {

            color: #64748b;

            margin-bottom: 25px;

        }

        .btn {

            display: inline-block;

            padding: 14px 24px;

            border-radius: 12px;

            text-decoration: none;

            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #1d4ed8
                );

            color: white;

            font-weight: 600;

            transition: .2s;

        }

        .btn:hover {

            transform: translateY(-2px);

        }

    </style>

</head>

<body>

    <div class="success-card">

        <div class="icon">
            ✅
        </div>

        <h2>
            Contraseña actualizada
        </h2>

        <p>
            Tu contraseña se ha cambiado correctamente.
            Ya puedes iniciar sesión con la nueva contraseña.
        </p>

        <a
            href="../html/login.html"
            class="btn"
        >
            Ir al login
        </a>

    </div>

</body>

</html>