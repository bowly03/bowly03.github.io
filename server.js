require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OAuth2 } = require('discord-oauth2');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Configuración de Discord
const oauth = new OAuth2({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Reemplaza data con supabase queries, ej:
app.post('/api/ciudadanos', async (req, res) => {
  const { data, error } = await supabase.from('ciudadanos').insert(req.body);
  if (error) return res.status(500).json(error);
  res.json(data);
});

// Endpoint para login Discord
app.get('/auth/discord', (req, res) => {
  const authUrl = oauth.generateAuthUrl({
    scope: ['identify', 'guilds'],
    state: 'randomState', // Para seguridad
  });
  res.redirect(authUrl);
});

// Callback de Discord
app.get('/auth/discord/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenData = await oauth.tokenRequest({
      code,
      scope: 'identify guilds',
      grantType: 'authorization_code',
    });

    const user = await oauth.getUser(tokenData.access_token);
    // Verificar roles en guild (ejemplo)
    const guildId = 'TU_GUILD_ID_AQUI'; // Reemplaza con ID de tu servidor
    const member = await oauth.getUserGuildMember(tokenData.access_token, guildId);
    let role = 'civil';
    if (member.roles.includes('ADMIN_ROLE_ID')) role = 'admin'; // Reemplaza con role ID

    // Guardar user en session o DB
    res.json({ user, role, token: tokenData.access_token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// APIs para datos
app.get('/api/:type', (req, res) => {
  const type = req.params.type;
  res.json(data[type] || []);
});

app.post('/api/:type', (req, res) => {
  const type = req.params.type;
  data[type].push(req.body);
  data.logs.push({ action: 'Registro', details: `Nuevo ${type}`, timestamp: new Date() });
  res.json({ success: true });
});

// Servir archivos estáticos
app.use(express.static('.'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});