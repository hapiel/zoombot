const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const { getProfileUrlFromPj, getPjName } = require("../../common/profileService");

// register Context Menu
module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('GetPixeljointProfile')
    .setType(ApplicationCommandType.User),
    async execute(client, interaction) {  
      if (interaction.targetUser.bot) return;  
      getProfileUrlFromPj(getPjName(interaction.targetUser, interaction.guild)).then(response => {
        interaction.reply({content: response, ephemeral: false });
      })
  },
};