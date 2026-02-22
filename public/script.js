// Estado de la aplicación
let pasoActual = 1;
const totalPasos = 11; // Número total de preguntas
let respuestas = {
    nombreMascota: '',
    especie: '',
    raza: '',
    edad: '',
    peso: '',
    urgencia: null,
    tipoUrgencia: '',
    intoxicacion: '',
    motivoConsulta: '',
    remitido: null,
    veterinario: '',
    formaPago: '',
    propietario: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaCita: '',
    horaCita: ''
};

// Definición de las preguntas
const preguntas = [
    {
        tipo: 'texto',
        texto: '¿Nombre de la mascota?',
        campo: 'nombreMascota'
    },
    {
        tipo: 'opciones',
        texto: 'Especie:',
        campo: 'especie',
        opciones: ['Perro', 'Gato', 'Exótico', 'Otro']
    },
    {
        tipo: 'texto',
        texto: 'Raza:',
        campo: 'raza'
    },
    {
        tipo: 'texto',
        texto: 'Edad (en años o meses):',
        campo: 'edad'
    },
    {
        tipo: 'opciones',
        texto: 'Peso estimado:',
        campo: 'peso',
        opciones: ['<5 kg', '5-15 kg', '15-30 kg', '>30 kg']
    },
    {
        tipo: 'opciones',
        texto: '¿Es una urgencia?',
        campo: 'urgencia',
        opciones: ['Sí', 'No']
    },
    // Las siguientes preguntas se muestran condicionalmente
    {
        tipo: 'opciones',
        texto: 'Tipo de urgencia:',
        campo: 'tipoUrgencia',
        opciones: ['Atropellamiento', 'Intoxicación', 'Golpe o fractura', 'Está sangrando', 'Otro'],
        condicion: () => respuestas.urgencia === 'Sí'
    },
    {
        tipo: 'texto',
        texto: 'Indica con qué se intoxicó:',
        campo: 'intoxicacion',
        condicion: () => respuestas.tipoUrgencia === 'Intoxicación'
    },
    {
        tipo: 'texto',
        texto: 'Motivo de la consulta:',
        campo: 'motivoConsulta',
        condicion: () => respuestas.urgencia === 'No'
    },
    {
        tipo: 'opciones',
        texto: '¿Viene remitido por algún veterinario?',
        campo: 'remitido',
        opciones: ['Sí', 'No']
    },
    {
        tipo: 'texto',
        texto: 'Nombre del veterinario o clínica:',
        campo: 'veterinario',
        condicion: () => respuestas.remitido === 'Sí'
    },
    {
        tipo: 'opciones',
        texto: 'Forma de pago del depósito:',
        campo: 'formaPago',
        opciones: ['Efectivo', 'Transferencia', 'Tarjeta']
    }
];

// Elementos DOM
const preguntaActualEl = document.getElementById('pregunta-actual');
const opcionesContainer = document.getElementById('opciones-container');
const progressFill = document.getElementById('progress-fill');
const pasoActualEl = document.getElementById('paso-actual');
const totalPasosEl = document.getElementById('total-pasos');
const preguntasSection = document.getElementById('preguntas-section');
const datosSection = document.getElementById('datos-section');
const calendarioSection = document.getElementById('calendario-section');
const confirmacionSection = document.getElementById('confirmacion-section');

totalPasosEl.textContent = totalPasos;

