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

function cerrarModalDetalles() {
    document.getElementById('detailsModal').classList.remove('active');
}

// Cerrar modal al hacer clic fuera de la tarjeta
const detailsModalElem = document.getElementById('detailsModal');
if (detailsModalElem) {
    detailsModalElem.addEventListener('click', (e) => {
        if (e.target.id === 'detailsModal') cerrarModalDetalles();
    });
}

        // 1. OBTENER JUGADORES ONLINE DE MINECRAFT
        const mcIP = '127.0.0.1:25565'; 

        fetch(`https://api.mcsrvstat.us/2/${mcIP}`)
            .then(response => response.json())
            .then(data => {
                const mcElement = document.getElementById('mc-online');
                if (data.online) {
                    const players = data.players.online.toLocaleString();
                    mcElement.textContent = `${players} USUARIOS CONECTADOS`;
                } else {
                    mcElement.textContent = 'SERVIDOR OFFLINE';
                }
            })
            .catch(error => {
                console.error('Error al obtener datos de Minecraft:', error);
                document.getElementById('mc-online').textContent = '0 USUARIOS CONECTADOS';
            });

        // 2. OBTENER MIEMBROS ONLINE DE DISCORD
        const discordID = '1543695731783766106'; 

        fetch(`https://discord.com/api/guilds/${discordID}/widget.json`)
            .then(response => response.json())
            .then(data => {
                const discordElement = document.getElementById('discord-online');
                if (data.presence_count !== undefined) {
                    const members = data.presence_count.toLocaleString();
                    discordElement.textContent = `${members} USUARIOS CONECTADOS`;
                } else {
                    discordElement.textContent = '0 USUARIOS CONECTADOS';
                }
            })
            .catch(error => {
                console.error('Error al obtener datos de Discord:', error);
                document.getElementById('discord-online').textContent = '0 USUARIOS CONECTADOS';
            });
