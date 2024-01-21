const { SlashCommandBuilder } = require('discord.js');
const pixelJointUrl ="https://pixeljoint.com/";
const https = require('https');
const { getLastWeeklyChallengeVoteUrl, getLastWeeklyChallengeResultsUrl } = require('../../common/challengeUtils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('challenge')
		.setDescription('Replies with a link to the latest Pj challenge.')
        .addStringOption(option => option.setName('type').setDescription('The type of url you need')
            .addChoices(
                {name: 'Vote', value: 'vote'},
                {name: 'Results', value: 'results'},
                {name: 'Ongoing', value: 'ongoing'},
                {name: 'Random', value: 'random'})
            )
        .addBooleanOption(option => option.setName('private').setDescription("If true, only you will see the response")),
	async execute(interaction) {
        const type = interaction.options.getString('type');
        let message= "an error occured";
        let url = '';
        if (!type || type === 'ongoing'){
            url = await getLastWeeklyChallengeUrl();
            message = "Here is the link to the ongoing challenge : \n";
        }
        else if (type === 'vote') {
            url = await getLastWeeklyChallengeVoteUrl();
            message = "Here is the link to vote for the entries of last week challenge : \n";
        } else if (type === 'results') {
            url = await getLastWeeklyChallengeResultsUrl();
            message = "Here is the link to the results of last week challenge : \n";
        } else {
            url = await await getRandomWeeklyChallengeUrl();
            message = "Here is the link to a random challenge : \n";
        }
        interaction.reply({content: message + url, ephemeral: interaction.options.getBoolean('private')});

	},
    
};
