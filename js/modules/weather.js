// export default class Weather {
//     constructor() {}
// }

const timeForWeatherURL = function (latitude, longitude) {
    return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Europe%2FMoscow`;
};

const weatherURL = function (latitude, longitude) {
    return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&hourly=weathercode&timezone=Europe%2FMoscow`;
};

export { timeForWeatherURL, weatherURL };
