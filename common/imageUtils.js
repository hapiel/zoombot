const sharp = require("sharp");
const fetch = require('node-fetch');
const keyList = [];

sendScaled = async function (msg, key, width, height, isGif) {
  if (keyList.find(e => e === key) === undefined) {
    keyList.push(key);
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

getPalette = async function (msg, key, isGif) {
  if (keyList.find(e => e === key) === undefined) {
    keyList.push(key);
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
          msg.reply({ content: 'Not supporting Gifs just now.' });
        }
        else {
          sharp(Buffer.from(imageBuffer)).raw().toBuffer({ resolveWithObject: true }).then(data => {
            const rawPalette = this.getListOfHexColoursFromBuffer(data.data);
            if (rawPalette.length > 64) {
              msg.reply({ content: 'I can\t handle more than 64 colors properly and neither can you, probably.' });
            } else {
              let formattedList = '';
              rawPalette.forEach((color, index) => {
                if (index === 0) {
                  formattedList = color;
                } else if (index % 8 === 0) {
                  formattedList = formattedList + ' ; ' + color + '\n';
                } else {
                  formattedList = formattedList + ' ; ' + color;
                }
              });
              msg.reply({ content: 'Only Hex codes for now, maybe fancier stuff will comes later.\nHere you go: ' + rawPalette.length + ' unique colors total:\n' + formattedList });
            }
          })
        }
      })
      .catch(error => {
        console.error('Error fetching the image:', error);
      });
  }
}

getListOfHexColoursFromBuffer = function (data) {
  const pixels = [];
  let i = 0;
  while (i < data.length) {
    const pixel = rgba2hex('rgba(' + data[i + 0] + ',' + data[i + 1] + ',' + data[i + 2] + ',' + data[i + 3] + ')');
    pixels.push(pixel);
    i = i + 4;
  }
  return [...new Set(pixels)];
}

function rgba2hex(orig) {
  var a,
    rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
    alpha = (rgb && rgb[4] || "").trim(),
    hex = rgb ?
      (rgb[1] | 1 << 8).toString(16).slice(1) +
      (rgb[2] | 1 << 8).toString(16).slice(1) +
      (rgb[3] | 1 << 8).toString(16).slice(1) : orig;

  // multiply before convert to HEX
  a = ((alpha) | 1 << 8).toString(16).slice(1)
  hex = hex + a;

  return hex;
}
module.exports = { sendScaled, getPalette }