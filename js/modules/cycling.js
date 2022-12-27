import Workout from './workout.js';

export default class Cycling extends Workout {
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
