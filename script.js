// ===== Datos del negocio =====
const TARIFA_IMPUESTO = 0.08;

const productos = [
    { id: 1, nombre: "La Sur", descripcion: "Carne a la parrilla en pan de ajonjolí, con queso derretido, tocineta, lechuga rallada, tomate, cebolla morada, jalapeños, guacamole, cilantro y salsa de mostaza.", precio: 28000 },
    { id: 2, nombre: "La Norte", descripcion: "Carne a la parrilla en pan brioche con ajonjolí, queso derretido, tocineta, lechuga y rúcula, tomate, cebolla morada, jalapeños, guacamole, cilantro y salsa cremosa.", precio: 30000 },
];

let pedido = [];
let ultimoPedido = [];

// ===== Lógica del carrito =====
function formatearPrecio(valor) {
    return "$" + valor.toLocaleString("es-CO");
}

function buscarProducto(id) {
    return productos.find((producto) => producto.id === id);
}

function buscarProductoPorNombre(nombre) {
    return productos.find((producto) => producto.nombre === nombre);
}

function buscarLinea(id) {
    return pedido.find((linea) => linea.producto.id === id);
}

function agregarAlPedido(id) {
    const linea = buscarLinea(id);

    if (linea) {
        linea.cantidad++;
    } else {
        pedido.push({ producto: buscarProducto(id), cantidad: 1 });
    }
}

function quitarDelPedido(id) {
    pedido = pedido.filter((linea) => linea.producto.id !== id);
}

function restarDelPedido(id) {
    const linea = buscarLinea(id);
    linea.cantidad--;

    if (linea.cantidad === 0) {
        quitarDelPedido(id);
    }
}

function calcularSubtotal() {
    let subtotal = 0;
    for (const linea of pedido) {
        subtotal += linea.producto.precio * linea.cantidad;
    }
    return subtotal;
}

function calcularImpuesto() {
    return calcularSubtotal() * TARIFA_IMPUESTO;
}

function calcularTotal() {
    return calcularSubtotal() + calcularImpuesto();
}

function resumirPedido(lineas) {
    const resumen = [];
    for (const linea of lineas) {
        resumen.push({ id: linea.producto.id, cantidad: linea.cantidad });
    }
    return resumen;
}

function reconstruirPedido(resumen) {
    const lineas = [];
    for (const item of resumen) {
        const producto = buscarProducto(item.id);
        if (producto && item.cantidad > 0) {
            lineas.push({ producto: producto, cantidad: item.cantidad });
        }
    }
    return lineas;
}

// ===== Memoria del navegador =====
const CLAVE_PEDIDO = "culpa-capital-pedido";
const CLAVE_ULTIMO_PEDIDO = "culpa-capital-ultimo-pedido";

function guardar(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
}

function leer(clave, valorPorDefecto) {
    const texto = localStorage.getItem(clave);

    if (texto === null) {
        return valorPorDefecto;
    }

    try {
        return JSON.parse(texto);
    } catch (error) {
        console.warn("Dato dañado en", clave, "· se usa el valor por defecto");
        return valorPorDefecto;
    }
}

function guardarEstado() {
    guardar(CLAVE_PEDIDO, resumirPedido(pedido));
    guardar(CLAVE_ULTIMO_PEDIDO, ultimoPedido);
}

function cargarEstado() {
    pedido = reconstruirPedido(leer(CLAVE_PEDIDO, []));
    ultimoPedido = leer(CLAVE_ULTIMO_PEDIDO, []);
}

// ===== Elementos de la página =====
const menu = document.querySelector("#menu");
const listaPedido = document.querySelector("#lista-pedido");
const subtotalPedido = document.querySelector("#subtotal");
const impuestoPedido = document.querySelector("#impuesto");
const totalPedido = document.querySelector("#total");
const botonRepetir = document.querySelector("#repetir");
const botonVaciar = document.querySelector("#vaciar");
const botonComprar = document.querySelector("#comprar");

// ===== Pintar en pantalla =====
function mostrarCarta() {
    let html = "";

    for (const producto of productos) {
        html += `
            <article class="py-3 border-bottom">
                <h3 class="h5 mb-1">${producto.nombre}</h3>
                <p class="text-secondary mb-2">${producto.descripcion}</p>
                <div class="d-flex align-items-center gap-3">
                    <span class="fw-bold text-danger">${formatearPrecio(producto.precio)}</span>
                    <button type="button" class="btn btn-sm btn-outline-danger rounded-pill" data-accion="agregar" data-id="${producto.id}">Agregar</button>
                </div>
            </article>`;
    }

    menu.innerHTML = html;
}

