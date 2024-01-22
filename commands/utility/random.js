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
    .addUserOption(option => option.setName('artist').setDescription('Random art piece will only comes from specified artist (Discord User)'))
    .addStringOption(option => option.setName('artistname').setDescription('Random art piece will only comes from specified artist (Enter the username from pixeljoint manually)'))
    .addIntegerOption(option => option.setName('afteryear').setDescription('Only from pieces made after the specified year').setMinValue(2005).setMaxValue(new Date().getFullYear()))
    .addIntegerOption(option => option.setName('beforeyear').setDescription('Only from pieces made before the specified year').setMinValue(2005).setMaxValue(new Date().getFullYear())),
  async execute(interaction) {
    // get last art piece index
    await interaction.deferReply({ephemeral: false});
    const afterYear = interaction.options.getInteger('afteryear');
    const beforeYear = interaction.options.getInteger('beforeyear');
    const artistname = interaction.options.getString('artistname') || getPjName(interaction.options.getUser('artist'), interaction.guild);
    const debutIndex = afterYear ? parseInt(Object.keys(PIECE_INDEX_BY_YEAR)[Object.values(PIECE_INDEX_BY_YEAR).indexOf(afterYear)]) : 1000;
    let endIndex = parseInt(Object.keys(PIECE_INDEX_BY_YEAR)[Object.values(PIECE_INDEX_BY_YEAR).indexOf(beforeYear)]);
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
      url = await getRandomPieceFromArtist(artistname, afterYear, beforeYear);
    }
    // build message
    let message = '';
    if (!url.startsWith("No artist found with username")){
      message = 'Here is a random piece';
      if(artistname) {
        message += " from "+ artistname;
      }
      if(afterYear && beforeYear){
        if(afterYear == beforeYear){
          message += " made during the year "+ afterYear;
        }else {
          message += " made between the year "+ afterYear + " and " + beforeYear;
        }
      } else if (afterYear) {
        message += " made since the year "+ afterYear
      } else if (beforeYear) {
        message += " made before the year "+ beforeYear
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

/**
 * 
 * @param {*} artistname 
 * @param {*} indexFromDebutYear 
 * @param {*} endIndex first index
 * @returns 
 */
async function getRandomPieceFromArtist(artistname, afterYear, beforeYear) {
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
      let dataForYear;
      // check for data pool
      if (beforeYear || afterYear) {
        dataForYear = await getInfo(data, afterYear, beforeYear, nbPages)
      }

      //
      if (nbPages > 1) {
        const pagePicked = getRandomArbitrary(1, nbPages);
        if (pagePicked === 1) {
          // we don't need more fetch calls
          const indexOfPiece = getRandomArbitrary(1, 21);
          url = getPieceFromPage(data, indexOfPiece, afterYear, beforeYear);
          console.log(data)
          return { url }
        } else if (pagePicked === nbPages) {
          //callback with the number to call
          return { pagePicked , lastPage: true}
        } else {
          return { pagePicked }
        }
      } else {
        // we don't need more fetch calls
        const numberOfPiecesOnPage = (data.match(/profile-icon-date/g) || []).length;
        const indexOfPiece = getRandomArbitrary(1, numberOfPiecesOnPage);
        url = getPieceFromPage(data, indexOfPiece, indexFromDebutYear, indexOfEndYear);
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
        return getPieceFromPage(data, indexOfPiece, indexFromDebutYear, indexOfEndYear);
      })
  }
}

async function getInfo(dataFirstPage, afterYear, beforeYear, nbPages){
  if (beforeYear) {
    const startIndexDate = dataFirstPage.lastIndexOf("<div class='profile-icon-date'>")+"<div class='profile-icon-date'>".length;
    const date = dataFirstPage.substring(startIndexDate + 10);
    const yearOfTheLastPieceOfThePage = date.split('/')[2];
    if(nbPages === 1){
      if (yearOfTheLastPieceOfThePage > beforeYear){
        //Aucun oeuvre de l artiste avant telle annee
      } else {
        //rechercher la premiere (derniere) de l annee souhaitee
      }
    }else {
      // parcourir chaque depuis la derniere pour trouver si une oeuvre avant est presente
      //si oui, remonter pour trouver la premiere (derniere) de l annee souhaitee
      //sinon, aucune oeuvre de lartiste
    }
    //if we want all pieces before given year, we must find the last piece submitted that year 
  }
  if (afterYear) {
    //first piece
    //if we want all pieces after given year, we have to find first piece submitted that year
    const startIndexDate = dataFirstPage.indexOf("<div class='profile-icon-date'>")+"<div class='profile-icon-date'>".length;
    const date = dataFirstPage.substring(startIndexDate + 10);
    const yearOfTheFirstPieceOfThePage = date.split('/')[2];
    if (yearOfTheFirstPieceOfThePage < afterYear) {
      // AUCUNE OEUVRE DE LARTISTE APRES TELLE ANNEE
    } else {
      if (nbPages === 1 ){
        // parcourir toutes les oeuvres pour trouver la derniere (premiere) de l annee souhaitee
      } else {
        //parcourir chaque page ppour trouver la derniere (premiere) de l annee souhaitee
      }
    }
  }
}

function getPieceFromPage(data, indexOfPiece, afterYear, beforeYear) {
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