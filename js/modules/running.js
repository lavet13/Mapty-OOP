import Workout from './workout.js';

export default class Running extends Workout {
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
