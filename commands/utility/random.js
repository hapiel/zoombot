const { SlashCommandBuilder } = require('discord.js');
const { getPjName, getProfileUrlFromPj } = require('../../common/profileService');
const pixelJointUrl = "https://pixeljoint.com/pixels/new_icons.asp?ob=date";
const pixelJointPixelartUrl = "https://pixeljoint.com/pixelart/";
const pixelJointMainUrl = "https://pixeljoint.com/"
const pixelArtInactiveString = "ACHTUNG! PIXEL ART INACTIVE!";
const PIECE_INDEX_BY_YEAR = {
  1000:2004,
  1963:2005,
  7806:2006,
  17127:2007,
  27178:2008,
  38718:2009,
  58536:2011,
  67440:2012,
  75072:2013,
  82972:2014,
  91438:2015,
  10660:2016,
  110017:2017,
  118004:2018,
  124646:2019,
  130334:2020,
  136925:2021,
  144545:2022,
  150403:2023,
  154525: 2024
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Replies with a random Art piece from pixeljoint gallery')
    .addUserOption(option => option.setName('artist').setDescription('Random art piece will only comes from specified artist'))
    .addStringOption(option => option.setName('artistname').setDescription('Random art piece will only comes from specified artist'))
    .addIntegerOption(option => option.setName('fromyear').setDescription('Only from pieces made after the specified year').setMinValue(2005).setMaxValue(new Date().getFullYear()))
    .addIntegerOption(option => option.setName('toyear').setDescription('Only from pieces made before the specified year').setMinValue(2005).setMaxValue(new Date().getFullYear())),
  async execute(interaction) {
    // get last art piece index
    await interaction.deferReply({ephemeral: false});
    const artistname = interaction.options.getString('artistname') || getPjName(interaction.options.getUser('artist'), interaction.guild);
    const debutIndex = interaction.options.getInteger('fromyear') ? parseInt(Object.keys(PIECE_INDEX_BY_YEAR)[Object.values(PIECE_INDEX_BY_YEAR).indexOf(interaction.options.getInteger('fromyear'))]) : 1000;
    let endIndex = parseInt(Object.keys(PIECE_INDEX_BY_YEAR)[Object.values(PIECE_INDEX_BY_YEAR).indexOf(interaction.options.getInteger('toyear'))]);
    let url;
    // get url
    if (!endIndex || endIndex === new Date().getFullYear()){
      endIndex = await fetch(pixelJointUrl).then(function (response) {
        return response.text();
      }).then(function (data) {
        return getLastPjPieceIndex(data);
      });
    }
    if (!artistname) {
      url = await getRandomPjPiece(debutIndex, endIndex);
    } else {
      url = await getRandomPieceFromArtist(artistname, debutIndex, endIndex);
    }
    // build message
    let message = '';
    if (!url.startsWith("No artist found with username")){
      message = 'Here is a random piece';
      if(artistname) {
        message += " from "+ artistname;
      }
      if(interaction.options.getInteger('fromyear') && interaction.options.getInteger('toyear')){
        if(interaction.options.getInteger('fromyear') == interaction.options.getInteger('toyear')){
          message += " made during the year "+ interaction.options.getInteger('fromyear');
        }else {
          message += " made between the year "+ interaction.options.getInteger('fromyear') + " and " + interaction.options.getInteger('toyear');
        }
      } else if (interaction.options.getInteger('fromyear')) {
        message += " made since the year "+ interaction.options.getInteger('fromyear')
      } else if (interaction.options.getInteger('toyear')) {
        message += " made before the year "+ interaction.options.getInteger('toyear')
      }
      message+= '\n'
    }
    interaction.editReply({content : message+ url});
  },

};

getLastPjPieceIndex = async function (data) {
  const indexStartString = "<div class='imgbox' id='bx";
  const startUrl = data.indexOf(indexStartString);
  const endUrl = startUrl + indexStartString.length + 6;
  const index = data.substring(startUrl + indexStartString.length, endUrl);
  return Number(index);
}

