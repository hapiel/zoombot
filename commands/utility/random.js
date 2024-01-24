const { SlashCommandBuilder } = require('discord.js');
const { getPjName, getProfileUrlFromPj } = require('../../common/profileService');
const pixelJointUrl = "https://pixeljoint.com/pixels/new_icons.asp?ob=date";
const pixelJointPixelartUrl = "https://pixeljoint.com/pixelart/";
const pixelJointMainUrl = "https://pixeljoint.com/"
const pixelArtInactiveString = "ACHTUNG! PIXEL ART INACTIVE!";

const DATE_OF_PIECE_SCRAP = "<div class='profile-icon-date'>";
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
    .addIntegerOption(option => option.setName('beforeyear').setDescription('Only from pieces made before the specified year').setMinValue(2005).setMaxValue(new Date().getFullYear()))
    .addBooleanOption(option => option.setName('private').setDescription('Only you will see the random piece')),
  async execute(interaction) {
    // get last art piece index
    await interaction.deferReply({ephemeral: interaction.options.getBoolean('private')});
    const afterYear = interaction.options.getInteger('afteryear');
    const beforeYear = interaction.options.getInteger('beforeyear');
    const artistname = interaction.options.getString('artistname') || getPjName(interaction.options.getUser('artist'), interaction.guild);
    const debutIndex = afterYear ? parseInt(Object.keys(PIECE_INDEX_BY_YEAR)[Object.values(PIECE_INDEX_BY_YEAR).indexOf(afterYear)]) : 1000;
    let endIndex = parseInt(Object.keys(PIECE_INDEX_BY_YEAR)[Object.values(PIECE_INDEX_BY_YEAR).indexOf(beforeYear)]);
    let url;
    // get url
    console.log(afterYear)
    console.log(beforeYear)
    if (afterYear && afterYear < beforeYear) {
      return interaction.editReply({content: "I'm sorry, you're asking for something impossible"});
    }
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
      // check for data pool
      getDataPoolForGivenYear(data, afterYear, beforeYear, nbPages, userPjId).then( response => {
        if (nbPages > 1) {
          let firstPage = 1;
          let lastPage = nbPages;
          if(response && response.pageOfFirstBeforeYear) {
            firstPage = response.pageOfFirstBeforeYear;
          }
          if(response && response.pageOfLastAfterYear) {
            lastPage = response.pageOfLastAfterYear;
          }
          const pagePicked = getRandomArbitrary(firstPage, lastPage);
          let firstIndexOfPiece = 1;
          let lastIndexOfPiece = 21;
          if (pagePicked === 1) {
            // we don't need more fetch calls
            if (beforeYear) { firstIndexOfPiece = response.firstIndexBeforeYear }
            if (afterYear) { lastIndexOfPiece = response.lastIndexAfterYear }
            const indexOfPiece = getRandomArbitrary(firstIndexOfPiece, lastIndexOfPiece);
            url = getPieceFromPage(data, indexOfPiece, afterYear, beforeYear);
            return { url }
          } else if (pagePicked === lastPage) {
            //callback with the number to call
            return { pagePicked , lastPage: true, firstIndexOfPiece, lastIndexOfPiece}
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
      })
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

async function getDataPoolForGivenYear(dataFirstPage, afterYear, beforeYear, nbPages, userPjId){
  let response = {};
  if (beforeYear) {
    const yearOfTheLastPieceOfThePage = getYearOfPiece(dataFirstPage, -1);
    if(nbPages === 1){
      if (yearOfTheLastPieceOfThePage > beforeYear){
        // No piece found before this year
        console.log("No pieces from that artist beore this year were found on pixeljoint")
        return {error: "No pieces from that artist beore this year were found on pixeljoint"}
      } else {
        //rechercher la premiere (derniere) de l annee souhaitee
        response.pageOfFirstBeforeYear = 1;
        response.indexOfFirstBeforeYear = findFirstPieceBeforeYear(dataFirstPage, beforeYear);
      }
    }else {
      for(let i = 1; i <= nbPages; i++) {
        let index = await fetch("https://pixeljoint.com/pixels/profile_tab_icons.asp?id=" + userPjId + "&pg="+ i)
        .then(function (response) {
          return response.text();
        }).then(function (data) {
          const yearOfTheLastPieceOfThePage = getYearOfPiece(data, -1);
          if (yearOfTheLastPieceOfThePage > beforeYear) {
            return -1;
          } else {
          // parcourir chaque depuis la derniere pour trouver si une oeuvre avant est presente
          //si oui, remonter pour trouver la premiere (derniere) de l annee souhaitee
          //sinon, aucune oeuvre de lartiste
          return findFirstPieceBeforeYear(data, beforeYear);
          }          
        });
        if (index !== -1) {
          response.pageOfFirstBeforeYear = i;
          response.indexOfFirstBeforeYear = index;
          break;
        }
      }

    }
    //if we want all pieces before given year, we must find the last piece submitted that year 
  }
  if (afterYear) {
    //first piece
    //if we want all pieces after given year, we have to find first piece submitted that year
    const yearOfTheFirstPieceOfThePage = getYearOfPiece(data, 1);
    if (yearOfTheFirstPieceOfThePage < afterYear) {
      // AUCUNE OEUVRE DE LARTISTE APRES TELLE ANNEE
      return {error: "No pieces from that artist after this year were found on pixeljoint"}
    } else {
      if (nbPages === 1 ){
        response.indexOfLastAfterYear = findLastPieceAfterYear(data, afterYear);
        response.pageOfLastAfterYear = 1;
        // parcourir toutes les oeuvres pour trouver la derniere (premiere) de l annee souhaitee
      } else {
        for(let i = 1; i <= nbPages; i++) {
          let index = await fetch("https://pixeljoint.com/pixels/profile_tab_icons.asp?id=" + userPjId + "&pg="+ i)
          .then(function (response) {
            return response.text();
          }).then(function (data) {
            const yearOfTheFirstPieceOfThePage = getYearOfPiece(data, 1);
            if (yearOfTheFirstPieceOfThePage >= afterYear) {
              return -1;
            } else {
            // parcourir chaque depuis la derniere pour trouver si une oeuvre avant est presente
            //si oui, remonter pour trouver la premiere (derniere) de l annee souhaitee
            //sinon, aucune oeuvre de lartiste
            return findLastPieceAfterYear(data, afterYear);
            }          
          });
          if (index !== -1) {
            response.pageOfLastAfterYear = i;
            response.indexOfLastAfterYear = index;
            break;
          }
        }
      }
    }
  }
}

function findLastPieceAfterYear(data, afterYear){
  let lastIndexAfterYear = -1;
  let indexAfter = 1;
  let startIndexUrl = data.indexOf(";'><a href='/") + ";'><a href='/".length;
  let endIndexUrl  = data.indexOf("><img src='/files/icons");
  let pjPieceYear = afterYear - 1;
  if (afterYear) {
    while (pjPieceYear < afterYear || startIndexUrl === -1) {
      pjPieceYear = getYearOfPiece(data, indexAfter);
      startIndexUrl = data.indexOf(";'><a href='/", startIndexUrl + 1) + ";'><a href='/".length;
      endIndexUrl = data.indexOf("><img src='/files/icons", endIndexUrl + 1);
      indexAfter++;
    }
    if(startIndexUrl === -1)  {
      lastIndexAfterYear = -1;
    } else {
      lastIndexAfterYear = indexAfter -1;
    }
  }
  return lastIndexAfterYear;
}

function findFirstPieceBeforeYear(data, beforeYear){
  let indexBefore = 1;
  let startIndexUrl = data.indexOf(";'><a href='/") + ";'><a href='/".length;
  let endIndexUrl  = data.indexOf("><img src='/files/icons");
  let pjPieceYear = beforeYear + 1;
  let firstIndexBeforeYear = -1;

  if(beforeYear) {
    while (pjPieceYear > beforeYear || startIndexUrl === -1) {
      pjPieceYear = getYearOfPiece(data, indexBefore);
      startIndexUrl = data.indexOf(";'><a href='/", startIndexUrl+1) + ";'><a href='/".length;
      endIndexUrl = data.indexOf("><img src='/files/icons", endIndexUrl + 1);
      indexBefore ++;
    }
    if(startIndexUrl === -1)  {
      firstIndexBeforeYear = -1;
    } else {
      firstIndexBeforeYear = indexBefore -1;
    }
  }

  return firstIndexBeforeYear;
}

function getYearOfPiece(data, index){
  let startIndexDate;
  if (index === -1)   {
    startIndexDate = data.lastIndexOf(DATE_OF_PIECE_SCRAP)+DATE_OF_PIECE_SCRAP.length;
  } else {
    startIndexDate = data.indexOf(DATE_OF_PIECE_SCRAP, index)+DATE_OF_PIECE_SCRAP.length;
  }
  const date = data.substring(startIndexDate + 10);
  return date.split('/')[2];
}

function getPieceFromPage(data, indexOfPiece) {
  let url;
  let startIndexUrl = data.indexOf(";'><a href='/") + ";'><a href='/".length;
  let endIndexUrl  = data.indexOf("><img src='/files/icons");
  let body = data;
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