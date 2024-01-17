const { SlashCommandBuilder } = require('discord.js');
const pixelJointUrl ="https://pixeljoint.com/";
const https = require('https');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('challenge')
		.setDescription('Replies with a link to the latest Pj challenge.'),
	async execute(interaction) {
        https.request(pixelJointUrl, getLastWeeklyChallengeUrl.bind(this, function(data){
            interaction.reply(data);
        })).end();
	},
    
};

// CallbackFunction that get last challenge url on pixeljoint.com
getLastWeeklyChallengeUrl = function(callback, response) {
    // get the data as a string instead of a buffer
    response.setEncoding();
    var store = "";
    // on each update, add to the store
    response.on('data', function(d) {
        store += d;
    }); 
  
    //when stream is done, do the thing
    response.on('end', function() {
        const indexStartString = "challenge_start.png' width='50' height='50' alt='Icon' border='0' /></a></div><div class='subheader'><a href=\"";
        const startUrl = store.indexOf(indexStartString);
        const endUrl = store.indexOf(">Pixel Art Challenge");
        if(startUrl !== -1 && endUrl !== -1){
          const challengeUrl = pixelJointUrl + store.substring(startUrl + indexStartString.length, endUrl -1);
          callback(challengeUrl);
        }
    });
  }