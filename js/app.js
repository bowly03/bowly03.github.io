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

// Modificar handleForm para usar backend
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
            fetch(`/api/${storageKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(() => {
                alert('Registro exitoso.');
                this.reset();
            });
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
const REDIRECT_URI = 'https://bowly03.github.io/NWCLWEB/callback.html'; // Ajusta si el repo es diferente
const SCOPE = 'identify guilds';

// Función para iniciar login con Discord (redirige al backend)
function discordLogin() {
    window.location.href = '/auth/discord'; // Backend maneja
}

// Manejar callback (ahora el backend lo hace, pero frontend puede recibir data)
if (window.location.pathname.includes('callback.html')) {
    // El backend redirige aquí con data, pero para simplicidad, simula
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('status').innerText = `Bienvenido ${user.username}. Redirigiendo...`;
        setTimeout(() => window.location.href = 'index.html', 2000);
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

// Mostrar datos en admin con tablas editables (usando backend)
if (window.location.pathname.includes('admin.html')) {
    fetch('/api/ciudadanos').then(r => r.json()).then(ciudadanos => {
        fetch('/api/armas').then(r => r.json()).then(armas => {
            // Similar para otros
            const adminContent = document.getElementById('adminContent');
            if (adminContent) {
                adminContent.innerHTML = `
                    ${renderTable('Ciudadanos', ciudadanos, ['tipo', 'nombre', 'apellido', 'rut', 'genero'], 'ciudadanos')}
                    ${renderTable('Armas', armas, ['propietario', 'rut', 'tipo_arma', 'marca'], 'armas')}
                    <!-- Agrega más fetches -->
                `;
            }
        });
    });
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