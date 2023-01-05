import { marker, popup } from 'leaflet';
import App from '../script.js';

export default class Workout {
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

        marker(this.coords)
            .addTo(App.getMap())
            .bindPopup(
                popup({
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

        App.form.insertAdjacentHTML('afterend', html);
        return this;
    }
}
