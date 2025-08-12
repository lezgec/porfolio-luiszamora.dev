function calcularIMC() {
    const peso = parseFloat(document.getElementById("peso").value);
    const altura = parseFloat(document.getElementById("altura").value)/100;

    if (!peso || !altura) {
        document.getElementById("resultado").style.color = "red";
        document.getElementById("resultado").innerText = "Por favor, complete los campos.";
        return;
    }

    const imc = (peso / (altura * altura)).toFixed(2);
    let clasificacion = "";

    if (imc < 18.5) {
        clasificacion = "Peso Bajo";
        document.getElementById("clasificacion").style.color = "blue";
    } else if (imc < 25) {
        clasificacion = "Peso Normal";
        document.getElementById("clasificacion").style.color = "green";
    } else if (imc < 30) {
        clasificacion = "Sobrepeso";
        document.getElementById("clasificacion").style.color = "yellow";
    } else if (imc < 35) {
        clasificacion = "Obesidad Leve";
        document.getElementById("clasificacion").style.color = "orange";
    } else if (imc < 40) {
        clasificacion = "Obesidad Media";
        document.getElementById("clasificacion").style.color = "red";
    } else (imc < 45) 
        clasificacion = "Obesidad Mórbida";
        document.getElementById("clasificacion").style.color = "red";
    

    document.getElementById("resultado").innerText = `Su índice de Masa Corporal(IMC) es de:  ${imc} `;
    document.getElementById("clasificacion").innerText = `${clasificacion} `;
}
