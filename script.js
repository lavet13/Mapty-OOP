'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    constructor(id, distance, duration, coords, date) {
        this.id = id;
        this.distance = distance;
        this.duration = duration;
        this.coords = coords;
        this.date = date;
    }

    _getNameOfMonth(monthIndex) {
        return months[monthIndex];
    }
}

class Running extends Workout {
    constructor(id, distance, duration, coords, date, cadence, pace) {
        super(id, distance, duration, coords, date);
        this.cadence = cadence;
        this.pace = pace;
    }

    render() {
        const html = `
        <li class="workout workout--running" data-id="1234567890">
            <h2 class="workout__title">Running on ${this._getNameOfMonth(
                this.date.getMonth()
            )} ${this.date.getDate()}</h2>
            <div class="workout__details">
                <span class="workout__icon">🏃‍♂️</span>
                <span class="workout__value">${this.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${this.duration}</span>
                <span class="workout__unit">min</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${this.pace ?? 'no-value'}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${this.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
        </li>`;

        containerWorkouts.insertAdjacentHTML('beforeend', html);
        return this;
    }

    addMarkToMap(map) {
        L.marker(this.coords)
            .addTo(map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false, // prevent the default behavior of the popup closing when another popup is opened
                    closeOnClick: false, // prevent whenever user clicks on the map
                    className: 'running-popup',
                })
            )
            .setPopupContent(
                `🏃‍♂️ Running on ${this._getNameOfMonth(
                    this.date.getMonth()
                )} ${this.date.getDate()}`
            )
            .openPopup();
        return this;
    }
}

class Cycling extends Workout {
    constructor(id, distance, duration, coords, date, elevationGain, speed) {
        super(id, distance, duration, coords, date);
        this.elevationGain = elevationGain;
        this.speed = speed;
    }

    render() {
        const html = `
        <li class="workout workout--running" data-id="1234567890">
            <h2 class="workout__title">Cycling on ${this._getNameOfMonth(
                this.date.getMonth()
            )} ${this.date.getDate()}</h2>
            <div class="workout__details">
                <span class="workout__icon">🚴‍♀️</span>
                <span class="workout__value">${this.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${this.duration}</span>
                <span class="workout__unit">min</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${this.speed ?? 'no-value'}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${this.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
        </li>`;

        containerWorkouts.insertAdjacentHTML('beforeend', html);
        return this;
    }

    addMarkToMap(map) {
        L.marker(this.coords)
            .addTo(map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false, // prevent the default behavior of the popup closing when another popup is opened
                    closeOnClick: false, // prevent whenever user clicks on the map
                    className: 'cycling-popup',
                })
            )
            .setPopupContent(
                `🚴‍♀️ Cycling on ${this._getNameOfMonth(
                    this.date.getMonth()
                )} ${this.date.getDate()}`
            )
            .openPopup();
        return this;
    }
}

class App {
    workouts = [];
    #map;
    #mapEvent;

    constructor() {
        this._getPosition();
    }

    _getPosition() {
        navigator.geolocation.getCurrentPosition(
            position => {
                this._loadMap(position);
            },
            () => {
                alert('Could not get your position');
            }
        );
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords;

        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        this._showForm();
    }

    _showForm() {
        this.#map.on('click', mapE => {
            form.classList.remove('hidden');
            inputDistance.focus();
            this.#mapEvent = mapE;
        });

        this._toggleElevationField();
        this._newWorkout();
    }

    _toggleElevationField() {
        inputType.addEventListener('change', e => {
            e.preventDefault();

            inputCadence
                .closest('.form__row')
                .classList.toggle('form__row--hidden');
            inputElevation
                .closest('.form__row')
                .classList.toggle('form__row--hidden');
        });
    }

    _newWorkout() {
        form.addEventListener('submit', e => {
            e.preventDefault();

            const { lat: latitude, lng: longitude } = this.#mapEvent.latlng;
            const coords = [latitude, longitude];
            const type = inputType.value;

            if (type === 'running') {
                new Running(
                    0,
                    inputDistance.value,
                    inputDuration.value,
                    coords,
                    new Date(),
                    inputCadence.value,
                    0
                )
                    .render()
                    .addMarkToMap(this.#map);
            } else {
                new Cycling(
                    0,
                    inputDistance.value,
                    inputDuration.value,
                    coords,
                    new Date(),
                    inputElevation.value,
                    0
                )
                    .render()
                    .addMarkToMap(this.#map);
            }

            e.currentTarget.classList.add('hidden');
            form.reset();
        });
    }
}

new App();

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
////////////////////////////////////////////////////////////
// Using the Geolocation API
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
