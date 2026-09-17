// --- GESTIÓN DE USUARIO Y SKIN ---
let currentUsername = localStorage.getItem('mc_username') || 'JugadorMinecraft';

function actualizarInterfazUsuario() {
    const playerUsernameElem = document.getElementById('playerUsername');
    const usernameInputElem = document.getElementById('usernameInput');
    const playerSkinElem = document.getElementById('playerSkin');

    if (playerUsernameElem) playerUsernameElem.textContent = currentUsername;
    if (usernameInputElem) usernameInputElem.value = currentUsername;
    if (playerSkinElem) playerSkinElem.src = `https://mc-heads.net/avatar/${currentUsername}/48`;
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

const userModalElem = document.getElementById('userModal');
if (userModalElem) {
    userModalElem.addEventListener('click', (e) => {
        if (e.target.id === 'userModal') cerrarModalUsuario();
    });
}

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

if (cartToggle && cartDropdown) {
    cartToggle.addEventListener('click', (e) => {
        if (!cartDropdown.contains(e.target)) {
            cartDropdown.classList.toggle('active');
        }
    });
}

function cerrarCestaDropdown() {
    if (cartDropdown) cartDropdown.classList.remove('active');
}

function agregarAlCarrito(nombre, precio) {
    const itemExistente = carrito.find(item => item.nombre === nombre);
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ nombre, precio, cantidad: 1 });
    }
    actualizarCarrito();
    if (cartDropdown) cartDropdown.classList.add('active');
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

    if (!container) return;
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

    if (cartCount) cartCount.textContent = cantidadTotal;
    if (cartSubtotal) cartSubtotal.textContent = `$${total.toFixed(2)} USD`;
    if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)} USD`;
}

// PROCESAR COMPRA: MUESTRA EL MODAL Y RENDERIZA PAYPAL
function procesarCompra() {
    if (carrito.length === 0) {
        alert('La cesta está vacía.');
        return;
    }
    
    cerrarCestaDropdown();
    
    const playerNickInput = document.getElementById('playerNick');
    if (playerNickInput) playerNickInput.value = currentUsername;

    const total = document.getElementById('cartTotal').textContent;
    document.getElementById('cartTotalModal').textContent = total;

    document.getElementById('cartModal').style.display = 'flex';
    renderizarPaypal();
}

const closeCartBtn = document.getElementById('closeCart');
if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
        document.getElementById('cartModal').style.display = 'none';
    });
}

// RENDERIZADO DE BOTONES OFICIALES DE PAYPAL
function renderizarPaypal() {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    container.innerHTML = ''; 

    if (typeof paypal === 'undefined') {
        container.innerHTML = '<p style="color: var(--accent-red); font-size: 0.85rem; text-align: center;">Error al conectar con PayPal.</p>';
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
                    amount: { value: totalMonto }
                }]
            });
        },
        onApprove: function(data, actions) {
            const nick = document.getElementById('playerNick').value.trim();

            return fetch('http://localhost:3000/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderID: data.orderID,
                    playerNick: nick,
                    carrito: carrito
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    alert(`¡Gracias por tu compra, ${nick}! Tu producto ha sido entregado.`);
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

// --- LÓGICA DEL BOTÓN SIMULAR PAGO ---
document.addEventListener('DOMContentLoaded', () => {
    const btnSimular = document.getElementById('btn-simular-pago');
    if (btnSimular) {
        btnSimular.addEventListener('click', async function() {
            const nick = document.getElementById('playerNick').value.trim();

            if (!nick) {
                alert('Por favor ingresa tu nombre de usuario de Minecraft.');
                return;
            }

            if (!carrito || carrito.length === 0) {
                alert('Tu carrito está vacío.');
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/test/simulate-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerNick: nick,
                        carrito: carrito
                    })
                });

                const data = await response.json();

                if (response.ok && data.status === 'COMPLETED') {
                    alert(`¡Compra simulada con éxito para ${nick}! Revisa tu consola de Node.js y Minecraft.`);
                    carrito = [];
                    actualizarCarrito();
                    document.getElementById('cartModal').style.display = 'none';
                } else {
                    alert('Error en la simulación: ' + (data.message || 'Error desconocido'));
                }
            } catch (error) {
                console.error('Error al conectar:', error);
                alert('No se pudo conectar con el servidor backend. Asegúrate de tener corriendo node server.js');
            }
        });
    }
});

