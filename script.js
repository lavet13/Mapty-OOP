'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    static #id = 0n;
    date = new Date().toISOString();

    constructor(distance, duration, coords) {
        this.id = Workout.#countingObjects();
        this.distance = distance; // in km
        this.duration = duration; // in min
        this.coords = coords; // [lat, lng]
        this._setDescription(this.date);
    }

    static #countingObjects() {
        return String(Workout.#id++);
    }

    _setProperty(firstVal, secondVal) {
        let value;

        Object.getPrototypeOf(this) === Running.prototype && (value = firstVal);
        Object.getPrototypeOf(this) === Cycling.prototype &&
            (value = secondVal);

        return value ?? 'no-value';
    }

    _setDescription(isoString) {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const date = new Date(isoString);
        const getMonth = date => months[date.getMonth()];
        const getDate = date => String(date.getDate()).padStart(2, 0);

        this.description = `${this._setProperty(
            'Running',
            'Cycling'
        )} on ${getMonth(date)} ${getDate(date)}`;
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
                    className: `${this._setProperty(
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
        <li class="workout workout--${this._setProperty(
            'running',
            'cycling'
        )}" data-id="${this.id}">
            <h2 class="workout__title">${this.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${this._setProperty(
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
            <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${this._setProperty(
                        this.pace,
                        this.speed
                    )}</span>
                    <span class="workout__unit">${this._setProperty(
                        'min/km',
                        'km/h'
                    )}</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">${this._setProperty(
                        '🦶🏼',
                        '⛰'
                    )}</span>
                    <span class="workout__value">${this._setProperty(
                        this.cadence,
                        this.elevationGain
                    )}</span>
                    <span class="workout__unit">${this._setProperty(
                        'spm',
                        'm'
                    )}</span>
                </div>
            </li>`;

        form.insertAdjacentHTML('afterend', html);
        return this;
    }
}

class Running extends Workout {
    constructor(distance, duration, coords, cadence) {
        super(+distance, +duration, coords);
        this.cadence = +cadence;
        this._calcPace();
    }

    _calcPace() {
        // min/km
        this.pace = (this.duration / this.distance).toFixed(1);
        return this.pace;
    }
}

class Cycling extends Workout {
    constructor(distance, duration, coords, elevationGain) {
        super(+distance, +duration, coords);
        this.elevationGain = +elevationGain;
        this._calcSpeed();
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
    #map;
    #mapEvent;
    #mapZoomLevel = 13;

    constructor() {
        // basically every small piece of functionality that is in our application, we now
        // want to be it's own function.
        this._getPosition();

        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener(
            'click',
            this._moveToPopup.bind(this)
        );
    }

    _getPosition() {
        // loadMap method called by getCurrentPosition function, and in fact this is actually
        // treated as a regular function call, not as a method call.
        // since this is a callback function, we are not calling it ourselves. It is the
        // getCurrentPosition function that we'll call this callback function(loadMap)
        // once that it gets the currentPosition of the user. And when it calls this method,
        // then it does so, as a regular function call. And as we learned before, in a
        // regular function call, the this keyword is set to undefined.
        navigator.geolocation.getCurrentPosition(
            this._loadMap.bind(this),
            () => {
                alert('Could not get your position');
            }
        );
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords;

        const coords = [latitude, longitude];

        // if we doesn't set the this keyword manually, we will get an undefined
        // console.log(this);
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));
    }

    _showForm(mapE) {
        form.classList.remove('hidden');
        inputDistance.focus();
        this.#mapEvent = mapE;
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
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1);

        inputCadence
            .closest('.form__row')
            .classList.remove('form__row--hidden');
        inputElevation.closest('.form__row').classList.add('form__row--hidden');
    }

    _newWorkout(e) {
        const allPositive = (...inputs) => inputs.every(input => +input > 0);

        const isFilledInputs = (...inputs) =>
            inputs.every(input => input !== '');

        const validInputsNumbers = (...inputs) =>
            inputs.every(input => Number.isFinite(+input));

        e.preventDefault();

        const { lat: latitude, lng: longitude } = this.#mapEvent.latlng;
        const coords = [latitude, longitude];
        const type = inputType.value,
            distance = inputDistance.value,
            duration = inputDuration.value;

        if (type === 'running') {
            const cadence = inputCadence.value;

            if (!isFilledInputs(distance, duration, cadence))
                return alert('Inputs have to be filled!');

            if (!validInputsNumbers(distance, duration, cadence))
                return alert('Inputs have to be THE numbers!');

            if (!allPositive(distance, duration, cadence))
                return alert('Inputs have to be positive numbers!');

            App.workouts.push(
                new Running(distance, duration, coords, cadence)
                    .render()
                    .addMarkToMap(this.#map)
            );
        }

        if (type === 'cycling') {
            const elevationGain = inputElevation.value;

            if (!isFilledInputs(distance, duration, elevationGain))
                return alert('Inputs have to be filled!');

            if (!validInputsNumbers(distance, duration, elevationGain))
                return alert('Inputs have to be THE numbers!');

            if (!allPositive(distance, duration))
                return alert('Inputs have to be positive numbers!');

            App.workouts.push(
                new Cycling(distance, duration, coords, elevationGain)
                    .render()
                    .addMarkToMap(this.#map)
            );
        }

        this._hideForm();
        this._setLocalStorage();
    }

    _moveToPopup(e) {
        const closest = e.target.closest('.workout');
        if (!closest) return; // if we get null, we'll get out of the event handler function

        const options = {
            animate: true,
            duration: 0.5,
        };

        const workout = App.workouts.find(({ id }) => {
            console.log(id);
            return id === closest.dataset.id;
        });

        this.#map.panTo(workout.coords, options);
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(App.workouts));
    }

    _getLocalStorage() {
        localStorage.getItem('workouts') &&
            (App.workouts = JSON.parse(localStorage.getItem('workouts')));
    }
}

// One example that we could use for inputs in an application like this would be for example,
// an object of options, which is pretty common in third party libraries. So if we were
// building a library for some other people to use, then we could allow these developers
// to customize the library, using some options. But again does just not necessary in this
// case, all right? NOIDONTTHINKSO
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