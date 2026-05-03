const API_PAGOS = "../php/pagos.php";

document.getElementById("btnPagar").onclick = async () => {

  const receptor = prompt("ID del usuario al que pagas:");
  const importe = prompt("Cantidad:");

  if (!receptor || !importe) return;

  const fd = new FormData();
  fd.append("accion", "crear");
  fd.append("receptor", receptor);
  fd.append("importe", importe);

  await fetch(API_PAGOS, {
    method: "POST",
    body: fd,
    credentials: "same-origin"
  });

  cargarBalance();
};