require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de Google Calendar
const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: 'v3', auth });

// Endpoint para obtener disponibilidad (próximos 30 días)
app.post('/api/calendario/disponibilidad', async (req, res) => {
    try {
        const timeMin = new Date();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 30);

        const response = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
        });

        const eventos = response.data.items;
        const disponibilidad = {};

        // Generar slots de 30 minutos (ejemplo de 9am a 7pm)
        for (let d = new Date(timeMin); d <= timeMax; d.setDate(d.getDate() + 1)) {
            const fechaStr = d.toISOString().split('T')[0];
            const slots = [];
            for (let hora = 9; hora <= 18; hora++) { // 9am a 6pm
                const horaStr = `${hora}:00`;
                const slotStart = new Date(d);
                slotStart.setHours(hora, 0, 0, 0);
                const slotEnd = new Date(d);
                slotEnd.setHours(hora, 30, 0, 0);

                // Verificar si el slot está ocupado
                const ocupado = eventos.some(event => {
                    const eventStart = new Date(event.start.dateTime || event.start.date);
                    const eventEnd = new Date(event.end.dateTime || event.end.date);
                    return (slotStart < eventEnd && slotEnd > eventStart);
                });

                if (!ocupado) {
                    slots.push(`${hora}:00`);
                }
            }
            if (slots.length > 0) {
                disponibilidad[fechaStr] = slots;
            }
        }

        res.json({ disponibilidad });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener disponibilidad' });
    }
});

// Endpoint para crear una cita
app.post('/api/citas', async (req, res) => {
    try {
        console.log('Datos recibidos para crear cita:', req.body);
        const data = req.body;
        const { fechaCita, horaCita, propietario, email, telefono, nombreMascota, especie } = data;

        // Validar campos obligatorios
        if (!fechaCita || !horaCita) {
            return res.status(400).json({ error: 'Faltan fecha u hora' });
        }

        // Crear evento en Google Calendar
        const [hora, minuto] = horaCita.split(':');
        const start = new Date(fechaCita + 'T' + horaCita + ':00');
        const end = new Date(start.getTime() + 30 * 60 * 1000);

        const event = {
            summary: `Cita: ${nombreMascota} (${especie})`,
            description: `Propietario: ${propietario}\nEmail: ${email}\nTel: ${telefono}\nDatos: ${JSON.stringify(data)}`,
            start: { dateTime: start.toISOString(), timeZone: 'America/Bogota' },
            end: { dateTime: end.toISOString(), timeZone: 'America/Bogota' },
        };

        const response = await calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            resource: event,
        });
        console.log('Evento creado en Google Calendar:', response.data.id);

        // Enviar a GHL (si falla, solo se loguea, no se detiene la cita)
        if (process.env.GHL_WEBHOOK_URL && process.env.GHL_WEBHOOK_URL !== 'tu.webhook.ghl.com') {
            try {
                await fetch(process.env.GHL_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                console.log('Datos enviados a GHL');
            } catch (ghlError) {
                console.error('Error al enviar a GHL (no crítico):', ghlError.message);
            }
        } else {
            console.log('Webhook de GHL no configurado, se omite envío.');
        }

        res.json({ citaCreada: true });
    } catch (error) {
        console.error('ERROR CRÍTICO al crear cita:', error.message, error.response?.data);
        res.status(500).json({ error: 'Error al crear la cita' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});