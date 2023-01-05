import App from '../script.js';
import { map, tileLayer } from 'leaflet';

export default class Leaflet {
    static loadMap(...coords) {
        // if we doesn't set the this keyword manually, we will get an undefined
        // console.log(this);
        App.setMap(map('map').setView(coords, App.getMapZoomLevel()));

        tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(App.getMap());

        App.getMap().on('click', App.showForm);
    }
}
