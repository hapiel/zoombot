const { SlashCommandBuilder } = require("discord.js");
const { getProfileUrlFromPj, getPjName } = require("../../common/profileService");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lookout')
		.setDescription('Replies with the link to the pixeljoint profile from a given user')
    .addUserOption(option => option.setName('artist').setDescription('User').setRequired(true))
    .addBooleanOption(option => option.setName('private').setDescription('If true, only you can see the answer')),
	async execute(interaction) {
    const artistName = getPjName(interaction.options.getUser('artist'), interaction.guild);
    if (artistName) {
      getProfileUrlFromPj(artistName).then(response => {
        interaction.reply({content: "Here is " +artistName + " profile : \n"+ response, ephemeral: interaction.options.getBoolean('private') });
      })
    } else {
      interaction.reply({content: "No profile found, sorry", ephemeral: true});
    }
  }
}