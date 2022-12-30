import { getJSON } from '../services/fetch.js';

export default class WeatherAPI {
    static weatherDataForm = new Map();

    static currentTime;

    static timeForWeatherURL = function (latitude, longitude) {
        return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Europe%2FMoscow`;
    };

    static weatherURL = function (latitude, longitude) {
        return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&hourly=weathercode&timezone=Europe%2FMoscow`;
    };

    static weatherInterpretation = new Map([
        [0, '️️☀️️'],
        [1, '️️☀️'],
        [2, '🌤️'],
        [3, '⛅'],
        [45, '🌫️'],
        [48, '🌫️'],
        [51, '☔(light)'],
        [53, '☔(moderate)'],
        [55, '☔(dense)'],
        [56, '☔🥶(light)'],
        [57, '☔🥶(dense)'],
        [61, '🌧️(slight)'],
        [63, '🌧️(moderate)'],
        [65, '🌧️(heavy)'],
        [66, '🧊🌧️(light)'],
        [67, '🧊🌧️(heavy)'],
        [71, '🌨️(slight)'],
        [73, '🌨️(moderate)'],
        [75, '🌨️(heavy)'],
        [77, '❄ grains'],
        [80, '🚿🌧️(slight)'],
        [81, '🚿🌧️(moderate)'],
        [82, '🚿🌧️(violent)'],
        [85, '🚿🌨️(slight)'],
        [86, '🚿🌨️(heavy)'],
        [95, '⛈️(slight)'],
        [96, '⛈️(slight hail)'],
        [99, '⛈️(heavy hail)'],
    ]);

    constructor() {}

    static async getTimeForWeather(url) {
        try {
            const {
                current_weather: { time: currentTime },
            } = await getJSON(url, `Cannot get the time 😀`);

            return currentTime;
        } catch (err) {
            throw err;
        }
    }

    static reRenderWeather({ workoutContainer, id }) {
        const [[, weatherState], [temperatureIcon, temperature, tempType]] =
            WeatherAPI.weatherDataForm.get(id);

        workoutContainer = document.querySelector(`[data-id="${id}"]`);

        workoutContainer.insertAdjacentHTML(
            'beforeend',
            `
            <div class="workout__details workout__weather">
                <span class="workout__icon">️</span>
                <span class="workout__value">${weatherState}</span>
                <span class="workout__unit"></span>
            </div>
            <div class="workout__details workout__weather">
                <span class="workout__icon">${temperatureIcon}</span>
                <span class="workout__value">${temperature}</span>
                <span class="workout__unit">${tempType}</span>
            </div>
        `
        );

        WeatherAPI.weatherDataForm.delete(id);
    }
}
