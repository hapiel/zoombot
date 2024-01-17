const express = require('express');
const app = express();
const https = require('https');
const cron = require('cron');
const pixelJointUrl ="https://pixeljoint.com/";
const port = 3000;

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

//START BOT

require('discord-reply');
const Jimp = require('jimp');
const { Client, Events, GatewayIntentBits, ContextMenuCommandBuilder, ApplicationCommandType, Collection  } = require('discord.js');
const path = require('path');
require('dotenv').config();
const maxWidth = 2000;
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions] });
// register commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.login(process.env.TOKEN);
const keyList = [];

client.on('ready', () => {
  console.log('Ready!');
});

// Listen to commands
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on('messageCreate', msg => {
  if (msg.author.bot) return false;
  if (msg.attachments.size === 1){
    let width = 1500;
    let height = 1500;
    let key;
    msg.attachments.forEach((attachment, thisKey) => {
      width = attachment.width;
      height = attachment.height;
      key = thisKey;
    });
    if (width < maxWidth){
      const filter = (reaction, user) => reaction.emoji.id === '799315152201449533'|| 
        reaction.emoji.name === '🔍'|| 
        reaction.emoji.name === '🔎' 
        && user.id !== client.user.id;

      const collector = msg.createReactionCollector({filter: filter});
      collector.on('collect', r => sendScaled(msg, key, width, height));
    }
  }
});

async function sendScaled(msg, key, width, height){
  if (keyList.find(e => e === key) === undefined){
    keyList.push(key);
    let image = await Jimp.read(msg.attachments.get(key).url);
    if (width <= 150 && height <= 100){
      await image.scale(4, Jimp.RESIZE_NEAREST_NEIGHBOR );
    } else {
      await image.scale(2, Jimp.RESIZE_NEAREST_NEIGHBOR );
    }
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    msg.reply({content:'' , files: [{ attachment: buffer }]});
  }
}

//🔍🔎

// CallbackFunction that get last challenge url on pixeljoint.com
getLastWeeklyChallengeUrl = function(callback, response) {
  // get the data as a string instead of a buffer
  response.setEncoding();
  var store = "";
  // on each update, add to the store
  response.on('data', function(d) {
      store += d;
  }); 

  //when stream is done, do the thing
  response.on('end', function() {
      const indexStartString = "challenge_start.png' width='50' height='50' alt='Icon' border='0' /></a></div><div class='subheader'><a href=\"";
      const startUrl = store.indexOf(indexStartString);
      const endUrl = store.indexOf(">Pixel Art Challenge");
      if(startUrl !== -1 && endUrl !== -1){
        const challengeUrl = pixelJointUrl+store.substring(startUrl + indexStartString.length, endUrl -1);
        callback(challengeUrl);
      }
  });
}

// Job to post weekly challenges every monday at 4pm
const weeklyChallenge = new cron.CronJob('0 16 * * Mon', ()=> {
  https.request(pixelJointUrl, getLastWeeklyChallengeUrl.bind(this, postOnWeeklyChallengeChannel)).end();
});

function postOnWeeklyChallengeChannel(challengeUrl){
  const weeklyChallengeDiscordChannel = client.channels.cache.get('775792433005985835');
  const newChallengeMessage = "New challenge is up :";
  weeklyChallengeDiscordChannel.send(newChallengeMessage + challengeUrl);
  weeklyChallengeDiscordChannel.send("Submissions accepted until sunday 12pm PST!");
}

// starts the job
weeklyChallenge.start();