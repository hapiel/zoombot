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
              msg.reply({ content: 'I can\'t handle more than 64 colors properly.' });
            } else {
              // Read a raw array of pixels and save it to a png
              const formattedList = rawPalette.map((color)=> color = hexToRGBA(color)).flat();
              const width = (formattedList.length/4)> 8? 8: formattedList.length/4;
              const height = Math.ceil((formattedList.length/4)/ 8)? Math.ceil((formattedList.length/4)/8): 1;
              sharp(Uint8Array.from(formattedList.concat(new Array((8 -((formattedList.length/4)%8))*4)?.fill(0))), {
                // because the input does not contain its dimensions or how many channels it has
                // we need to specify it in the constructor options
                raw: {
                  width,
                  height,
                  channels: 4
                }
              }).resize(width * 12, height *12, { kernel: sharp.kernel.nearest }).png().toBuffer().then((buffer)=> {
                msg.reply({ content: 'Here you go: ' + rawPalette.length + ' unique colors total:\n', files: [{ attachment: buffer, name: "palette.png" }] });
              });
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
const isValidHex = (hex) => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex)

const getChunksFromString = (st, chunkSize) => st.match(new RegExp(`.{${chunkSize}}`, "g"))

const convertHexUnitTo256 = (hexStr) => parseInt(hexStr.repeat(2 / hexStr.length), 16)

function hexToRGBA(hex, alpha){
    if (!isValidHex(hex)) {throw new Error("Invalid HEX")}
    const chunkSize = Math.floor((hex.length - 1) / 3)
    const hexArr = getChunksFromString(hex.slice(1), chunkSize)
    const [r, g, b, a] = hexArr.map(convertHexUnitTo256)
    return [r, g, b, a];
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

  return '#'+hex;
}
module.exports = { sendScaled, getPalette }