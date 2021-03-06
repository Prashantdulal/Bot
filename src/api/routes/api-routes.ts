import { MessageEmbed } from 'discord.js';
import { Router } from 'express';
import config from '../../../config.json';
import { bot } from '../../bot';
import { CommandDocument, SavedCommand } from '../../data/models/command';
import Deps from '../../utils/deps';
import { validateBotOwner, sendError } from '../modules/api-utils';
import Stats from '../modules/stats';
import { auth } from '../server';

export const router = Router();

const stats = Deps.get<Stats>(Stats);

let commands: CommandDocument[] = [];
SavedCommand.find().then(cmds => commands = cmds);

router.get('/', (req, res) => res.json({ hello: 'earth' }));

router.get('/commands', async (req, res) => res.json(commands));

router.get('/auth', async (req, res) => {
  try {    
    const key = await auth.getAccess(req.query.code.toString());
    res.redirect(`${config.dashboardURL}/auth?key=${key}`);
  } catch (error) { sendError(res, 400, error); }
});

router.post('/error', async(req, res) => {
  try {
    const { id } = await auth.getUser(req.query.key.toString());
    
    await bot.users.cache
      .get(config.bot.ownerId)
      ?.send(new MessageEmbed({
        title: 'Dashboard Error',
        description: `**Message**: ${req.body.message}`,
        footer: { text: `User ID: ${id ?? 'N/A'}` }
    }));
  } catch (error) { sendError(res, 400, error); }
});

router.get('/stats', async (req, res) => {
  try {
    await validateBotOwner(req.query.key);
  
    res.json({
      general: stats.general,
      commands: stats.commands,
      inputs: stats.inputs,
      modules: stats.modules
    });
  } catch (error) { sendError(res, 400, error); }
});

router.get('/invite', (req, res) => 
  res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${config.bot.id}&redirect_uri=${config.dashboardURL}/dashboard&permissions=8&scope=bot`));

router.get('/login', (req, res) => res.redirect(auth.authCodeLink.url));