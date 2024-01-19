const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const pixelJointUrl = "https://pixeljoint.com";

// register Context Menu
module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('GetPixeljointProfilePrivate')
    .setType(ApplicationCommandType.User),
    async execute(client, interaction) {    
      if (interaction.targetUser.bot) return;
      let { username } = interaction.targetUser;
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
        const startEle = data.indexOf(indexStartString) - 150;
        const element = data.substring(startEle, endEle);
        const startUrl = element.indexOf("<a href='");
        const endUrl = element.indexOf("' onmouseover");
        if(startUrl !== -1 && endUrl !== -1){
          const profile = pixelJointUrl + element.substring(startUrl + "<a href='".length, endUrl);
          interaction.reply({content: profile, ephemeral: true});
        }
      }).catch(function(err){
        console.error(err);
      });
  },
};