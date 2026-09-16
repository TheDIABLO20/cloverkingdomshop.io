// --- GESTIÓN DE USUARIO Y SKIN ---
let currentUsername = localStorage.getItem('mc_username') || 'JugadorMinecraft';

function actualizarInterfazUsuario() {
    document.getElementById('playerUsername').textContent = currentUsername;
    document.getElementById('usernameInput').value = currentUsername;
    
    // Usamos mc-heads.net para cargar la skin del jugador
    document.getElementById('playerSkin').src = `https://mc-heads.net/avatar/${currentUsername}/48`;
}

function abrirModalUsuario() {
    document.getElementById('userModal').classList.add('active');
}

function cerrarModalUsuario() {
    document.getElementById('userModal').classList.remove('active');
}

function guardarUsuario() {
    const input = document.getElementById('usernameInput').value.trim();
    if (input !== "") {
        currentUsername = input;
        localStorage.setItem('mc_username', currentUsername);
        actualizarInterfazUsuario();
        cerrarModalUsuario();
    }
}

// Cerrar modal de usuario al hacer clic en el fondo oscuro
document.getElementById('userModal').addEventListener('click', (e) => {
    if (e.target.id === 'userModal') {
        cerrarModalUsuario();
    }
});

actualizarInterfazUsuario();

// --- SISTEMA DE NAVEGACIÓN ---
function showTab(tabId, buttonElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    buttonElement.classList.add('active');
}

// --- SISTEMA DE CESTA ---
let carrito = [];

const cartToggle = document.getElementById('cartToggle');
const cartDropdown = document.getElementById('cartDropdown');

// ABRIR / CERRAR EL MENÚ FLOTANTE AL PRESIONAR LA CESTA SUPERIOR
cartToggle.addEventListener('click', (e) => {
    if (!cartDropdown.contains(e.target)) {
        cartDropdown.classList.toggle('active');
    }
});

function cerrarCestaDropdown() {
    cartDropdown.classList.remove('active');
}

function agregarAlCarrito(nombre, precio) {
    const itemExistente = carrito.find(item => item.nombre === nombre);
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ nombre, precio, cantidad: 1 });
    }
    actualizarCarrito();
    cartDropdown.classList.add('active');
}

function cambiarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) carrito.splice(index, 1);
    actualizarCarrito();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

function actualizarCarrito() {
    const container = document.getElementById('cartItemsContainer');
    const cartCount = document.getElementById('cartCount');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTotal = document.getElementById('cartTotal');

    container.innerHTML = '';
    let total = 0;
    let cantidadTotal = 0;

    if (carrito.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">La cesta está vacía.</p>';
    } else {
        carrito.forEach((item, index) => {
            total += item.precio * item.cantidad;
            cantidadTotal += item.cantidad;

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p>$${(item.precio * item.cantidad).toFixed(2)} USD</p>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-qty" onclick="cambiarCantidad(${index}, -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-qty" onclick="cambiarCantidad(${index}, 1)">+</button>
                    <button class="btn-delete" onclick="eliminarDelCarrito(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }

    cartCount.textContent = cantidadTotal;
    cartSubtotal.textContent = `$${total.toFixed(2)} USD`;
    cartTotal.textContent = `$${total.toFixed(2)} USD`;
}

// PROCESAR COMPRA: MUESTRA EL MODAL Y RENDERIZA LOS BOTONES IN-SITE
function procesarCompra() {
    if (carrito.length === 0) {
        alert('La cesta está vacía.');
        return;
    }
    
    // Ocultar el desplegable superior
    cerrarCestaDropdown();
    
    // Sincronizar usuario
    const playerNickInput = document.getElementById('playerNick');
    if (playerNickInput) {
        playerNickInput.value = currentUsername;
    }

    // Actualizar total modal
    const total = document.getElementById('cartTotal').textContent;
    document.getElementById('cartTotalModal').textContent = total;

    // Mostrar el modal de cobro
    document.getElementById('cartModal').style.display = 'flex';

    // Cargar SDK / Botones de PayPal
    renderizarPaypal();
}

// CERRAR MODAL GRANDE DE PAGO
document.getElementById('closeCart').addEventListener('click', () => {
    document.getElementById('cartModal').style.display = 'none';
});

// RENDERIZADO DE BOTONES OFICIALES DE PAYPAL
function renderizarPaypal() {
    const container = document.getElementById('paypal-button-container');
    container.innerHTML = ''; 

    if (typeof paypal === 'undefined') {
        container.innerHTML = '<p style="color: var(--accent-red); font-size: 0.85rem; text-align: center;">Error al conectar con PayPal. Revisa la consola o la validez de tu Client ID en el panel de PayPal Developer.</p>';
        return;
    }

    paypal.Buttons({
        style: {
            layout: 'vertical',
            color:  'gold',
            shape:  'rect',
            label:  'pay'
        },
        createOrder: function(data, actions) {
            const totalMonto = document.getElementById('cartTotalModal').textContent.replace('$', '').replace(' USD', '');
            const nick = document.getElementById('playerNick').value.trim();

            if (!nick) {
                alert('Por favor ingresa tu nombre de usuario del juego.');
                return actions.reject();
            }

            return actions.order.create({
                purchase_units: [{
                    description: `Compra CloverKingdom - ${nick}`,
                    amount: {
                        value: totalMonto
                    }
                }]
            });
        },
        onApprove: function(data, actions) {
            const nick = document.getElementById('playerNick').value.trim();

            return fetch('http://localhost:3000/api/paypal/capture-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderID: data.orderID,
                    playerNick: nick,
                    carrito: carrito
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    alert(`¡Gracias por tu compra, ${nick}! Tu ítem/rango ha sido entregado.`);
                    carrito = [];
                    actualizarCarrito();
                    document.getElementById('cartModal').style.display = 'none';
                } else {
                    alert('Hubo un problema confirmando el pago.');
                }
            })
            .catch(err => {
                console.error(err);
                alert('Error al conectar con el servidor backend.');
            });
        },
        onError: function(err) {
            console.error(err);
            alert('Ocurrió un error al procesar la transacción.');
        }
    }).render('#paypal-button-container');
}
