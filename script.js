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

// --- BASE DE DATOS DE INFORMACIÓN DE PRODUCTOS / KITS ---
const datosDetalles = {
    'Kit Supremo': {
        precio: 7.50,
        icono: 'fa-shield-halved',
        colorIcono: '#3a86ff',
        contenido: [
            'Espada de Netherite (Afilado V, Aspecto Ígneo II)',
            'Set Completo de Armadura de Netherite (Protección IV)',
            'Pico de Netherite (Eficiencia V, Fortuna III)',
            '64x Manzanas Doradas Encantadas',
            '32x Perlas de Ender',
            'Acceso al comando /kit supremo (Cooldown: 24h)'
        ]
    },
    'Kit Heroe': {
        precio: 5.50,
        icono: 'fa-shield-halved',
        colorIcono: '#3a86ff',
        contenido: [
            'Espada de Diamante (Afilado IV)',
            'Set Completo de Armadura de Diamante (Protección III)',
            'Pico de Diamante (Eficiencia IV)',
            '32x Manzanas Doradas',
            '16x Perlas de Ender',
            'Acceso al comando /kit heroe (Cooldown: 24h)'
        ]
    },
    'Kit Shinigami': {
        precio: 3.50,
        icono: 'fa-shield-halved',
        colorIcono: '#3a86ff',
        contenido: [
            'Guadaña / Espada de Hierro (Afilado III, Empuje I)',
            'Set Completo de Armadura de Hierro (Protección II)',
            '16x Manzanas Doradas',
            'Efecto permanente de Velocidad I mientras sostienes la espada',
            'Acceso al comando /kit shinigami (Cooldown: 12h)'
        ]
    },
    'Rango VIP': {
        precio: 5.00,
        icono: 'fa-star',
        colorIcono: 'var(--accent-yellow)',
        contenido: [
            'Prefijo [VIP] exclusivo en el chat y Tab',
            'Acceso al comando /fly en parcelas / protecciones',
            'Capacidad de colocar hasta 5 Sethomes',
            'Entrada prioritaria al servidor cuando esté lleno',
            'Kit VIP semanal gratuito'
        ]
    },
    'Proteccion 150X150': {
        precio: 3.50,
        icono: 'fa-shield-halved',
        colorIcono: '#3a86ff',
        contenido: [
            'Bloque de protección especial de 150x150 bloques',
            'Protección completa contra PvP, Explosiones y Griefing',
            'Panel /ps add para agregar amigos a tu zona'
        ]
    }
};

// Variable global para mantener la escena 3D en memoria
let skinViewer = null;

function verDetalles(nombreProducto) {
    const info = datosDetalles[nombreProducto];

    const titulo = document.getElementById('detailsTitle');
    const precio = document.getElementById('detailsPrice');
    const lista = document.getElementById('detailsList');
    const icono = document.getElementById('detailsIcon');
    const btnCompra = document.getElementById('detailsBuyBtn');

    if (titulo) titulo.textContent = nombreProducto;

    if (info) {
        if (precio) precio.textContent = `$${info.precio.toFixed(2)} USD`;
        if (icono) {
            icono.className = `fa-solid ${info.icono}`;
            icono.style.color = info.colorIcono || 'var(--accent-green)';
        }
        
        if (lista) {
            lista.innerHTML = info.contenido
                .map(item => `<li><i class="fa-solid fa-check"></i> ${item}</li>`)
                .join('');
        }

        if (btnCompra) {
            btnCompra.onclick = function() {
                agregarAlCarrito(nombreProducto, info.precio);
                cerrarModalDetalles();
            };
        }
    } else {
        if (precio) precio.textContent = '';
        if (icono) icono.className = 'fa-solid fa-box-open';
        if (lista) lista.innerHTML = '<li><i class="fa-solid fa-info-circle"></i> No hay detalles adicionales registrados para este artículo.</li>';
        if (btnCompra) btnCompra.onclick = null;
    }

    // 1. Mostrar modal
    const modal = document.getElementById('detailsModal');
    if (modal) modal.classList.add('active');

    // 2. Renderizar skin 3D con un pequeño retardo para asegurar dimensiones en pantalla
    setTimeout(() => {
        const canvas = document.getElementById('skin_container');
        const container = document.querySelector('.skin-viewer-container');
        if (!canvas || !container) return;

        const ancho = container.clientWidth || 240;
        const alto = container.clientHeight || 280;

        if (typeof skinview3d === 'undefined') {
            console.error('La librería skinview3d no está cargada correctamente.');
            return;
        }

        if (!skinViewer) {
            skinViewer = new skinview3d.SkinViewer({
                canvas: canvas,
                width: ancho,
                height: alto,
                skin: `https://mc-heads.net/skin/${currentUsername}`
            });

            if (skinview3d.WalkingAnimation) {
                skinViewer.animations.add(skinview3d.WalkingAnimation);
            }
            skinViewer.autoRotate = true;
            skinViewer.autoRotateSpeed = 0.8;
        } else {
            skinViewer.setSize(ancho, alto);
            skinViewer.loadSkin(`https://mc-heads.net/skin/${currentUsername}`);
        }
    }, 100);
}

