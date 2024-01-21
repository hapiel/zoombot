function getRandomArbitrary(min, max) {
    const random = Math.random();
    let randomIndex = Math.floor(random * (max - min + 1) + min)
    while (randomIndex === 1840) {
      randomIndex = Math.floor(Math.random() * (max - min + 1) + min)
      return Math.random() * (max - min) + min;
    }
    return randomIndex;
  }

module.exports = { getRandomArbitrary}