const pixelJointUrl = "https://pixeljoint.com";

function getPjName(user, guild){
  if(!user) return;
  let { username } = user;
  const nickname = guild.members.cache.get(user.id).nickname;
  if(nickname) {
    username = nickname;
  } else if(user.globalName) {
    username = user.globalName;
  }
  return username;
}


async function getProfileUrlFromPj(username) {
      username = username.toLowerCase();
      const searchUserUrl = "https://pixeljoint.com/pixels/members.asp?q=1&v=search&search="+ username +"&pg=1"
      const formData = new FormData();
      formData.append("search", username);
      formData.append("v", "search");
      formData.append("action", "search");
      const response = await fetch(searchUserUrl).then(function(response) {
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
          return pixelJointUrl + element.substring(startUrl + "<a href='".length, endUrl);
        } else {
            return "No profile found, sorry"
        }
    }).catch(function(err){
        console.error(err);
    });
    return response;
}

module.exports = { getProfileUrlFromPj, getPjName }