const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const Jimp = require("jimp");

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
      // one images
      if(attachments.size === 1  ) {
        let width = 0;
        let height = 0;
        let key;
        attachments.forEach((attachment, thisKey) => {
          width = attachment.width;
          height = attachment.height;
          key = thisKey;
        });
        sendScaled(interaction.targetMessage, key, width, height)
        return;
      }
  }

  
};
const keyList = [];
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