const { SlashCommandBuilder } = require('discord.js');
const pixelJointUrl ="https://pixeljoint.com/pixels/new_icons.asp?ob=date";
const pixelJointPixelartUrl ="https://pixeljoint.com/pixelart/";
const pixelArtInactiveString = "ACHTUNG! PIXEL ART INACTIVE!";
const minIndex = 1000;
const https = require('https');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('random')
		.setDescription('Replies with a random PJ Art piece'),
	async execute(interaction) {
        // get last art piece index
        const url = await fetch(pixelJointUrl).then(function(response) {
          return response.text();
        }).then(function(data){
          return getRandomPjPiece(data);
        });
        interaction.reply(url);
	},
    
};

// CallbackFunction that get last challenge url on pixeljoint.com
getRandomPjPiece = async function(data) {
        const indexStartString = "<div class='imgbox' id='bx";
        const startUrl = data.indexOf(indexStartString);
        const endUrl = startUrl + indexStartString.length + 6;
        const index = data.substring(startUrl + indexStartString.length, endUrl -1);
        const maxIndexNumber = Number(index);
        if(startUrl !== -1 && endUrl !== -1 && maxIndexNumber){
          let index = getRandomArbitrary(minIndex, maxIndexNumber);
          let randomUrl = pixelJointPixelartUrl + index + '.htm';
          let isInactive = true;
          while (isInactive) {
            randomUrl = await fetch(randomUrl).then(function(response) {
              return response.text();
            }).then(function(data){
              isInactive = data.includes(pixelArtInactiveString);
              if( isInactive) {
                console.log('Pixel art inactive, retrying')
                index = getRandomArbitrary(minIndex, maxIndexNumber);
              }
              return pixelJointPixelartUrl + index + '.htm';
            });
          }
          return randomUrl;
        }

  }

  function checkIfInactive(){


  }

  function getRandomArbitrary(min, max) {
    const randomIndex = Math.floor(Math.random() * (max - min) + min);
    while (randomIndex === 1840) {
      randomIndex = Math.floor(Math.random() * (max - min) + min);
    }
    return Math.floor(Math.random() * (max - min) + min);
  }