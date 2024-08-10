const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const { getPalette } = require('../../common/imageUtils');

// register Context Menu
module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Get Palette')
    .setType(ApplicationCommandType.Message),
  async execute(client, interaction) {
    const attachments = interaction.targetMessage.attachments;
    // NO images
    if (!attachments || attachments.size === 0) {
      interaction.reply({
        content: `There is no image to zoom in this message.`,
        ephemeral: true
      });
      return;
    }
    // multiple images
    if (attachments.size > 1) {
      interaction.reply({
        content: `There is too many images attached to this image, I don't know how to handle this yet.`,
        ephemeral: true
      });
      return;
    }
    // one image
    if (attachments.size === 1) {
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
      return getPalette(interaction, key, name.endsWith(".gif"));
    }
  }
};