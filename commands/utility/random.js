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
    console.log("attends")
        // get last art piece index
        https.request(pixelJointUrl, getRandomPjPiece.bind(this, function(data){
            interaction.reply(data);
        })).end();
	},
    
};

// CallbackFunction that get last challenge url on pixeljoint.com
getRandomPjPiece = function(callback, response) {
    // get the data as a string instead of a buffer
    response.setEncoding();
    var store = "";
    // on each update, add to the store
    response.on('data', function(d) {
        store += d;
    }); 
  
    //when stream is done, do the thing
    response.on('end', function() {
        const indexStartString = "<div class='imgbox' id='bx";
        const startUrl = store.indexOf(indexStartString);
        const endUrl = startUrl + indexStartString.length + 6;
        const index = store.substring(startUrl + indexStartString.length, endUrl -1);
        const maxIndexNumber = Number(index);
        if(startUrl !== -1 && endUrl !== -1 && maxIndexNumber){
          const index = getRandomArbitrary(minIndex, maxIndexNumber);
          const randomUrl = pixelJointPixelartUrl + index + '.htm';
          callback(randomUrl);
        }
    });
  }

  function getRandomArbitrary(min, max) {
    const randomIndex = Math.floor(Math.random() * (max - min) + min);
    while (randomIndex === 1840) {
      randomIndex = Math.floor(Math.random() * (max - min) + min);
    }
    return Math.floor(Math.random() * (max - min) + min);
  }