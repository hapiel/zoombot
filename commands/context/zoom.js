const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");

// register Context Menu
module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Zoom')
    .setType(ApplicationCommandType.Message),
    async execute(interaction) {
      interaction.reply({
          content: `Successful.`,
          ephemeral: true
      });
  }
};