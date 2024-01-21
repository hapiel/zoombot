const Jimp = require("jimp");
const sharp = require("sharp");
const fetch = require('node-fetch');
const keyList = [];

async function zoom(msg, key, width, height, isGif){
  if (keyList.find(e => e === key) === undefined){
    keyList.push(key);
    let buffer = null;
    if (isGif) {
    let url = msg.attachments.get(key).url;
    await fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch the image. Status code: ${response.status}`);
      }
      return response.arrayBuffer();
    })
    .then(imageBuffer => {
      // The 'imageBuffer' now contains the binary data of the image.
      sharp(Buffer.from(imageBuffer), {animated: true})
      .resize(Number(width *2), Number(height *2), {kernel: sharp.kernel.nearest })
      .gif()
      .toBuffer().then(buffer => {
        msg.reply({content:'' , files: [{ attachment: buffer, name: "2X.gif" }]});
      });
    })
    .catch(error => {
      console.error('Error fetching the image:', error);
    });

    }else {
      let image = await Jimp.read(msg.attachments.get(key).url);
      if (width <= 150 && height <= 100){
        await image.scale(4, Jimp.RESIZE_NEAREST_NEIGHBOR );
      } else {
        await image.scale(2, Jimp.RESIZE_NEAREST_NEIGHBOR );
      }
      buffer = await image.getBufferAsync(Jimp.MIME_PNG);
      msg.reply({content:'' , files: [{ attachment: buffer }]});
    }
  }
}