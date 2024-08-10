const sharp = require("sharp");
const fetch = require('node-fetch');
const keyList = [];

sendScaled = async function (msg, key, width, height, isGif) {
  if (keyList.find(e => e === key) === undefined) {
    keyList.push(key);
    let buffer = null;
    const attachments = msg.attachments ? msg.attachments : msg.targetMessage.attachments;
    const url = attachments.get(key).url;

    await fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch the image. Status code: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then(imageBuffer => {
        if (isGif) {
          // The 'imageBuffer' now contains the binary data of the image.
          sharp(Buffer.from(imageBuffer), { animated: true })
            .resize(Number(width * 2), Number(height * 2), { kernel: sharp.kernel.nearest })
            .gif()
            .toBuffer()
            .then(buffer => {
              msg.reply({ content: '', files: [{ attachment: buffer, name: "2X.gif" }] });
            });
        }
        else {
          sharp(Buffer.from(imageBuffer))
            .resize(Number(width * 2), Number(height * 2), { kernel: sharp.kernel.nearest })
            .png()
            .toBuffer()
            .then(buffer => {
              msg.reply({ content: '', files: [{ attachment: buffer, name: "2X.png" }] });
            });
        }
      })
      .catch(error => {
        console.error('Error fetching the image:', error);
      });
  }
}


getPalette = async function (msg) {
  const data = await sharp('input.png')
    .ensureAlpha()
    .extractChannel(3)
    .toColourspace('b-w')
    .raw({ depth: 'ushort' })
    .toBuffer();
}
module.exports = { sendScaled }