import { apiKey } from './secret.js';
import './styles/reset.css';
import './styles/style.css';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
// Global rotation settings
const ROTATION_SETTINGS = {
  autoRotateSpeed: 0.5, // Adjustable auto-rotation speed
  isAutoRotating: true, // Toggle for automatic rotation
};
// Create 3D Globe Visualization
function createGlobe() {
  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true, // This makes the background transparent
  });
  renderer.setClearColor(0x000000, 0); // Explicitly set transparent background
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Texture loader
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('public/images/aarde7.webp');

  // Create globe
  const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
  const globeMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  scene.add(globe);

  // Group for pins and labels
  const cityGroup = new THREE.Group();
  scene.add(cityGroup);

  // Camera positioning
  camera.position.z = 10;

  // Orbit Controls for mouse interaction
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 1.5;
  controls.minPolarAngle = Math.PI / 3;
  controls.enableZoom = false;

  // Toggle auto-rotation
  controls.autoRotate = ROTATION_SETTINGS.isAutoRotating;
  controls.autoRotateSpeed = ROTATION_SETTINGS.autoRotateSpeed;

  // Convert lat/lon to 3D coordinates on a sphere
  function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
  }
  async function createCityPins() {
    for (const [cityKey, cityData] of Object.entries(cityCoordinates)) {
      // Weather data
      const weather = await getWeather(cityKey);

      // Pin geometry
      const pinGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const pinMaterial = new THREE.MeshBasicMaterial({
        color: 'rgb(7, 87, 247)',
      });
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);

      // Position pin on globe
      const pinPosition = latLonToVector3(cityData.lat, cityData.lon, 5.1);
      pin.position.copy(pinPosition);

      // Line geometry
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 'rgb(7, 87, 247)',
        linewidth: 2,
      });
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        pinPosition,
        pinPosition.clone().multiplyScalar(1.2),
      ]);
      const line = new THREE.Line(lineGeometry, lineMaterial);

      // Create label canvas
      const labelCanvas = document.createElement('canvas');
      const context = labelCanvas.getContext('2d');
      labelCanvas.width = 512;
      labelCanvas.height = 256;

      // Clear canvas
      context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

      // Rounded rectangle function
      function roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
      }

      // Blue background with rounded corners
      context.fillStyle = 'rgba(14, 55, 137, 0.8)';
      roundedRect(
        context,
        10,
        10,
        labelCanvas.width - 20,
        labelCanvas.height - 20,
        30,
      );
      context.fill();

      // Style text
      context.font = '40px "Rubik Mono One"';
      context.fillStyle = 'white';
      context.textAlign = 'center';

      // Write city name (centered)
      context.fillText(cityKey, labelCanvas.width / 2, labelCanvas.height / 4);

      // If weather data is available
      if (weather) {
        // Determine custom icon
        const customIcon =
          customIcons[weather.description.toLowerCase()] ||
          './public/images/clear.png';

        // Create an image object to draw the icon
        const icon = new Image();
        icon.src = customIcon;

        // Wait for icon to load
        await new Promise((resolve) => {
          icon.onload = resolve;
        });

        // Draw icon and temperature
        context.font = '30px "Rubik Mono One"';
        const temperatureText = `${weather.temp.toFixed(1)}°C`;

        // Draw icon
        context.drawImage(
          icon,
          labelCanvas.width / 2.4 - 100, // Centered horizontally with temperature
          (2.8 * labelCanvas.height) / 4 - 50, // Centered vertically
          100,
          100,
        );

        // Draw temperature text
        context.fillText(
          temperatureText,
          labelCanvas.width / 2 + 50, // Next to the icon
          (3 * labelCanvas.height) / 4,
        );
      }

      // Create label texture
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      labelTexture.minFilter = THREE.LinearFilter;

      // Label sprite
      const labelMaterial = new THREE.SpriteMaterial({
        map: labelTexture,
        transparent: true,
      });
      const labelSprite = new THREE.Sprite(labelMaterial);
      labelSprite.scale.set(2, 1, 1);

      // Position label slightly offset from pin
      labelSprite.position.copy(pinPosition.clone().multiplyScalar(1.2));

      // Add to scene
      cityGroup.add(pin);
      cityGroup.add(line);
      cityGroup.add(labelSprite);
    }
  }
  // Create pins and labels
  createCityPins();

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    renderer.render(scene, camera);
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(100, 100);
  });

  // Add controls to toggle auto-rotation and adjust speed
  window.toggleAutoRotation = () => {
    ROTATION_SETTINGS.isAutoRotating = !ROTATION_SETTINGS.isAutoRotating;
    controls.autoRotate = ROTATION_SETTINGS.isAutoRotating;
  };

  window.adjustRotationSpeed = (speed) => {
    ROTATION_SETTINGS.autoRotateSpeed = speed;
    controls.autoRotateSpeed = speed;
  };

  // Start animation
  animate();

  // Return controls for potential further manipulation
  return controls;
}

// Initialize globe when page loads
window.addEventListener('load', createGlobe);
