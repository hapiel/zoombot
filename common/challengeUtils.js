const { getRandomArbitrary } = require("./mathUtils");

const pixelJointUrl = "https://pixeljoint.com/";
const pixelJointCallengesUrl = "https://pixeljoint.com/pixels/challenges.asp";
// CallbackFunction that get last challenge url on pixeljoint.com
getLastWeeklyChallengeVoteUrl = async function() {
    // get the data as a string instead of a buffer
    return await fetch(pixelJointCallengesUrl).then(function(response) {
        return response.text();
      }).then(function(data){
        const indexStartString = "It's time to <a href='"
        const startUrl = data.indexOf(indexStartString);
        const endUrl = data.indexOf("'>vote for the latest pixel art challenge");
        if(startUrl !== -1 && endUrl !== -1){
          return challengeUrl = pixelJointUrl+data.substring(startUrl + indexStartString.length, endUrl);
        }
      });
  }

  // CallbackFunction that get last challenge url on pixeljoint.com
getLastWeeklyChallengeResultsUrl = async function() {
    // get the data as a string instead of a buffer
    return await fetch(pixelJointUrl).then(function(response) {
        return response.text();
      }).then(function(data){
        const indexStartString = "src='/files/icons/challenge_winner.png' width='50' height='50' alt='Icon' border='0' /></a></div><div class='subheader'><a href=\""
        const startUrl = data.indexOf(indexStartString);
        const endUrl = data.indexOf("\">Challenge Awards");
        if(startUrl !== -1 && endUrl !== -1){
          return challengeUrl = pixelJointUrl+data.substring(startUrl + indexStartString.length, endUrl);
        }
      });
  }

getLastWeeklyChallengeUrl = async function() {
    return await fetch(pixelJointUrl).then(function(response) {
        return response.text();
      }).then(function(data){

        const indexStartString = "challenge_start.png' width='50' height='50' alt='Icon' border='0' /></a></div><div class='subheader'><a href=\"";
        const startUrl = data.indexOf(indexStartString);
        const endUrl = data.indexOf(">Pixel Art Challenge");
        if(startUrl !== -1 && endUrl !== -1){
          return pixelJointUrl + data.substring(startUrl + indexStartString.length, endUrl -1);
        }
    });
}
getRandomWeeklyChallengeUrl = async function() {
    return await fetch(pixelJointCallengesUrl).then(function(response) {
        return response.text();
      }).then(function(data){
            // get last challenge id
        const startIndexId = data.indexOf("a href=\"/pixels/challenge_item.asp?id=") +"a href=\"/pixels/challenge_item.asp?id=".length;
        const lastIndexPossible = data.substring(startIndexId, startIndexId + 4)
        const index = getRandomArbitrary(1000, lastIndexPossible);
        return "https://pixeljoint.com/pixels/challenge_item.asp?id=" + index;
      }
    )

}

module.exports = { getLastWeeklyChallengeVoteUrl, getLastWeeklyChallengeResultsUrl, getLastWeeklyChallengeUrl }