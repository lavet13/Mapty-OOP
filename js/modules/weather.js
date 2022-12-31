import { getJSON } from '../services/fetch.js';
import App from '../script.js';

export default class WeatherAPI {
    static weatherDataForm = new Map();
    static weatherData = new Map(); // overall data about the weather of each workout

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

    static async getWeather(url) {
        try {
            const {
                hourly_units: { temperature_2m: tempType },
                hourly: {
                    time: timeArray,
                    temperature_2m: temperatureArray,
                    weathercode: weatherCodeArray,
                },
            } = await getJSON(url, `Weather cannot be found!`);

            const timeMap = new Map();

            timeArray.forEach((t, index) => {
                timeMap.set(t, [
                    temperatureArray[index],
                    weatherCodeArray[index],
                ]);
            });

            const [temperature, weatherCode] = timeMap.get(
                WeatherAPI.currentTime
            );
            console.log(temperature, weatherCode);

            return {
                temperature,
                tempType,
                weatherState: WeatherAPI.weatherInterpretation.get(weatherCode),
                currentTime: WeatherAPI.currentTime,
            };
        } catch (err) {
            throw err;
        }
    }

    static async addNextWeatherData({ containerWorkouts, newId }) {
        try {
            containerWorkouts
                .querySelectorAll('.workout__weather')
                ?.forEach(weather => weather.remove());

            WeatherAPI.weatherData.forEach(
                ({ temperature, tempType, weatherState }, id) => {
                    containerWorkouts
                        .querySelector(`[data-id="${id}"]`)
                        ?.insertAdjacentHTML(
                            'beforeend',
                            `
                            <div class="workout__details workout__weather">
                                <span class="workout__icon">️</span>
                                <span class="workout__value">${weatherState}</span>
                                <span class="workout__unit"></span>
                            </div>
                            <div class="workout__details workout__weather">
                                <span class="workout__icon">🌡️</span>
                                <span class="workout__value">${temperature}</span>
                                <span class="workout__unit">${tempType}</span>
                            </div>   
                        `
                        );
                }
            );

            const { coords } = App.workouts.find(({ id }) => id === newId);

            const { temperature, tempType, weatherState } =
                await WeatherAPI.getWeather(WeatherAPI.weatherURL(...coords));

            WeatherAPI.weatherData.set(newId, {
                temperature,
                tempType,
                weatherState,
            });

            containerWorkouts
                .querySelector(`[data-id="${newId}"]`)
                ?.insertAdjacentHTML(
                    'beforeend',
                    `
                    <div class="workout__details workout__weather">
                        <span class="workout__icon">️</span>
                        <span class="workout__value">${weatherState}</span>
                        <span class="workout__unit"></span>
                    </div>
                    <div class="workout__details workout__weather">
                        <span class="workout__icon">🌡️</span>
                        <span class="workout__value">${temperature}</span>
                        <span class="workout__unit">${tempType}</span>
                    </div>   
                    `
                );

            console.log(WeatherAPI.weatherData);
        } catch (err) {
            throw err;
        }
    }

    static async renderWeather({ containerWorkouts }) {
        try {
            const workouts = Array.from(
                containerWorkouts.querySelectorAll('.workout'),
                async work => {
                    const { coords } = App.workouts.find(
                        ({ id }) => id === work.dataset.id
                    );

                    const { temperature, tempType, weatherState } =
                        await WeatherAPI.getWeather(
                            WeatherAPI.weatherURL(...coords)
                        );

                    WeatherAPI.weatherData.set(work.dataset.id, {
                        temperature,
                        tempType,
                        weatherState,
                    });

                    return { temperature, tempType, weatherState, work };
                }
            );

            const resultPromiseAll = await Promise.all(workouts);

            containerWorkouts
                .querySelectorAll('.workout__weather')
                ?.forEach(weather => weather.remove());

            resultPromiseAll.forEach(
                ({ temperature, tempType, weatherState, work }) => {
                    work.insertAdjacentHTML(
                        'beforeend',
                        `
                        <div class="workout__details workout__weather">
                            <span class="workout__icon">️</span>
                            <span class="workout__value">${weatherState}</span>
                            <span class="workout__unit"></span>
                        </div>
                        <div class="workout__details workout__weather">
                            <span class="workout__icon">🌡️</span>
                            <span class="workout__value">${temperature}</span>
                            <span class="workout__unit">${tempType}</span>
                        </div>
                    `
                    );
                }
            );
        } catch (err) {
            throw err;
        }
    }

    static reRenderWeather({ workoutContainer, id }) {
        const [[, weatherState], [temperatureIcon, temperature, tempType]] =
            WeatherAPI.weatherDataForm.get(id);

        workoutContainer = document.querySelector(`[data-id="${id}"]`);

        workoutContainer?.insertAdjacentHTML(
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
