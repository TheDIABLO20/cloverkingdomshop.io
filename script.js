        // --- GESTIÓN DE USUARIO Y SKIN ---
        let currentUsername = localStorage.getItem('mc_username') || 'JugadorMinecraft';

        function actualizarInterfazUsuario() {
            document.getElementById('playerUsername').textContent = currentUsername;
            document.getElementById('usernameInput').value = currentUsername;
            
            // Usamos mc-heads.net que responde más rápido y es más estable
            document.getElementById('playerSkin').src = `https://mc-heads.net/avatar/${currentUsername}/48`;
        }

        function abrirModalUsuario() {
            document.getElementById('userModal').classList.add('active');
        }

        function guardarUsuario() {
            const input = document.getElementById('usernameInput').value.trim();
            if (input !== "") {
                currentUsername = input;
                localStorage.setItem('mc_username', currentUsername);
                actualizarInterfazUsuario();
                document.getElementById('userModal').classList.remove('active');
            }
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

        cartToggle.addEventListener('click', (e) => {
            if (!cartDropdown.contains(e.target)) {
                cartDropdown.classList.toggle('active');
            }
        });

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

        function procesarCompra() {
            if (carrito.length === 0) {
                alert('Tu cesta está vacía.');
                return;
            }
            alert(`Procesando pago para el usuario: ${currentUsername}\nTotal: ${document.getElementById('cartTotal').textContent}`);
        }

        // Abrir modal al hacer clic en VER CESTA
document.querySelector('.cart-box').addEventListener('click', () => {
    document.getElementById('cartModal').style.display = 'flex';
});

// Cerrar modal
document.getElementById('closeCart').addEventListener('click', () => {
    document.getElementById('cartModal').style.display = 'none';
});

// Manejar clic en Proceder al Pago
document.getElementById('btnProceedPayment').addEventListener('click', () => {
    const nick = document.getElementById('playerNick').value.trim();
    const metodo = document.querySelector('input[name="payment"]:checked').value;

    if (!nick) {
        alert('Por favor ingresa tu nombre de usuario del juego.');
        return;
    }

    // Aquí conectas con la pasarela real (PayPal SDK, Tebex API, Stripe, etc.)
    alert(`Iniciando pago con ${metodo.toUpperCase()} para el usuario: ${nick}`);
});
