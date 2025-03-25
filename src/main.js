import { apiKey } from './secret.js';
import './styles/reset.css';
import './styles/style.css';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import * as THREE from 'three';

// DE SWIPER
// init Swiper:
new Swiper('.swiper', {
  // configure Swiper to use modules
  modules: [Navigation, Pagination],
  // Optional parameters
  direction: 'horizontal',
  loop: true,

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});
//COÖRDINATEN VAN DE STEDEN
const cityCoordinates = {
  agay: { lat: 43.4256, lon: 6.8379 },
  sydney: { lat: -33.8688, lon: 151.2093 },
  gizeh: { lat: 29.9773, lon: 31.1325 },
  seoul: { lat: 37.566535, lon: 126.9779692 },
  lasvegas: { lat: 36.1699, lon: -115.1398 },
};

//EIGEN ICONEN
// op openweathermap heb ik gekeken wat de benamingen zijn van hun default iconen en die heb ik hier dan ingestoken met daarnaast mijn eigen
const customIcons = {
  'clear sky': './public/images/clear.png',
  'few clouds': './public/images/cloudy.png',
  'scattered clouds': './public/images/scattered.png',
  'overcast clouds': './public/images/overcastclouds.png',
  'broken clouds': './public/images/broken.png',
  'shower rain': './public/images/rain.png',
  rain: './public/images/rain.png',
  thunderstorm: './public/images/storm.png',
  snow: './public/images/snow.png',
  mist: './public/images/mist.png',
};

// Temperatuur ophalen van een stad
async function getWeather(city) {
  const { lat, lon } = cityCoordinates[city];
  // lat en lon van één stad (obv de foreach loop) + de api sleutel
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return {
      //wat ik wil pakken van de api
      temp: data.main.temp, // de temparatuur
      description: data.weather[0].description, // de weersbeschrijving
      icon: data.weather[0].icon, // het icoontje van de weathermap (vervang ik zelf door een ander)
    };
  } catch (error) {
    console.error(`Fout bij ophalen van het weer voor ${city}:`, error);
    return null;
  }
}

// Temperatuur en icoontjes toevoegen
const containers = document.querySelectorAll('.swiper-slide');
//loopen door de steden coordinaten
containers.forEach(async (container) => {
  //naam pakken van stad in die loop (op eerste van het h1 element, want er zijn er meerderen)
  const cityName = container
    .querySelector('h1 > span:first-child')
    .textContent.trim()
    .toLowerCase();
  const divTemp = document.createElement('div');
  divTemp.classList.add('temperatuur');
  // de loader tonen terwijl wordt geladen
  divTemp.innerHTML = `<div class="loader"></div>`;
  container.appendChild(divTemp);

  if (cityCoordinates[cityName]) {
    const weather = await getWeather(cityName);
    if (weather !== null) {
      // eigen icoontje pakken
      const customIcon =
        customIcons[weather.description.toLowerCase()] ||
        './public/images/clear.png';
      console.log(customIcon);

      //Temp en icoon tonen
      divTemp.innerHTML = `
        <img src="${customIcon}" alt="${weather.description}" title="${weather.description}" />
       <p>${weather.temp.toFixed(1)}°C</p>

      `;
    } else {
      divTemp.innerHTML = `Geen weer-data`; //foutmelding
    }
  } else {
    divTemp.innerHTML = `Geen coördinaten`; // foutmelding als de stad niet bekend is
  }
});

/*threeJS*/

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}
