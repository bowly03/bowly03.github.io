// app.js - Funcionalidades principales de NWCL

// Función para generar RUT chileno válido
function generarRUT() {
    const rutBase = Math.floor(Math.random() * 99999999) + 10000000; // Número base
    let suma = 0;
    let multiplicador = 2;
    let rutString = rutBase.toString();
    for (let i = rutString.length - 1; i >= 0; i--) {
        suma += parseInt(rutString[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    const dv = 11 - (suma % 11);
    const digitoVerificador = dv === 11 ? 0 : dv === 10 ? 'K' : dv;
    return `${rutBase}-${digitoVerificador}`;
}

// Manejar formulario de registro civil
if (document.getElementById('registroCivilForm')) {
    document.getElementById('registroCivilForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const tipo = document.getElementById('tipoDNI').value;
        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const fechaNacimiento = document.getElementById('fecha_nacimiento').value;
        const genero = document.getElementById('genero').value;
        const nacionalidad = document.getElementById('nacionalidad').value;
        const rut = generarRUT();

        const ciudadano = { tipo, nombre, apellido, fechaNacimiento, rut, genero, nacionalidad };
        let ciudadanos = JSON.parse(localStorage.getItem('ciudadanos')) || [];
        
        // Verificar límite: máximo 1 principal y 1 secundario
        const principales = ciudadanos.filter(c => c.tipo === 'principal');
        const secundarios = ciudadanos.filter(c => c.tipo === 'secundario');
        
        if (tipo === 'principal' && principales.length >= 1) {
            alert('Ya tienes un DNI principal registrado.');
            return;
        }
        if (tipo === 'secundario' && secundarios.length >= 1) {
            alert('Ya tienes un DNI secundario registrado.');
            return;
        }
        
        ciudadanos.push(ciudadano);
        localStorage.setItem('ciudadanos', JSON.stringify(ciudadanos));
        addLog('Registro', `Nuevo ciudadano ${tipo} registrado: ${nombre} ${apellido} - RUT: ${rut}`);

        alert(`Registro exitoso. Tu RUT generado es: ${rut}`);
        this.reset();
    });
}

// Función para agregar logs
function addLog(action, details) {
    const logs = JSON.parse(localStorage.getItem('logs')) || [];
    logs.push({ timestamp: new Date().toISOString(), action, details });
    localStorage.setItem('logs', JSON.stringify(logs));
}

// Modificar handleForm para agregar logs
function handleForm(formId, storageKey, fields) {
    if (document.getElementById(formId)) {
        document.getElementById(formId).addEventListener('submit', function(e) {
            e.preventDefault();
            const data = {};
            fields.forEach(field => {
                const element = document.getElementById(field);
                if (element) {
                    data[field] = element.type === 'checkbox' ? element.checked : element.value;
                }
            });
            let items = JSON.parse(localStorage.getItem(storageKey)) || [];
            items.push(data);
            localStorage.setItem(storageKey, JSON.stringify(items));
            addLog('Registro', `Nuevo ${storageKey.slice(0, -1)} registrado: ${JSON.stringify(data)}`);
            alert('Registro exitoso.');
            this.reset();
        });
    }
}

handleForm('registroArmaForm', 'armas', ['propietario', 'rut', 'tipo_arma', 'marca', 'modelo', 'calibre']);
handleForm('registroVehicularForm', 'vehiculos', ['propietario', 'rut', 'marca', 'modelo', 'color', 'anio', 'patente']);
handleForm('registroPropiedadForm', 'propiedades', ['propietario', 'rut', 'direccion', 'tipo_propiedad', 'valor']);
handleForm('registroEmpresaForm', 'empresas', ['nombre_empresa', 'rut_empresa', 'direccion', 'telefono', 'email']);
handleForm('cargosForm', 'cargos', ['cargo', 'rut', 'fecha', 'articulo', 'descripcion', 'arresto', 'multa', 'trabajo_comunitario']);

// Control de acceso basado en roles
function checkAccess() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const role = user.role;
    const currentPage = window.location.pathname.split('/').pop();

    if (role === 'civil' && !['registrocivil.html', 'index.html', 'login.html'].includes(currentPage)) {
        alert('Acceso denegado. Solo puedes acceder al registro civil.');
        window.location.href = 'registrocivil.html';
    } else if (role === 'fiscalia' && !['fiscalia.html', 'index.html', 'login.html', 'antecedentes.html', 'cargos.html', 'registrovehicular.html', 'registroarma.html', 'registropropiedad.html', 'registroempresa.html', 'mdt.html'].includes(currentPage)) {
        alert('Acceso denegado.');
        window.location.href = 'fiscalia.html';
    } // Admins tienen acceso a todo
}

// Ejecutar checkAccess en páginas protegidas
if (!['index.html', 'login.html'].includes(window.location.pathname.split('/').pop())) {
    checkAccess();
}

// Configuración de Discord OAuth (reemplaza con tus valores)
const CLIENT_ID = '1467707858119295006'; // Obtén de Discord Developer Portal
const REDIRECT_URI = 'http://localhost:8000/callback.html'; // Cambia a tu dominio
const SCOPE = 'identify guilds';

// Función para iniciar login con Discord
function discordLogin() {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPE}`;
    window.location.href = authUrl;
}

// Manejar callback
if (window.location.pathname.includes('callback.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        // En un backend real, intercambiar code por token
        // Aquí simulamos
        fetch(`https://discord.com/api/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: 'TU_CLIENT_SECRET_AQUI', // No pongas esto en frontend!
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                // Obtener user info
                return fetch('https://discord.com/api/users/@me', {
                    headers: {
                        Authorization: `Bearer ${data.access_token}`,
                    },
                });
            } else {
                throw new Error('No token');
            }
        })
        .then(response => response.json())
        .then(user => {
            // Simular roles basados en user ID (en producción, verifica guild roles)
            let role = 'civil'; // Default
            if (user.id === 'ADMIN_ID_AQUI') role = 'admin'; // Reemplaza con IDs reales
            // Agrega más checks para roles

            const userData = { id: user.id, username: user.username, role };
            localStorage.setItem('user', JSON.stringify(userData));
            document.getElementById('status').innerText = `Bienvenido ${user.username}. Redirigiendo...`;
            setTimeout(() => window.location.href = 'index.html', 2000);
        })
        .catch(error => {
            document.getElementById('status').innerText = 'Error en login. Intenta de nuevo.';
            console.error(error);
        });
    } else {
        document.getElementById('status').innerText = 'Código no encontrado.';
    }
}

