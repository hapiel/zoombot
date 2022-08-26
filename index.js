const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

//START BOT

const Discord = require('discord.js');
require('discord-reply');
const Jimp = require('jimp');
require('dotenv').config();

const client = new Discord.Client();

const maxWidth = 2000;

client.login(process.env.TOKEN);
const keyList = [];

client.on('ready', () => {
  console.log('Ready!');
});

client.on('message', msg => {

    // if (msg.author.username == 'yuanhai'){
    //     msg.lineReply("*yuanhai wrote:* " + msg.content);
    // }


  if (msg.attachments.size === 1){
    // console.log(msg.attachments)
    let width = 1500;
    let height = 1500;
    let key;
    msg.attachments.forEach((attachment, thisKey) => {
      width = attachment.width;
      height = attachment.height;
      key = thisKey;
      console.log(attachment.width);
    });
    if (width < maxWidth){
      console.log('width good');
    //   msg.react('799315152201449533');
      const filter = (reaction, user) => reaction.emoji.id === '799315152201449533' && user.id !== client.user.id;

      const collector = msg.createReactionCollector(filter);
      collector.on('collect', r => sendScaled(msg, key, width, height));

    // extra emojis:
      const filter2 = (reaction, user) => reaction.emoji.name === '🔍' && user.id !== client.user.id;

      const filter3 = (reaction, user) => reaction.emoji.name === '🔎' && user.id !== client.user.id;

      const collector2 = msg.createReactionCollector(filter2);
      collector2.on('collect', r => sendScaled(msg, key, width, height));
      const collector3 = msg.createReactionCollector(filter3);
      collector3.on('collect', r => sendScaled(msg, key, width, height));


    //   const filterPD = (reaction, user) => reaction.emoji.id === '827058441947840532' && user.id !== client.user.id;

    //   const collectorPD = msg.createReactionCollector(filterPD);
    //   collectorPD.on('collect', r => sendScaled(msg, key, width, height));

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
    
    const scaledAttachment =  new Discord.MessageAttachment(await image.getBufferAsync(Jimp.MIME_PNG), '2x.png');
    console.log("posting");
    msg.lineReply('' , scaledAttachment);
    // msg.channel.send('' , scaledAttachment);
    // msg.channel.send(`${image.bitmap.width} x ${image.bitmap.height}` , scaledAttachment);
  }
}

//🔍🔎