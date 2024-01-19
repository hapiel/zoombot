const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const { getProfileUrlFromPj } = require("../../common/profileService");

// register Context Menu
module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('GetPixeljointProfile')
    .setType(ApplicationCommandType.User),
    async execute(client, interaction) {  
      if (interaction.targetUser.bot) return;  
      getProfileUrlFromPj(interaction.targetUser, interaction.guild).then(response => {
        interaction.reply({content: response, ephemeral: false });
      })
  },
};