// Asignar evento al botón
if (document.getElementById('discordLogin')) {
    document.getElementById('discordLogin').addEventListener('click', discordLogin);
}

// Llamar a discordLogin si estamos en callback
if (window.location.pathname.includes('callback.html')) {
    discordLogin();
}

// Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Mostrar datos en admin con tablas editables
if (window.location.pathname.includes('admin.html')) {
    const ciudadanos = JSON.parse(localStorage.getItem('ciudadanos')) || [];
    const armas = JSON.parse(localStorage.getItem('armas')) || [];
    const vehiculos = JSON.parse(localStorage.getItem('vehiculos')) || [];
    const propiedades = JSON.parse(localStorage.getItem('propiedades')) || [];
    const empresas = JSON.parse(localStorage.getItem('empresas')) || [];
    const cargos = JSON.parse(localStorage.getItem('cargos')) || [];
    const logs = JSON.parse(localStorage.getItem('logs')) || [];
    const adminContent = document.getElementById('adminContent');
    
    function renderTable(title, items, keys, storageKey) {
        return `
            <h2>${title}</h2>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <thead>
                    <tr style="background:rgba(255,255,255,0.2);">
                        ${keys.map(k => `<th style="padding:10px; border:1px solid #fff;">${k}</th>`).join('')}
                        <th style="padding:10px; border:1px solid #fff;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, index) => `
                        <tr>
                            ${keys.map(k => `<td style="padding:10px; border:1px solid #fff;">${item[k] || ''}</td>`).join('')}
                            <td style="padding:10px; border:1px solid #fff;">
                                <button onclick="editItem('${storageKey}', ${index})">Editar</button>
                                <button onclick="deleteItem('${storageKey}', ${index})">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    if (adminContent) {
        adminContent.innerHTML = `
            ${renderTable('Ciudadanos', ciudadanos, ['tipo', 'nombre', 'apellido', 'rut', 'genero'], 'ciudadanos')}
            ${renderTable('Armas', armas, ['propietario', 'rut', 'tipo_arma', 'marca'], 'armas')}
            ${renderTable('Vehículos', vehiculos, ['propietario', 'rut', 'marca', 'modelo'], 'vehiculos')}
            ${renderTable('Propiedades', propiedades, ['propietario', 'rut', 'direccion'], 'propiedades')}
            ${renderTable('Empresas', empresas, ['nombre_empresa', 'rut_empresa', 'direccion'], 'empresas')}
            ${renderTable('Cargos', cargos, ['cargo', 'rut', 'descripcion'], 'cargos')}
            <h2>Logs de Cambios</h2>
            <ul>${logs.map(l => `<li>${l.timestamp}: ${l.action} - ${l.details}</li>`).join('')}</ul>
        `;
    }
}

// Funciones para editar/eliminar
function editItem(storageKey, index) {
    const items = JSON.parse(localStorage.getItem(storageKey)) || [];
    const item = items[index];
    // Simple prompt para editar (puedes mejorar con modales)
    const newData = prompt('Editar datos (JSON):', JSON.stringify(item));
    if (newData) {
        try {
            items[index] = JSON.parse(newData);
            localStorage.setItem(storageKey, JSON.stringify(items));
            addLog('Edición', `Editado ${storageKey} índice ${index}`);
            location.reload();
        } catch (e) {
            alert('Formato inválido');
        }
    }
}

function deleteItem(storageKey, index) {
    const items = JSON.parse(localStorage.getItem(storageKey)) || [];
    items.splice(index, 1);
    localStorage.setItem(storageKey, JSON.stringify(items));
    addLog('Eliminación', `Eliminado ${storageKey} índice ${index}`);
    location.reload();
}

// MDT Search
if (document.getElementById('mdtSearchForm')) {
    document.getElementById('mdtSearchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const rut = document.getElementById('searchRut').value;
        const ciudadanos = JSON.parse(localStorage.getItem('ciudadanos')) || [];
        const armas = JSON.parse(localStorage.getItem('armas')) || [];
        const vehiculos = JSON.parse(localStorage.getItem('vehiculos')) || [];
        const propiedades = JSON.parse(localStorage.getItem('propiedades')) || [];
        const empresas = JSON.parse(localStorage.getItem('empresas')) || [];
        const cargos = JSON.parse(localStorage.getItem('cargos')) || [];

        const persona = ciudadanos.find(c => c.rut === rut);
        const antecedentes = cargos.filter(c => c.rut === rut);
        const armasPersona = armas.filter(a => a.rut === rut);
        const vehiculosPersona = vehiculos.filter(v => v.rut === rut);
        const propiedadesPersona = propiedades.filter(p => p.rut === rut);
        const empresasPersona = empresas.filter(e => e.rut_empresa === rut);

        const mdtContent = document.getElementById('mdtContent');
        if (persona) {
            mdtContent.innerHTML = `
                <h2>Hoja de Vida: ${persona.nombre} ${persona.apellido}</h2>
                <p>RUT: ${persona.rut}</p>
                <p>Fecha Nacimiento: ${persona.fechaNacimiento}</p>
                <p>Género: ${persona.genero}</p>
                <p>Nacionalidad: ${persona.nacionalidad}</p>
                <h3>Antecedentes</h3>
                ${antecedentes.length ? antecedentes.map(a => `<p>${a.fecha}: ${a.descripcion} - Artículo: ${a.articulo}</p>`).join('') : '<p>Sin antecedentes.</p>'}
                <h3>Armas Registradas</h3>
                ${armasPersona.map(a => `<p>${a.tipo_arma} - ${a.marca} ${a.modelo}</p>`).join('')}
                <h3>Vehículos</h3>
                ${vehiculosPersona.map(v => `<p>${v.marca} ${v.modelo} - Patente: ${v.patente}</p>`).join('')}
                <h3>Propiedades</h3>
                ${propiedadesPersona.map(p => `<p>${p.direccion} - ${p.tipo_propiedad}</p>`).join('')}
                <h3>Empresas</h3>
                ${empresasPersona.map(e => `<p>${e.nombre_empresa}</p>`).join('')}
            `;
        } else {
            mdtContent.innerHTML = '<p>No se encontró persona con ese RUT.</p>';
        }
    });
}