const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const https = require('https');
const pixelJointUrl = "https://pixeljoint.com";

// register Context Menu
module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('GetPixeljointProfile')
    .setType(ApplicationCommandType.User),
    async execute(client, interaction) {    
      let { username } = interaction.targetUser;
      const nickname = interaction.guild.members.cache.get(interaction.targetUser.id).nickname;
      if(nickname) {
        username = nickname;
      }
      username = username.toLowerCase();
      const searchUserUrl = "https://pixeljoint.com/pixels/members.asp?q=1&v=search&search="+ username +"&pg=1"
      const formData = new FormData();
      formData.append("search", username);
      formData.append("v", "search");
      formData.append("action", "search");
      fetch(searchUserUrl).then(function(response) {
        return response.text();
      }).then(function(data){
        const indexStartString = ">" +  username  + "<";
        data = data.toLowerCase();
        const endEle = data.indexOf(indexStartString);
        console.log(data);
        console.log(endEle)

        const startEle = data.indexOf(indexStartString) - 150;
        console.log(startEle)
        const element = data.substring(startEle, endEle);
        console.log(element)
        const startUrl = element.indexOf("<a href='");
        const endUrl = element.indexOf("' onmouseover");
        if(startUrl !== -1 && endUrl !== -1){
          const profile = pixelJointUrl + element.substring(startUrl + "<a href='".length, endUrl);
          console.log(profile)
          interaction.reply(profile);
        }
      }).catch(function(err){
        console.error(err);
      });
      // get last art piece index
      //https.request(searchUserUrl, getUserProfile.bind(this, function(data){
        //  interaction.reply(data);
      //})).end();
  },
};
// CallbackFunction that get last challenge url on pixeljoint.com
getUserProfile = function(callback, response) {
  console.log("on arrive la ou pas?")
  // get the data as a string instead of a buffer
  response.setEncoding();
  var store = "";
  // on each update, add to the store
  response.on('data', function(d) {
      store += d;
  }); 
  console.log(response)
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