function cerrarModalDetalles() {
    const modal = document.getElementById('detailsModal');
    if (modal) modal.classList.remove('active');
}

// Cerrar modal al hacer clic fuera de la tarjeta
const detailsModalElem = document.getElementById('detailsModal');
if (detailsModalElem) {
    detailsModalElem.addEventListener('click', (e) => {
        if (e.target.id === 'detailsModal') cerrarModalDetalles();
    });
}

// --- DATOS DE LOS SLIDES DESTACADOS ---
const slidesData = [
    {
        titulo: "Kit Supremo",
        precio: "7.50 USD",
        precioNum: 7.50,
        skin: "https://mc-heads.net/body/Steve/150",
        categoriaTab: "kits",
        nombreProducto: "Kit Supremo"
    },
    {
        titulo: "RANGO VIP PERMANENTE",
        precio: "5.00 USD",
        precioNum: 5.00,
        skin: "https://mc-heads.net/body/TheDIABLO20/150",
        categoriaTab: "rangos",
        nombreProducto: "Rango VIP"
    },
    {
        titulo: "PROTECCIÓN SURVIVAL 500x500",
        precio: "10.00 USD",
        precioNum: 10.00,
        skin: "https://minecraft.wiki/images/Block_of_Netherite_JE1_BE1.png",
        categoriaTab: "protecciones",
        nombreProducto: "Proteccion 500X500"
    },
    {
        titulo: "Kit Shinigami",
        precio: "3.50 USD",
        precioNum: 3.50,
        skin: "https://mc-heads.net/body/Alex/150",
        categoriaTab: "kits",
        nombreProducto: "Kit Shinigami"
    }
];

let slideIndexActual = 0;
let sliderInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    inicializarSlider();
});

function inicializarSlider() {
    const prevBtn = document.querySelector(".prev-arrow");
    const nextBtn = document.querySelector(".next-arrow");
    const dots = document.querySelectorAll(".slider-dots .dot");
    const btnDetails = document.querySelector(".btn-details");
    const btnRelated = document.querySelector(".btn-related");

    // Eventos de flechas
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            slideIndexActual = (slideIndexActual - 1 + slidesData.length) % slidesData.length;
            mostrarSlide(slideIndexActual);
            reiniciarAutoPlay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            slideIndexActual = (slideIndexActual + 1) % slidesData.length;
            mostrarSlide(slideIndexActual);
            reiniciarAutoPlay();
        });
    }

    // Eventos de los puntos (dots)
    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            slideIndexActual = index;
            mostrarSlide(slideIndexActual);
            reiniciarAutoPlay();
        });
    });

    // Botón "Ver más detalles"
    if (btnDetails) {
        btnDetails.addEventListener("click", () => {
            const currentItem = slidesData[slideIndexActual];
            if (typeof verDetalles === "function") {
                verDetalles(currentItem.nombreProducto);
            } else {
                alert(`Detalles de: ${currentItem.titulo}`);
            }
        });
    }

    // Botón "Ver artículos parecidos"
    if (btnRelated) {
        btnRelated.addEventListener("click", () => {
            const currentItem = slidesData[slideIndexActual];
            const targetBtn = document.querySelector(`.btn-${currentItem.categoriaTab}`);
            if (typeof showTab === "function") {
                showTab(currentItem.categoriaTab, targetBtn);
            }
        });
    }

    // Iniciar temporizador automático cada 5 segundos
    iniciarAutoPlay();
}

function mostrarSlide(index) {
    const bannerContent = document.querySelector(".banner-content");
    const titleEl = document.querySelector(".banner-title");
    const priceEl = document.querySelector(".banner-price");
    const imgEl = document.querySelector(".banner-character img");
    const dots = document.querySelectorAll(".slider-dots .dot");

    if (!bannerContent) return;

    // Transición de salida
    bannerContent.classList.add("changing");

    setTimeout(() => {
        const data = slidesData[index];
        if (titleEl) titleEl.innerText = data.titulo;
        if (priceEl) priceEl.innerText = data.precio;
        if (imgEl) imgEl.src = data.skin;

        // Actualizar dots
        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === index);
        });

        // Transición de entrada
        bannerContent.classList.remove("changing");
    }, 200);
}

function iniciarAutoPlay() {
    sliderInterval = setInterval(() => {
        slideIndexActual = (slideIndexActual + 1) % slidesData.length;
        mostrarSlide(slideIndexActual);
    }, 5000);
}

function reiniciarAutoPlay() {
    clearInterval(sliderInterval);
    iniciarAutoPlay();
}