// Mostrar pregunta actual
function mostrarPregunta() {
    const pregunta = preguntas[pasoActual - 1];
    if (!pregunta) return;

    // Verificar condición
    if (pregunta.condicion && !pregunta.condicion()) {
        pasoActual++;
        mostrarPregunta();
        return;
    }

    preguntaActualEl.textContent = pregunta.texto;
    opcionesContainer.innerHTML = '';

    if (pregunta.tipo === 'texto') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Escribe aquí...';
        input.classList.add('campo-texto');
        input.addEventListener('input', (e) => {
            respuestas[pregunta.campo] = e.target.value;
        });
        opcionesContainer.appendChild(input);

        const btn = document.createElement('button');
        btn.textContent = 'Siguiente';
        btn.classList.add('btn-primario');
        btn.addEventListener('click', () => {
            if (respuestas[pregunta.campo]) {
                siguientePregunta();
            } else {
                alert('Por favor responde la pregunta');
            }
        });
        opcionesContainer.appendChild(btn);
    } else if (pregunta.tipo === 'opciones') {
        pregunta.opciones.forEach(opcion => {
            const div = document.createElement('div');
            div.classList.add('opcion');
            div.textContent = opcion;
            div.addEventListener('click', () => {
                // Quitar selección anterior
                document.querySelectorAll('.opcion').forEach(o => o.classList.remove('seleccionada'));
                div.classList.add('seleccionada');
                respuestas[pregunta.campo] = opcion;

                // Avanzar después de un breve retraso
                setTimeout(siguientePregunta, 500);
            });
            opcionesContainer.appendChild(div);
        });
    }

    // Actualizar barra de progreso
    const progreso = (pasoActual / totalPasos) * 100;
    progressFill.style.width = `${progreso}%`;
    pasoActualEl.textContent = pasoActual;
}

function siguientePregunta() {
    if (pasoActual < totalPasos) {
        pasoActual++;
        mostrarPregunta();
    } else {
        // Terminaron las preguntas, pasar a datos del propietario
        preguntasSection.classList.remove('active');
        datosSection.classList.add('active');
    }
}

// Iniciar
mostrarPregunta();

// Manejar envío de datos del propietario
document.getElementById('form-datos').addEventListener('submit', (e) => {
    e.preventDefault();

    respuestas.propietario = document.getElementById('propietario').value;
    respuestas.email = document.getElementById('email').value;
    respuestas.telefono = document.getElementById('telefono').value;
    respuestas.direccion = document.getElementById('direccion').value;

    if (!document.getElementById('acepto').checked) {
        alert('Debes aceptar las condiciones');
        return;
    }

    // Enviar datos al backend para crear el calendario
    fetch('/api/calendario/disponibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: respuestas.email })
    })
    .then(res => res.json())
    .then(data => {
        if (data.disponibilidad) {
            mostrarCalendario(data.disponibilidad);
        } else {
            alert('Error al cargar disponibilidad');
        }
    });

    datosSection.classList.remove('active');
    calendarioSection.classList.add('active');
});

// Función para mostrar el calendario (simplificada)
function mostrarCalendario(disponibilidad) {
    const container = document.getElementById('calendario-container');
    const horariosGrid = document.getElementById('horarios-disponibles');
    let fechaSeleccionada = null;
    let horaSeleccionada = null;

    // Generar calendario del mes actual
const hoy = new Date();
const año = hoy.getFullYear();
const mes = hoy.getMonth();
const diasEnMes = new Date(año, mes + 1, 0).getDate();
const primerDia = new Date(año, mes, 1).getDay(); // 0 domingo, 1 lunes...

// Ajustar para que la semana empiece en lunes (opcional)
// Si quieres que empiece en domingo, no hagas este ajuste
const primerDiaAjustado = primerDia === 0 ? 6 : primerDia - 1; // Para que lunes sea 0

let html = '<div class="calendario-mes">';

// Días de la semana (bien estructurados)
html += '<div class="dias-semana">';
const diasSemana = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // Si quieres que empiece en lunes
// Si prefieres que empiece en domingo: ['D', 'L', 'M', 'M', 'J', 'V', 'S']
diasSemana.forEach(dia => {
    html += `<span>${dia}</span>`;
});
html += '</div>';

// Cuadrícula de días
html += '<div class="dias-grid">';

// Celdas vacías antes del primer día (según ajuste)
for (let i = 0; i < primerDiaAjustado; i++) {
    html += '<div class="dia vacio"></div>';
}

// Días del mes
for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const disponible = disponibilidad[fechaStr] ? disponibilidad[fechaStr].length > 0 : false;
    const claseDia = disponible ? 'dia disponible' : 'dia vacio';
    html += `<div class="${claseDia}" data-fecha="${fechaStr}">${dia}</div>`;
}

html += '</div>'; // cierra dias-grid
html += '</div>'; // cierra calendario-mes