// CallbackFunction that get last challenge url on pixeljoint.com
getRandomPjPiece = async function (debutIndex, endIndex) {
    let index = getRandomArbitrary(debutIndex, endIndex);
    let randomUrl = pixelJointPixelartUrl + index + '.htm';
    let isInactive = true;
    while (isInactive) {
      randomUrl = await fetch(randomUrl).then(function (response) {
        return response.text();
      }).then(function (data) {
        isInactive = data.includes(pixelArtInactiveString);
        if (isInactive) {
          console.log('Pixel art inactive, retrying')
          index = getRandomArbitrary(debutIndex, endIndex);
        }
        return pixelJointPixelartUrl + index + '.htm';
      });
    }
    return randomUrl;
}

async function getRandomPieceFromArtist(artistname, debutIndex, endIndex) {
  const userPjId = await getProfileUrlFromPj(artistname).then(response => {
    const endIndex = response.indexOf(".htm");
    return response.substring("https://pixeljoint.com/p/".length, endIndex);
  });
  if (!userPjId || userPjId === "No profile found, sorry" ) { 
    return "No artist found with username "+ artistname+", sorry";
  }

  const urlOrPageNmber = await fetch("https://pixeljoint.com/pixels/profile_tab_icons.asp?id=" + userPjId + "&pg=").then(function (response) {
    return response.text();
  }).then(function (data) {
    if (data.includes('No icons found')) {
      //NO PJ SUBMISSIONS FOUND
      return;
    } else {
      const nbPageIndex = data.indexOf("'><i class='fa fa-chevron-right'></i><i class='fa fa-chevron-right'></i></a></div>")
      const nbPages = data.substring(nbPageIndex - 1, nbPageIndex);
      let url;
      if (nbPages > 1) {
        const pagePicked = getRandomArbitrary(1, nbPages);
        if (pagePicked === 1) {
          // on peut continuer d'utiliser ce data entre 1 et 21
          const indexOfPiece = getRandomArbitrary(1, 21);
          url = getRandomPieceFromPage(data, indexOfPiece);
          return { url }
        } else if (pagePicked === nbPages) {
          //callback with the number to call
          return { pagePicked , lastPage: true}
        } else {
          return { pagePicked }
        }
      } else {
        // on peut continuer d'utiliser ce data
        const numberOfPiecesOnPage = (data.match(/profile-icon-date/g) || []).length;
        const indexOfPiece = getRandomArbitrary(1, numberOfPiecesOnPage);
        url = getRandomPieceFromPage(data, indexOfPiece);
        return { url };
      }
    }
  });
  // if we already got the url, return immediately
  if(urlOrPageNmber.url) return urlOrPageNmber.url;

  if(urlOrPageNmber.pagePicked) {
    return await fetch("https://pixeljoint.com/pixels/profile_tab_icons.asp?id=" + userPjId + "&pg="+ urlOrPageNmber.pagePicked)
      .then((response)=> {
        return response.text();
      }).then(function (data) {
        const numberOfPiecesOnPage = urlOrPageNmber.lastPage? (data.match(/profile-icon-date/g) || []).length : 21;
        const indexOfPiece = getRandomArbitrary(1, numberOfPiecesOnPage);
        return getRandomPieceFromPage(data, indexOfPiece);
      })
  }

} 

function getRandomPieceFromPage(data, indexOfPiece) {
  let url;
  let startIndexUrl = data.indexOf(";'><a href='/") + ";'><a href='/".length;
  let endIndexUrl  = data.indexOf("><img src='/files/icons");
  let body= data;
  for (let i = 0; i < indexOfPiece; i ++) {
    startIndexUrl = body.indexOf(";'><a href='/") + ";'><a href='/".length
    endIndexUrl = body.indexOf("><img src='/files/icons")
    if (i === indexOfPiece -1) {
      url = body.substring(startIndexUrl, endIndexUrl -1);
    } else {
      body = body.slice(endIndexUrl + "><img src='/files/icons".length);
    }
  }
  return pixelJointMainUrl + url;
}

function getRandomArbitrary(min, max) {
  const random = Math.random();
  let randomIndex = Math.floor(random * (max - min + 1) + min)
  while (randomIndex === 1840) {
    randomIndex = Math.floor(Math.random() * (max - min + 1) + min)
    return Math.random() * (max - min) + min;
  }
  return randomIndex;
}