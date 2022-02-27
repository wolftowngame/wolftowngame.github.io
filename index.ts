import fs from 'fs';
import { Client, Intents } from 'discord.js';
const BOT_TOKEN = fs.existsSync('.discord') ? fs.readFileSync('.discord').toString().trim() : '';
const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnected!');
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});
client.on('error', console.log);
client.on('message', console.log);

client.on('interactionCreate', async (interaction) => {
  console.log(interaction);
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.login(BOT_TOKEN).then(console.log).catch(console.log);