// Insertar en el contenedor
container.innerHTML = html;

    // Eventos para seleccionar día
    document.querySelectorAll('.dia.disponible').forEach(dia => {
        dia.addEventListener('click', () => {
            document.querySelectorAll('.dia').forEach(d => d.classList.remove('seleccionado'));
            dia.classList.add('seleccionado');
            fechaSeleccionada = dia.dataset.fecha;

            // Mostrar horarios disponibles para esa fecha
            const horarios = disponibilidad[fechaSeleccionada] || [];
            horariosGrid.innerHTML = '';
            horarios.forEach(hora => {
                const btn = document.createElement('div');
                btn.classList.add('horario');
                btn.textContent = hora;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.horario').forEach(h => h.classList.remove('seleccionado'));
                    btn.classList.add('seleccionado');
                    horaSeleccionada = hora;
                    document.getElementById('confirmar-cita').disabled = false;
                });
                horariosGrid.appendChild(btn);
            });
        });
    });

    document.getElementById('confirmar-cita').addEventListener('click', () => {
        if (!fechaSeleccionada || !horaSeleccionada) return;

        respuestas.fechaCita = fechaSeleccionada;
        respuestas.horaCita = horaSeleccionada;

        // Enviar cita al backend para crearla en Google Calendar y a GHL
        fetch('/api/citas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(respuestas)
        })
        .then(res => res.json())
        .then(data => {
            if (data.citaCreada) {
                // Generar mensaje de WhatsApp
                const mensaje = generarMensajeWhatsApp(respuestas);
                const url = `https://wa.me/573022853080?text=${encodeURIComponent(mensaje)}`;
                document.getElementById('whatsapp-link').href = url;

                calendarioSection.classList.remove('active');
                confirmacionSection.classList.add('active');
            } else {
                alert('Error al crear la cita');
            }
        });
    });
}

function generarMensajeWhatsApp(r) {
    return `Hola, soy ${r.propietario}. Agendé una cita para ${r.nombreMascota} el ${r.fechaCita} a las ${r.horaCita}.
Datos de la mascota:
- Especie: ${r.especie}
- Raza: ${r.raza}
- Edad: ${r.edad}
- Peso: ${r.peso}
- Motivo: ${r.motivoConsulta || r.tipoUrgencia}
- Remitido por: ${r.remitido === 'Sí' ? r.veterinario : 'No'}
Datos del propietario:
- Nombre: ${r.propietario}
- Email: ${r.email}
- Teléfono: ${r.telefono}
- Dirección: ${r.direccion}
Forma de pago: ${r.formaPago}
*Adjunto la foto de mi mascota (de lado, cuerpo completo) para evaluación.*
Por favor confirma el depósito del 50% (25.000 COP) para validar la cita.`;
}
// ---------- CONTROL DE MÚSICA ----------
function initMusic() {
    const music = document.getElementById('background-music');
    const toggle = document.getElementById('music-toggle');
    const status = document.getElementById('music-status');

    // Si no existen los elementos, salir (por si acaso)
    if (!music || !toggle || !status) {
        console.warn('Elementos de música no encontrados');
        return;
    }

    let musicPlaying = true;

    // Volumen bajo para no saturar
    music.volume = 0.2;

    // Intentar reproducir (casi siempre bloqueado por el navegador)
    const playPromise = music.play();
    if (playPromise !== undefined) {
        playPromise.catch(() => {
            // Autoplay bloqueado, actualizar UI
            musicPlaying = false;
            status.textContent = 'Música: OFF';
            toggle.innerHTML = '<i class="fas fa-volume-mute"></i><span>Música: OFF</span>';
        });
    }

    // Evento del botón
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (musicPlaying) {
            music.pause();
            status.textContent = 'Música: OFF';
            toggle.innerHTML = '<i class="fas fa-volume-mute"></i><span>Música: OFF</span>';
        } else {
            music.play()
                .then(() => {
                    status.textContent = 'Música: ON';
                    toggle.innerHTML = '<i class="fas fa-music"></i><span>Música: ON</span>';
                })
                .catch(err => {
                    console.error('Error al reproducir música:', err);
                    alert('No se pudo reproducir la música. Puede deberse a que el archivo no existe o el navegador lo bloquea.');
                });
        }
        musicPlaying = !musicPlaying;
    });
}

// Ejecutar cuando el DOM esté listo (reemplaza a DOMContentLoaded)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusic);
} else {
    // Si ya está cargado, ejecutar directamente
    initMusic();
}