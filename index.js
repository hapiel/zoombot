const https = require('https');
const cron = require('cron');
const pixelJointUrl ="https://pixeljoint.com/";

//START BOT

require('discord-reply');
const Jimp = require('jimp');
const { Client, Events, GatewayIntentBits, ContextMenuCommandBuilder, ApplicationCommandType, Collection  } = require('discord.js');
const path = require('path');
require('dotenv').config();
const maxWidth = 2000;
const fs = require('fs');
const { getLastWeeklyChallengeUrl } = require('./common/challengeUtils');

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
  // INPUT FOR CHAT
	if (interaction.isChatInputCommand()){
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
  }
  //CONTEXT MENU
	if (interaction.isContextMenuCommand()){
    if (interaction.user.bot) return;
    const context = client.commands.get(interaction.commandName) 
    if  (!context) {
      interaction.reply({
        ephemeral: true,
        content: "This command isn't real"
      })
    };
    try {
      context.execute(client, interaction);
    } catch (error) {
      console.log(error);
    }
  }
});

//Listener for zoom reactions with emojis
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
    let imageName = await Jimp.read(msg.attachments.get(key).name);
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

// Job to post weekly challenges every monday at 4pm
const weeklyChallenge = new cron.CronJob('0 16 * * Mon', ()=> {
  getLastWeeklyChallengeUrl().then(response => {
    postOnWeeklyChallengeChannel(response);
  });
});

function postOnWeeklyChallengeChannel(challengeUrl){
  const weeklyChallengeDiscordChannel = client.channels.cache.get('775792433005985835');
  const newChallengeMessage = "New challenge is up :";
  weeklyChallengeDiscordChannel.send(newChallengeMessage + challengeUrl);
  weeklyChallengeDiscordChannel.send("Submissions accepted until sunday 12pm PST!");
}

// starts the job
weeklyChallenge.start();

// Job to remind people to vote every sunday at 4pm
const weeklyChallengeVote = new cron.CronJob('0 16 * * Sun', ()=> {
  https.request(pixelJointUrl, getLastWeeklyChallengeVoteUrl.bind(this, postVoteLinkOnWeeklyChallengeChannel)).end();
});

function postVoteLinkOnWeeklyChallengeChannel(challengeUrl){
  const weeklyChallengeDiscordChannel = client.channels.cache.get('775792433005985835');
  const newChallengeMessage = "Don't forget to vote for last week challenge entries!";
  weeklyChallengeDiscordChannel.send(newChallengeMessage + challengeUrl);
}

// starts the job
weeklyChallengeVote.start();