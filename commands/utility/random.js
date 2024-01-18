const { SlashCommandBuilder } = require('discord.js');
const pixelJointUrl ="https://pixeljoint.com/pixels/new_icons.asp?ob=date";
const pixelJointPixelartUrl ="https://pixeljoint.com/pixelart/";
const minIndex = 1000;
const https = require('https');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('random')
		.setDescription('Replies with a random PJ Art piece'),
	async execute(interaction) {
        // get last art piece index
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
        const indexStartString = "<div class=\"imgbox\" id=\"bx>";
        const startUrl = store.indexOf(indexStartString);
        const endUrl = startUrl + 6;
        const index = store.substring(startUrl + indexStartString.length, endUrl -1);
        const maxIndexNumber = Number.from(index);
        if(startUrl !== -1 && endUrl !== -1 && maxIndexNumber !== -1){
          const index = getRandomArbitrary(minIndex, maxIndexNumber);
          const randomUrl = pixelJointPixelartUrl + index + 'htm';
          callback(randomUrl);
        }
    });
  }

  function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }