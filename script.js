'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// SORT options
let isSortAscending;
let sortType = 'distance';

// SORT BUTTON
const sortBtn = document.querySelector('.btn--sort');
const selectSort = document.querySelector('.sort-selector');

class ModalMessage {
    static messages = [];
    static #modalContainer = document.querySelector('.modal');
    static #modalCloseBtn =
        ModalMessage.#modalContainer.querySelector('.modal__btn-close');
    #timeout;

    constructor(msg, seconds = 2) {
        this._msg = msg;
        this._seconds = seconds;

        this._insertMessage();
        ModalMessage.#modalCloseBtn.addEventListener(
            'click',
            this._closeModal.bind(this)
        );

        ModalMessage.messages.at(-1)?.cancelTimeout();
        ModalMessage.messages.push(this);
        if (ModalMessage.messages.length === 2)
            ModalMessage.messages.splice(0, 1);
    }

    _insertMessage() {
        ModalMessage.#modalContainer.querySelector('.modal__content') &&
            ModalMessage.#modalContainer.removeChild(
                ModalMessage.#modalContainer.querySelector('.modal__content')
            );

        ModalMessage.#modalContainer.insertAdjacentHTML(
            'beforeend',
            `<div class="modal__content">${this._msg}</div>`
        );
    }

    cancelTimeout() {
        clearTimeout(this.#timeout);
    }

    openModal() {
        if (ModalMessage.#modalContainer.matches('.hidden')) {
            ModalMessage.#modalContainer.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        this.#timeout = setTimeout(
            this._closeModal.bind(this),
            this._seconds * 1000
        );
    }

    _closeModal(e) {
        e?.preventDefault();

        if (!ModalMessage.#modalContainer.matches('.hidden')) {
            ModalMessage.#modalContainer.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
}

class Workout {
    date = new Date().toISOString();

    constructor(distance, duration, coords) {
        this.distance = distance; // in km
        this.duration = duration; // in min
        this.coords = coords; // [lat, lng]
    }

    setId(id) {
        this.id = id;
        return this;
    }

    _setProperty(firstVal, secondVal) {
        let value;

        this === 'running' && (value = firstVal);
        this === 'cycling' && (value = secondVal);

        return value ?? 'no-value';
    }

    _setDescription(isoString) {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const date = new Date(isoString);
        const getMonth = date => months[date.getMonth()];
        const getDate = date => String(date.getDate()).padStart(2, 0);

        this.description = `${this._setProperty.call(
            this.type,
            '🏃‍♂️ Running',
            '🚴‍♀️Cycling'
        )} on ${getMonth(date)} ${getDate(date)}`;
    }

    addMarkToMap() {
        // console.log(App.getMap()); // it will be undefined as we trying to get map
        // that isn't created yet(first glimpse of asynchronous JavaScript),
        // so it's not created right at the beginning when the application is first loaded.
        // so it takes some time.

        L.marker(this.coords)
            .addTo(App.getMap())
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false, // prevent the default behavior of the popup closing when another popup is opened
                    closeOnClick: false, // prevent whenever user clicks on the map
                    className: `${this._setProperty.call(
                        this.type,
                        'running-popup',
                        'cycling-popup'
                    )}`,
                })
            )
            .setPopupContent(this.description)
            .openPopup();
        return this;
    }

    render() {
        const html = `
        <li class="workout workout--${this._setProperty.call(
            this.type,
            'running',
            'cycling'
        )}" data-id="${this.id}">
            <h2 class="workout__title">${this.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${this._setProperty.call(
                    this.type,
                    '🏃‍♂️',
                    '🚴‍♀️'
                )}</span>
                <span class="workout__value">${this.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${this.duration}</span>
                <span class="workout__unit">min</span>
            </div>
            <div class="workout__details workout__energy">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${this._setProperty.call(
                    this.type,
                    this.pace,
                    this.speed
                )}</span>
                <span class="workout__unit">${this._setProperty.call(
                    this.type,
                    'min/km',
                    'km/h'
                )}</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">${this._setProperty.call(
                    this.type,
                    '🦶🏼',
                    '⛰'
                )}</span>
                <span class="workout__value">${this._setProperty.call(
                    this.type,
                    this.cadence,
                    this.elevationGain
                )}</span>
                <span class="workout__unit">${this._setProperty.call(
                    this.type,
                    'spm',
                    'm'
                )}</span>
            </div>
            <button class="btn btn--edit"><span>📝</span>Edit</button>
            <button class="btn btn--del"><span>❌</span>Delete</button>
        </li>`;

        form.insertAdjacentHTML('afterend', html);
        return this;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(distance, duration, coords, cadence) {
        super(+distance, +duration, coords);
        this.cadence = +cadence;
        this._calcPace();
        this._setDescription(this.date);
    }

    _calcPace() {
        // min/km
        this.pace = (this.duration / this.distance).toFixed(1);
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(distance, duration, coords, elevationGain) {
        super(+distance, +duration, coords);
        this.elevationGain = +elevationGain;
        this._calcSpeed();
        this._setDescription(this.date);
    }

    _calcSpeed() {
        // km/h
        this.speed = (this.distance / (this.duration / 60)).toFixed(1);
        return this.speed;
    }
}

////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
class App {
    static workouts = [];
    static #id = 0n;
    static #map;
    static #mapEvent;
    static #mapZoomLevel = 13;

    weatherDataForm = new Map();

    #weatherInterpretation = new Map([
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

    _timeForWeatherURL = function (latitude, longitude) {
        return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Europe%2FMoscow`;
    };

    _weatherURL = function (latitude, longitude) {
        return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&hourly=weathercode&timezone=Europe%2FMoscow`;
    };

    constructor() {
        (async () => {
            try {
                const position = await this.getPosition();
                const { latitude, longitude } = position.coords;

                this._loadMap(latitude, longitude);

                this.currentTime = await this.getTimeForWeather(
                    this._timeForWeatherURL(latitude, longitude)
                );

                // await this.getWeather(this._weatherURL(latitude, longitude)); // get your own weather conditions

                this._getLocalStorage();

                this._hideElement(containerWorkouts, sortBtn);
                this._hideElement(containerWorkouts, selectSort);

                await this.renderWeather();

                await this.timeUpdate({
                    time: this._timeForWeatherURL(latitude, longitude),
                    weather: this._weatherURL(latitude, longitude),
                });
            } catch (err) {
                console.log(err);
                new ModalMessage(`${err.message}`, 10).openModal();
            }
        })();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener(
            'click',
            this._moveToPopup.bind(this)
        );
        sortBtn.addEventListener('click', this._sort.bind(this));
        selectSort.addEventListener('change', this._typeOfSort.bind(this));
    }

    // COUNTER
    static #incrementId() {
        return String(this.#id++);
    }

    static setId(id) {
        this.#id = id;
    }

    static getId() {
        return this.#id;
    }

    // MAP
    static getMap() {
        return this.#map;
    }

    static setMap(map) {
        this.#map = map;
    }

    // MAP_EVENT
    static getMapEvent() {
        return this.#mapEvent;
    }

    static setMapEvent(mapE) {
        this.#mapEvent = mapE;
    }

    // MAP_ZOOM
    static getMapZoomLevel() {
        return this.#mapZoomLevel;
    }

    getPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    }

    async getJSON(url, msg = `Something went wrong`) {
        try {
            const res = await fetch(url);

            if (!res.ok) throw new Error(`${msg} status code: ${res.status}`);

            return await res.json();
        } catch (err) {
            throw err;
        }
    }

    timeUpdate({ time, weather }) {
        return new Promise(resolve => {
            setInterval(async () => {
                try {
                    await this.renderWeather();
                    resolve();
                } catch (err) {
                    new ModalMessage(`${err.message}`, 10).openModal();
                }
            }, 1000 * 60 * 5); // 2 min
        });
    }

    async getTimeForWeather(url) {
        try {
            const {
                current_weather: { time: currentTime },
            } = await this.getJSON(url, `Cannot get the time 😀`);

            return currentTime;
        } catch (err) {
            throw err;
        }
    }

    async getWeather(url) {
        try {
            const {
                hourly_units: { temperature_2m: tempType },
                hourly: {
                    time: timeArray,
                    temperature_2m: temperatureArray,
                    weathercode: weatherCodeArray,
                },
            } = await this.getJSON(url, `Weather cannot be found!`);

            const timeMap = new Map();

            timeArray.forEach((t, index) => {
                timeMap.set(t, [
                    temperatureArray[index],
                    weatherCodeArray[index],
                ]);
            });

            const [temperature, weatherCode] = timeMap.get(this.currentTime);
            console.log(temperature, weatherCode);

            return {
                temperature,
                tempType,
                weatherState: this.#weatherInterpretation.get(weatherCode),
                currentTime: this.currentTime,
            };
        } catch (err) {
            throw err;
        }
    }

    async renderWeather() {
        try {
            const workouts = Array.from(
                containerWorkouts.querySelectorAll('.workout'),
                async work => {
                    const { coords } = App.workouts.find(
                        ({ id }) => id === work.dataset.id
                    );

                    const [latitude, longitude] = coords;

                    const data = await this.getWeather(
                        this._weatherURL(latitude, longitude)
                    );

                    return { ...data, work };
                }
            );

            const resultPromiseAll = await Promise.all(workouts);

            containerWorkouts
                .querySelectorAll('.workout__weather')
                .forEach(workout => workout.remove());

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

    _loadMap(...coords) {
        // if we doesn't set the this keyword manually, we will get an undefined
        // console.log(this);
        App.setMap(L.map('map').setView(coords, App.getMapZoomLevel()));

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(App.getMap());

        App.getMap().on('click', this._showForm.bind(this));
    }

    _showForm(mapE) {
        form.classList.remove('hidden');
        inputDistance.focus();
        App.setMapEvent(mapE);
        console.log(mapE);
    }

    _toggleElevationField(e) {
        e.preventDefault();

        inputCadence
            .closest('.form__row')
            .classList.toggle('form__row--hidden');

        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
    }

    _hideForm() {
        form.reset();
        form.style.display = 'none'; // prevent of having animation on the element all the time
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1);

        inputCadence
            .closest('.form__row')
            .classList.remove('form__row--hidden');
        inputElevation.closest('.form__row').classList.add('form__row--hidden');
    }

    async _newWorkout(e) {
        try {
            e.preventDefault();

            const allPositive = (...inputs) =>
                inputs.every(input => +input > 0);

            const isFilledInputs = (...inputs) =>
                inputs.every(input => input !== '');

            const validInputsNumbers = (...inputs) =>
                inputs.every(input => Number.isFinite(+input));

            const { lat: latitude, lng: longitude } = App.getMapEvent().latlng;
            const coords = [latitude, longitude];
            const type = inputType.value,
                distance = inputDistance.value,
                duration = inputDuration.value;

            if (type === 'running') {
                const cadence = inputCadence.value;

                if (!isFilledInputs(distance, duration, cadence)) {
                    return new ModalMessage(
                        'Inputs have to be filled!'
                    ).openModal();
                }

                if (!validInputsNumbers(distance, duration, cadence)) {
                    return new ModalMessage(
                        'Inputs have to be THE numbers!'
                    ).openModal();
                }

                if (!allPositive(distance, duration, cadence)) {
                    return new ModalMessage(
                        'Inputs have to be positive numbers!'
                    ).openModal();
                }

                App.workouts.push(
                    new Running(distance, duration, coords, cadence)
                        .setId(App.#incrementId())
                        .render()
                        .addMarkToMap()
                );
            }

            if (type === 'cycling') {
                const elevationGain = inputElevation.value;

                if (!isFilledInputs(distance, duration, elevationGain)) {
                    return new ModalMessage(
                        'Inputs have to be filled!'
                    ).openModal();
                }

                if (!validInputsNumbers(distance, duration, elevationGain)) {
                    return new ModalMessage(
                        'Inputs have to be THE numbers!'
                    ).openModal();
                }

                if (!allPositive(distance, duration)) {
                    return new ModalMessage(
                        'Inputs have to be positive numbers!'
                    ).openModal();
                }

                App.workouts.push(
                    new Cycling(distance, duration, coords, elevationGain)
                        .setId(App.#incrementId())
                        .render()
                        .addMarkToMap()
                );
            }

            // weather implementation
            await this.renderWeather();

            new ModalMessage('New workout created! 😌').openModal();
            this._setLocalStorage();
            this._hideForm();
            this._hideElement(containerWorkouts, sortBtn);
            this._hideElement(containerWorkouts, selectSort);
        } catch (err) {
            throw err;
        }
    }

    _moveToPopup(e) {
        const closest = e.target.closest('.workout');
        if (!closest) return; // if we get null, we'll get out of the event handler function

        if (this._editWorkout(e)) return;
        if (this._delWorkout(e)) return;
        if (this._input(e)) return;
        if (this._submitWorkout(e)) return;
        if (this._cancelWorkout(e)) return;

        const options = {
            animate: true,
            duration: 0.5,
        };

        const workout = App.workouts.find(({ id }) => {
            return id === closest.dataset.id;
        });

        // console.log(workout); // if it didn't find workout then it would be undefined
        workout && App.getMap().panTo(workout.coords, options);

        workout ?? new ModalMessage(`can't find the workout ❌`).openModal();
    }

    _editWorkout(e) {
        if (!e.target.matches('.btn--edit')) return false;

        const workoutContainer = e.target.closest('.workout'); // form has to be outside of the workout

        const data = {
            description: workoutContainer.querySelector('.workout__title'),
            details: workoutContainer.querySelectorAll('.workout__details'),
            id: workoutContainer.dataset.id,
        };

        const weatherData = [...data.details]
            .filter(el => el.matches('.workout__weather'))
            .map(el => [...el.children].map(el => el.textContent));

        this.weatherDataForm.set(data.id, weatherData);
        console.log(this.weatherDataForm);

        const type = App.workouts.find(workout => workout.id === data.id).type;

        let string = `${data.description.outerHTML}<form class="form--edit">`;

        const arrDetail = new Map([
            ['km', 'distance'],
            ['min', 'duration'],
            ['spm', 'cadence'],
            ['m', 'elevation'],
        ]);

        const getTypeWorkout = (type, placeholders) => {
            return type === 'running'
                ? placeholders.at(-2)
                : placeholders.at(-1);
        };

        const getType = type => arrDetail.get(type);

        const placeholders = [...arrDetail.keys()];

        for (const [i, detail] of data.details.entries()) {
            const [icon, value, unit] = detail.children;

            if (detail.matches('.workout__weather')) continue;
            if (detail.matches('.workout__energy')) continue;

            string += `<div class="workout__details workout__details--edit">
                <span class="workout__icon workout__icon--edit">${
                    icon.textContent
                }</span>
                <input class="form__input form__input--${getType(
                    unit.textContent
                )}" placeholder="${
                i === data.details.length - 1
                    ? getTypeWorkout(type, placeholders)
                    : placeholders[i]
            }" value="${value.textContent}" name="${getType(unit.textContent)}">
                <span class="workout__unit">${unit.textContent}</span>
            </div>`;
        }

        string += `<div class="buttons"><button class="btn btn--submit">Submit</button><button class="btn btn--cancel">Cancel</button></div></form>`;

        workoutContainer.replaceChildren();

        workoutContainer.insertAdjacentHTML('beforeend', string);

        return true;
    }

    _submitWorkout(e) {
        e.preventDefault();

        if (!e.target.matches('.btn--submit')) return false;

        let workoutContainer = e.target.closest('.workout');

        const data = {
            id: workoutContainer.dataset.id,

            form: Object.fromEntries(
                new FormData(e.target.parentElement.parentElement).entries()
            ),
        };

        workoutContainer.remove();

        const workout = App.workouts.find(workout => workout.id === data.id);

        App.workouts.splice(
            App.workouts.findIndex(workout => workout.id === data.id),
            1
        );

        console.log(data.form);

        const allPositive = (...inputs) => inputs.every(input => +input > 0);

        const isFilledInputs = (...inputs) =>
            inputs.every(input => input !== '');

        const validInputsNumbers = (...inputs) =>
            inputs.every(input => Number.isFinite(+input));

        if (workout.type === 'running') {
            const { distance, duration, cadence } = data.form;

            if (!isFilledInputs(distance, duration, cadence)) {
                new ModalMessage('Inputs have to be filled!').openModal();
                return true;
            }

            if (!validInputsNumbers(distance, duration, cadence)) {
                new ModalMessage('Inputs have to be THE numbers!').openModal();
                return true;
            }

            if (!allPositive(distance, duration, cadence)) {
                new ModalMessage(
                    'Inputs have to be positive numbers!'
                ).openModal();
                return true;
            }

            App.workouts.push(
                new Running(distance, duration, workout.coords, cadence)
                    .setId(data.id)
                    .render()
            );
        }

        if (workout.type === 'cycling') {
            const { distance, duration, elevation } = data.form;

            if (!isFilledInputs(distance, duration, elevation)) {
                new ModalMessage('Inputs have to be filled!').openModal();
                return true;
            }

            if (!validInputsNumbers(distance, duration, elevation)) {
                new ModalMessage('Inputs have to be THE numbers!').openModal();
                return true;
            }

            if (!allPositive(distance, duration)) {
                new ModalMessage(
                    'Inputs have to be positive numbers!'
                ).openModal();
                return true;
            }

            App.workouts.push(
                new Cycling(distance, duration, workout.coords, elevation)
                    .setId(data.id)
                    .render()
            );
        }

        const [[, weatherState], [temperatureIcon, temperature, tempType]] =
            this.weatherDataForm.get(data.id);

        workoutContainer = document.querySelector(`[data-id="${data.id}"]`);

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

        new ModalMessage('Workout submitted! 😳').openModal();
        this._setLocalStorage();
        return true;
    }

    _cancelWorkout(e) {
        if (!e.target.matches('.btn--cancel')) return false;

        let workoutContainer = e.target.closest('.workout');

        const data = {
            id: workoutContainer.dataset.id,
        };

        workoutContainer.remove();

        const workout = App.workouts.splice(
            App.workouts.findIndex(workout => workout.id === data.id),
            1
        );

        const [workoutObj] = workout;

        if (workoutObj.type === 'running') {
            App.workouts.push(
                new Running(
                    workoutObj.distance,
                    workoutObj.duration,
                    workoutObj.coords,
                    workoutObj.cadence
                )
                    .setId(workoutObj.id)
                    .render()
            );
        }

        if (workoutObj.type === 'cycling') {
            App.workouts.push(
                new Cycling(
                    workoutObj.distance,
                    workoutObj.duration,
                    workoutObj.coords,
                    workoutObj.elevationGain
                )
                    .setId(workoutObj.id)
                    .render()
            );
        }

        workoutContainer = document.querySelector(`[data-id="${data.id}"]`);

        const [[, weatherState], [temperatureIcon, temperature, tempType]] =
            this.weatherDataForm.get(data.id);

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

        new ModalMessage('Canceled! HAha 🤔').openModal();
        this._setLocalStorage();
        return true;
    }

    _input(e) {
        if (!e.target.matches('.form__input')) return false;

        return true;
    }

    _delWorkout(e) {
        if (!e.target.matches('.btn--del')) return false;

        const workout = e.target.closest('.workout');
        const id = workout.dataset.id;
        const coords = App.workouts.find(workout => workout.id === id).coords;
        const targets = Object.entries(App.getMap()._targets);

        const deleteWorkout = ({ coords, otherCoords, marker, id }) => {
            for (const [i, coord] of coords.entries()) {
                if (coord !== otherCoords[i]) return false;
            }

            marker.remove();
            App.workouts.splice(
                App.workouts.findIndex(({ id: idWorkout }) => idWorkout === id),
                1
            );

            workout.remove();
            return true;
        };

        for (const [_, event] of targets) {
            console.log(_, event);
            if (event._latlng) {
                const { lat, lng } = event._latlng;
                const otherCoords = [lat, lng];
                if (deleteWorkout({ coords, otherCoords, marker: event, id }))
                    break;
            }
        }

        new ModalMessage('Workout deleted! 😚').openModal();
        this._hideElement(containerWorkouts, sortBtn);
        this._hideElement(containerWorkouts, selectSort);
        this._setLocalStorage();
        return true;
    }

    _sort(e) {
        e.preventDefault();

        switch (sortType) {
            case 'distance':
                if ((isSortAscending = !isSortAscending)) {
                    App.workouts.sort(({ distance: d1 }, { distance: d2 }) => {
                        return d1 > d2 ? -1 : 1;
                    });
                } else {
                    App.workouts.sort(({ distance: d1 }, { distance: d2 }) => {
                        return d1 > d2 ? 1 : -1;
                    });
                }
                break;

            case 'duration':
                if ((isSortAscending = !isSortAscending)) {
                    App.workouts.sort(({ duration: d1 }, { duration: d2 }) => {
                        return d1 > d2 ? -1 : 1;
                    });
                } else {
                    App.workouts.sort(({ duration: d1 }, { duration: d2 }) => {
                        return d1 > d2 ? 1 : -1;
                    });
                }
                break;
        }

        containerWorkouts
            .querySelectorAll('.workout')
            .forEach(workout => workout.remove());

        App.workouts.forEach(workout => {
            if (workout.type === 'running') {
                const { distance, duration, cadence, coords, id } = workout;
                new Running(distance, duration, coords, cadence)
                    .setId(id)
                    .render();
            }

            if (workout.type === 'cycling') {
                const { distance, duration, elevationGain, coords, id } =
                    workout;
                new Cycling(distance, duration, coords, elevationGain)
                    .setId(id)
                    .render();
            }
        });

        this._setLocalStorage();
    }

    _typeOfSort(e) {
        e.preventDefault();

        sortType = e.target.value;
    }

    _hideElement(workouts, element) {
        if (workouts.querySelectorAll('.workout').length < 2) {
            element.style.display = 'none';
        } else {
            element.style.display = 'inline-block';
        }
    }

    // local storage is a very simple API. And so it is only advised to use for small amounts
    // of data, all right. That's because local storage is blocking. It's something that's
    // very bad, and we will learn why that is. But for now, what matters here is that you
    // shouldn't use local storage to store large amounts of data, because that will surely
    // slow down your application.
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(App.workouts));
        localStorage.setItem('currentId', App.getId());
        localStorage.setItem('sort', isSortAscending);
    }

    _getLocalStorage() {
        // undefined
        // console.dir(App.getMap());

        if (localStorage.getItem('workouts')) {
            App.workouts = JSON.parse(localStorage.getItem('workouts'));

            localStorage.getItem('currentId') &&
                App.setId(BigInt(localStorage.getItem('currentId')));

            App.workouts.forEach(workout => {
                if (workout.type === 'running') {
                    new Running(
                        workout.distance,
                        workout.duration,
                        workout.coords,
                        workout.cadence
                    )
                        .setId(workout.id)
                        .render()
                        .addMarkToMap();
                }
                if (workout.type === 'cycling') {
                    new Cycling(
                        workout.distance,
                        workout.duration,
                        workout.coords,
                        workout.elevationGain
                    )
                        .setId(workout.id)
                        .render()
                        .addMarkToMap();
                }
            });
        }

        isSortAscending = localStorage.getItem('sort')
            ? localStorage.getItem('sort')
            : false;
    }

    static reset() {
        localStorage.removeItem('workouts');
        localStorage.removeItem('currentId');
        localStorage.removeItem('sort');
        location.reload();
    }
}

// One example that we could use for inputs in an application like this would be for example,
// an object of options, which is pretty common in third party libraries. So if we were
// building a library for some other people to use, then we could allow these developers
// to customize the library, using some options. But again does just not necessary in this
// case, all right? NOIDONTTHINKSO
const app = new App();

//////////////////////////////////////////////////////
// How to Plan a Web Project
// Project planning:
// 1. User stories;
// 2. Features;
// 3. Flowchart;
// 4. Architecture;
// 5. Development

// 1. User stories. User story is essentially a description of the application's functionality from the user's perspective. And all user stories put together,
// provide a clear picture of the application's whole functionality. Now there are multiple formats in which we can write user stories, but the most common one
// is to write sentences with this format. So as a certain type of user, I want to perform a certain action so that I can get a certain benefit. And so this
// format of the user story answers the question, who, what and why.
// Common format: As a [type of user](who? Examples: user, admin, etc.), I want [an action](what?) so that [a benefit](why?)
// so now applying this to our own Mapty project, the first user story could go something like this.
// 1) As a user, I want to log my running workouts with location, distance, time, pace and steps per minute, so that I can keep a log of all my running. So
// if we analyze the sentence, then this clearly tells us who wants to perform which action and why. And then based on this, we will be able to plan the application's
// necessary features in a next step. So that a user story can basically be satisfied. Next up, we can also say that
// 2) As a user, I want to log my cycling workouts with location, distance, time, speed and elevation gain,
// so I can keep a log of all my cycling. So this is similar to the first one. But this one is regarding cycling rather than running. Next up
// 3) As a user, I want to see all my workouts at a glance so I can easily track my progress over time. Then
// 4) As a user, I also want to see all my workouts on a map, so I can easily check where I work out the most. And finally, the last user story, which makes sense
// for this application is that
// 5) As a user, I want to see all my workouts when I leave the app, and come back later;
// so that I can keep using the app over time. Now, of course, we could have written these stories, in a different way, and certainly different people will come up
// with different user stories for the same application. But what matters is that we can user stories to describe exactly what the application will do.

// 2. Features.
// FIRST user story:
// 1) We're gonna need a map where a user can click in order to add a new workout. That's because the user wants to log the workout with the location.
// And so therefore the best way to get the location coordinates is gonna be just clicking on a map.
// 2) We are working with maps, we should probably use geolocation in order to display the map at the current location of the user, because this is a lot more friendly than
// having the user scroll to their current position.
// 3) We're also gonna need a form to input the rest of the data. So the distance, the time, pace, and the steps per minute(which is also called cadence).
// SECOND user story:
// 1) We're gonna need a form that is very similar to the first one, but this one has to ask for the elevation gain instead of the steps per minute.
// THIRD user story:
// 1) We're basically just gonna have a list with all these workouts.
// FOURTH user story:
// 1) We'll have a feature basically displaying all the workouts on the map as well.
// FIFTH user story:
// 1) Store workout data in the browser using local storage API
// 2) Whenever the user comes back to the page, we'll read the data that was saved in a local storage, and then display it both on the map, and also on the list.

// 4. Architecture. Let's just start coding.

/*
//////////////////////////////////////////////////////////////////////
// Project Architecture
// If the application was a bit more complex, then we could divide this Architecture even 
// further and create one class that would only be concerned with the USER INTERFACE and one
// class for the so-called Business Logic. So basically, the logic that works only with the
// underlying data
// But in this case, we can just keep it simple like this. And so as I mentioned before, this
// Architecture will then allow us to have everything that is about the application in one 
// nice, self contained block. And besides the application itself, we then also have these
// classes that are only concerned about the data. And so therefore, application and data 
// will be nicely separated in a very logical way. Now, what's also great about this, is that
// we will be able to protect all of these methods, so that they are nicely encapsulated and
// not accessible from everywhere else in the code. So that's the reason why you see these
// underscores on all of the method names. Right, so that is, again, the convention that we 
// can use to protect method names from being changed and used from the outside. And so 
// this will make the code a lot easier to work with because we will know for sure that no
// place else in the code is working with the data. 
// But anyway, this is the initial approach for Architecture that we're now gonna implement.
// And of course, based on the code that we already have. We will keep adding more methods
// and properties as we go but this is already an excellent starting point.

////////////////////////////////////////////////////////////////////
let map, mapEvent;

navigator.geolocation?.getCurrentPosition(
    function (position) {
        const { latitude, longitude } = position.coords;

        const coords = [latitude, longitude];

        map = L.map('map').setView(coords, 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // click on map event
        map.on('click', function (mapE) {
            form.classList.remove('hidden');
            inputDistance.focus();
            mapEvent = mapE;
        });
    },
    function () {
        alert('Could not get your position');
    }
);

inputType.addEventListener('change', e => {
    e.preventDefault();
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
});

form.addEventListener('submit', e => {
    e.preventDefault();

    const { lat: latitude, lng: longitude } = mapEvent.latlng;
    //console.log(mapData);
    const type = inputType.value;
    const distance = inputDistance.value;
    const duration = inputDuration.value;
    const cadence = inputCadence.value;
    const elevation = inputElevation.value;
    const getMonth = function (monthIndex) {
        return months[monthIndex];
    };

    containerWorkouts.insertAdjacentHTML(
        'beforeend',
        `
        <li class="workout ${
            type === 'running' ? 'workout--running' : 'workout--cycling'
        }" data-id="1234567890">
            <h2 class="workout__title">${
                type === 'running' ? 'Running' : 'Cycling'
            } on ${getMonth(new Date().getMonth())} ${new Date().getDate()}</h2>
            <div class="workout__details">
                <span class="workout__icon">${
                    type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
                }</span>
                <span class="workout__value">${distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${duration}</span>
                <span class="workout__unit">min</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${0}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">${
                    type === 'running' ? '🦶🏼' : '⛰'
                }</span>
                <span class="workout__value">${
                    type === 'running' ? cadence : elevation
                }</span>
                <span class="workout__unit">${
                    type === 'running' ? 'spm' : 'm'
                }</span>
            </div>
        </li>
        `
    );

    L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(
            L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false, // prevent the default behavior of the popup closing when another popup is opened
                closeOnClick: false, // prevent whenever user clicks on the map
                className: `${
                    type === 'running' ? 'running-popup' : 'cycling-popup'
                }`,
            })
        )
        .setPopupContent(
            `${type === 'running' ? '🏃‍♂️ Running' : '🚴‍♀️ Cycling'} on ${getMonth(
                new Date().getMonth()
            )} ${new Date().getDate()}`
        )
        .openPopup();

    e.currentTarget.classList.add('hidden');
    form.reset();
});
*/
