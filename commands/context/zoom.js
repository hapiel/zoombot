const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const { sendScaled } = require('../../common/imageUtils');

// register Context Menu
module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Zoom')
    .setType(ApplicationCommandType.Message),
  async execute(client, interaction) {
    const attachments = interaction.targetMessage.attachments;
    await interaction.deferReply({ ephemeral: false });
    // NO images
    if (!attachments || attachments.size === 0) {
      interaction.editReply({
        content: `There is no image to zoom in this message.`,
        ephemeral: true
      });
      return;
    }
    // multiple images
    if (attachments.size > 1) {
      interaction.editReply({
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
      let spoiler = false;
      attachments.forEach((attachment, thisKey) => {
        spoiler = attachment.spoiler;
        width = attachment.width;
        height = attachment.height;
        key = thisKey;
        name = attachment.name;
      });
      return sendScaled(interaction, key, width, height, spoiler, name.endsWith(".gif"));
    }
  }
};