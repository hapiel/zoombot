const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const Jimp = require("jimp");
const sharp = require("sharp");
const fetch = require('node-fetch');

// register Context Menu
module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Zoom')
    .setType(ApplicationCommandType.Message),
    async execute(client, interaction) {
      const attachments = interaction.targetMessage.attachments;
      // NO images
      if(!attachments || attachments.size === 0 ) {
        interaction.reply({
          content: `There is no image to zoom in this message.`,
          ephemeral: true
        });
        return;
      }
      // multiple images
      if(attachments.size > 1  ) {
        interaction.reply({
          content: `There is too many images attached to this image, I don't know how to handle this yet.`,
          ephemeral: true
        });
        return;
      }
      // one image
      if(attachments.size === 1  ) {
        // check if gif
        
        let width = 0;
        let height = 0;
        let key;
        let name;
        attachments.forEach((attachment, thisKey) => {
          width = attachment.width;
          height = attachment.height;
          key = thisKey;
          name = attachment.name;
        });

        if (name.endsWith(".gif")) {
          sendScaled(interaction.targetMessage, key, width, height, true)
        } else {
          sendScaled(interaction.targetMessage, key, width, height, false)
        }

        console.log(name)
        //
        return;
      }
  }

  
};
const keyList = [];
async function sendScaled(msg, key, width, height, isGif){
  if (keyList.find(e => e === key) === undefined){
    keyList.push(key);
    let buffer = null;
    if (isGif) {
    console.log("Let's support gifs")
    let url = msg.attachments.get(key).url;
    await fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch the image. Status code: ${response.status}`);
      }
      return response.arrayBuffer();
    })
    .then(imageBuffer => {
      // The 'imageBuffer' now contains the binary data of the image.
      sharp(Buffer.from(imageBuffer), {animated: true})
      .resize(Number(width *2), Number(height *2), {kernel: sharp.kernel.nearest })
      .gif()
      .toBuffer().then(buffer => {
        console.log(buffer)
        msg.reply({content:'' , files: [{ attachment: buffer, name: "2X.gif" }]});
      });
    })
    .catch(error => {
      console.error('Error fetching the image:', error);
    });

    }else {
      let image = await Jimp.read(msg.attachments.get(key).url);
      if (width <= 150 && height <= 100){
        await image.scale(4, Jimp.RESIZE_NEAREST_NEIGHBOR );
      } else {
        await image.scale(2, Jimp.RESIZE_NEAREST_NEIGHBOR );
      }
      console.log("attends")
      buffer = await image.getBufferAsync(Jimp.MIME_PNG);
      msg.reply({content:'' , files: [{ attachment: buffer }]});
    }


  }
}