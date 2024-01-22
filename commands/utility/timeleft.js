const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timeleft')
		.setDescription('Replies with the time left until the end of the weekly challenge'),
	async execute(interaction) {
    const now = new Date();
    const end = getNextDayOfTheWeek("mon", true);
    const distance = end - now;
    const _second = 1000;
    const _minute = _second * 60;
    const _hour = _minute * 60;
    const _day = _hour * 24;
    const days = Math.floor(distance / _day);
    const hours = Math.floor((distance % _day) / _hour);
    const minutes = Math.floor((distance % _hour) / _minute);
    const seconds = Math.floor((distance % _minute) / _second);
    const response = "You still have " + days + "d " + hours + "h "
    + minutes + "m " + seconds + "s to complete and submit your entry !";
    interaction.reply({content: response});
	},
    
};
function getNextDayOfTheWeek(dayName, excludeToday = true, refDate = new Date()) {
  const dayOfWeek = ["sun","mon","tue","wed","thu","fri","sat"]
                    .indexOf(dayName.slice(0,3).toLowerCase());
  if (dayOfWeek < 0) return;
  refDate.setHours(7,0,0,0);
  refDate.setDate(refDate.getDate() + +!!excludeToday + 
                  (dayOfWeek + 7 - refDate.getDay() - +!!excludeToday) % 7);
  return refDate;
}