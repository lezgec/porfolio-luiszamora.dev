function calcularIMC() {
    const peso = Number(document.getElementById("peso").value);
    const alturaCm = Number(document.getElementById("altura").value);

    const resultado = document.getElementById("resultado");
    const clasificacion = document.getElementById("clasificacion");

    // Limpiar resultados y colores anteriores.
    resultado.textContent = "";
    resultado.style.color = "";
    clasificacion.textContent = "";
    clasificacion.style.color = "";

    if (
        !Number.isFinite(peso) ||
        !Number.isFinite(alturaCm) ||
        peso <= 0 ||
        alturaCm <= 0
    ) {
        resultado.style.color = "red";
        resultado.textContent =
            "Ingresa un peso y una altura válidos, mayores que cero.";
        return;
    }

    const altura = alturaCm / 100;
    const imc = peso / (altura * altura);

    if (!Number.isFinite(imc) || imc <= 0) {
        resultado.style.color = "red";
        resultado.textContent =
            "No se pudo calcular el IMC. Revisa los valores ingresados.";
        return;
    }

    let texto;
    let color;

    // Comparar el valor completo, sin redondearlo.
    if (imc < 18.5) {
        texto = "Peso Bajo";
        color = "blue";
    } else if (imc < 25) {
        texto = "Peso Normal";
        color = "green";
    } else if (imc < 30) {
        texto = "Sobrepeso";
        color = "#854d0e";
    } else if (imc < 35) {
        texto = "Obesidad Leve";
        color = "#9a3412";
    } else if (imc < 40) {
        texto = "Obesidad Media";
        color = "red";
    } else {
        texto = "Obesidad Mórbida";
        color = "red";
    }

    resultado.textContent =
        `Su índice de masa corporal (IMC) es: ${imc.toFixed(2)}`;

    clasificacion.textContent = texto;
    clasificacion.style.color = color;
}

const formulario = document.getElementById("formulario-imc");

formulario.addEventListener("submit", function (event) {
    event.preventDefault();
    calcularIMC();
});

// Quitar resultados anteriores cuando cambian los datos.
formulario.addEventListener("input", function () {
    for (const id of ["resultado", "clasificacion"]) {
        const elemento = document.getElementById(id);
        elemento.textContent = "";
        elemento.style.color = "";
    }
});