function mostrarPedido() {
    let html = "";

    for (const linea of pedido) {
        html += `
            <li class="py-3 border-bottom">
                <div class="d-flex justify-content-between gap-3 mb-2">
                    <span class="fw-semibold">${linea.producto.nombre}</span>
                    <span class="fw-bold">${formatearPrecio(linea.producto.precio * linea.cantidad)}</span>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <div class="d-inline-flex align-items-center bg-white border rounded-pill">
                        <button type="button" class="btn btn-sm border-0 px-3" data-accion="restar" data-id="${linea.producto.id}" aria-label="Quitar uno">−</button>
                        <span class="px-1 fw-semibold">${linea.cantidad}</span>
                        <button type="button" class="btn btn-sm border-0 px-3" data-accion="sumar" data-id="${linea.producto.id}" aria-label="Agregar uno">+</button>
                    </div>
                    <button type="button" class="btn btn-link btn-sm text-secondary p-0 text-decoration-underline" data-accion="quitar" data-id="${linea.producto.id}">Quitar</button>
                </div>
            </li>`;
    }

    if (pedido.length === 0) {
        html = `<li class="text-secondary py-3 mb-0">Tu pedido está vacío. Agrega algo de la carta.</li>`;
    }

    listaPedido.innerHTML = html;
    subtotalPedido.textContent = formatearPrecio(calcularSubtotal());
    impuestoPedido.textContent = formatearPrecio(calcularImpuesto());
    totalPedido.textContent = formatearPrecio(calcularTotal());
    botonRepetir.hidden = ultimoPedido.length === 0;
    botonVaciar.hidden = pedido.length === 0;
}

// ===== Eventos =====
menu.addEventListener("click", function (evento) {
    const accion = evento.target.dataset.accion;
    const id = Number(evento.target.dataset.id);

    if (accion === "agregar") {
        agregarAlPedido(id);
        mostrarPedido();
    }

    guardarEstado();
});

listaPedido.addEventListener("click", function (evento) {
    const accion = evento.target.dataset.accion;
    const id = Number(evento.target.dataset.id);

    if (accion === "sumar") {
        agregarAlPedido(id);
    }
    if (accion === "restar") {
        restarDelPedido(id);
    }
    if (accion === "quitar") {
        quitarDelPedido(id);
    }

    guardarEstado();
    mostrarPedido();
});

for (const boton of document.querySelectorAll(".boton-carrito")) {
    boton.addEventListener("click", function () {
        const producto = buscarProductoPorNombre(boton.dataset.nombre);

        if (producto) {
            agregarAlPedido(producto.id);
            guardarEstado();
            mostrarPedido();
        }
    });
}

botonVaciar.addEventListener("click", function () {
    if (pedido.length === 0) {
        return;
    }

    const seguro = confirm("¿Seguro que quieres vaciar tu pedido?");

    if (seguro) {
        pedido = [];
        guardarEstado();
        mostrarPedido();
    }
});

botonComprar.addEventListener("click", function () {
    if (pedido.length === 0) {
        alert("Tu pedido está vacío. Agrega algo de la carta.");
        return;
    }

    let lineas = "";
    for (const linea of pedido) {
        lineas += `- ${linea.cantidad} x ${linea.producto.nombre}: ${formatearPrecio(linea.producto.precio * linea.cantidad)}\n`;
    }

    const seguro = confirm(`Resumen del pedido:\n${lineas}\nSubtotal: ${formatearPrecio(calcularSubtotal())}\nImpuesto (8%): ${formatearPrecio(calcularImpuesto())}\nTotal: ${formatearPrecio(calcularTotal())}\n\n¿Confirmas la compra?`);

    if (!seguro) {
        return;
    }

    ultimoPedido = resumirPedido(pedido);
    alert(`¡Gracias por tu compra!\nTotal pagado: ${formatearPrecio(calcularTotal())}`);

    pedido = [];
    guardarEstado();
    mostrarPedido();
});

botonRepetir.addEventListener("click", function () {
    if (pedido.length > 0) {
        const reemplazar = confirm("Tu último pedido va a reemplazar lo que tienes ahora en Mi pedido. ¿Continuamos?");

        if (!reemplazar) {
            return;
        }
    }

    pedido = reconstruirPedido(ultimoPedido);
    guardarEstado();
    mostrarPedido();
});

// ===== Arranque =====
cargarEstado();
mostrarCarta();
mostrarPedido();
