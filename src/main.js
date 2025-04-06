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

// Initialize Swipers
let earthSwiper, moonSwiper;

// Initialize Earth Swiper
earthSwiper = new Swiper('.earth-swiper', {
  modules: [Navigation, Pagination],
  direction: 'horizontal',
  loop: true,
  pagination: {
    el: '.swiper-pagination',
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});

// Initialize Moon Swiper
moonSwiper = new Swiper('.moon-swiper', {
  modules: [Navigation, Pagination],
  direction: 'horizontal',
  loop: true,
  pagination: {
    el: '.swiper-pagination',
  },
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

//COÖRDINATEN VAN DE MAAN
const moonCoordinates = {
  'Mare Tranq': { lat: 8.5, lon: 31.4 },
  'Coper crater': { lat: 9.7, lon: -20.1 },
  'Tycho crater': { lat: -43.3, lon: -11.2 },
};

// Verzonnen temperaturen van de maan (vond geen api die dit weergaf)
const moonLocations = {
  'sea of tranquility': { temp: -173, description: 'clear sky' },
  'copernicus crater': { temp: -183, description: 'clear sky' },
  'tycho crater': { temp: -178, description: 'clear sky' },
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

// Temperatuur bij de aardeswipers zetten
const earthContainers = document.querySelectorAll(
  '.earth-swiper .swiper-slide',
);
earthContainers.forEach(async (container) => {
  const cityName = container
    .querySelector('h1 > span:first-child')
    .textContent.trim()
    .toLowerCase();
  const divTemp = document.createElement('div');
  divTemp.classList.add('temperatuur');
  divTemp.innerHTML = `<div class="loader"></div>`;
  container.appendChild(divTemp);

  if (cityCoordinates[cityName]) {
    const weather = await getWeather(cityName);
    if (weather !== null) {
      const customIcon =
        customIcons[weather.description.toLowerCase()] ||
        './public/images/clear.png';

      divTemp.innerHTML = `
        <img src="${customIcon}" alt="${weather.description}" title="${weather.description}" />
        <p>${weather.temp.toFixed(1)}°C</p>
      `;
    } else {
      divTemp.innerHTML = `Geen weer-data`;
    }
  } else {
    divTemp.innerHTML = `Geen coördinaten`;
  }
});

// Temperaturen bij maan swipers zetten
const moonContainers = document.querySelectorAll('.moon-swiper .swiper-slide');
moonContainers.forEach((container) => {
  const locationName = container
    .querySelector('h1 > span:first-child')
    .textContent.trim()
    .toLowerCase();

  const divTemp = document.createElement('div');
  divTemp.classList.add('temperatuur');

  // Get moon location info or use default
  const locationInfo = moonLocations[locationName] || {
    temp: -180,
    description: 'clear sky',
  };

  // Get icon for moon (always clear sky)
  const customIcon =
    customIcons[locationInfo.description] || './public/images/clear.png';

  divTemp.innerHTML = `
    <img src="${customIcon}" alt="${locationInfo.description}" title="${locationInfo.description}" />
    <p>${locationInfo.temp}°C</p>
  `;

  container.appendChild(divTemp);
});

/*threeJS*/
// Global rotation settings
const ROTATION_SETTINGS = {
  autoRotateSpeed: 0.5, // snelheid van draaien
  isAutoRotating: true, // automatisch draaien
  currentPlanet: 'earth', // Add this to track which planet is showing
}; // Create 3D Globe Visualization
function createGlobe() {
  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.3,
    1000,
  );
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Texture loader
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('public/images/aarde7.webp');
  const moonPlanetTexture = textureLoader.load('public/images/moon.jpg');

  // Create globe
  const globeGeometry = new THREE.SphereGeometry(5, 64, 64);

  // Create both materials but only use one at first
  const earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
  const moonMaterial = new THREE.MeshBasicMaterial({
    map: moonPlanetTexture,
  });

  // Start with Earth
  const globe = new THREE.Mesh(globeGeometry, earthMaterial);
  scene.add(globe);

  // Group for pins and labels
  const cityGroup = new THREE.Group();
  scene.add(cityGroup);

  // Camera positioning
  camera.position.set(3, 3, 10);

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
  // Update your createCityPins function to handle both Earth and Moon
  async function createCityPins() {
    // Clear existing pins first
    while (cityGroup.children.length > 0) {
      cityGroup.remove(cityGroup.children[0]);
    }

    // Determine which set of coordinates to use based on current planet
    const coordinatesToUse =
      ROTATION_SETTINGS.currentPlanet === 'earth'
        ? cityCoordinates
        : moonCoordinates;

    // Determine which set of data to use based on current planet
    for (const [locationKey, locationData] of Object.entries(
      coordinatesToUse,
    )) {
      // Get data based on which planet is selected
      let temperature, description;

      if (ROTATION_SETTINGS.currentPlanet === 'earth') {
        // For Earth, fetch actual weather data
        const weather = await getWeather(locationKey);
        if (weather) {
          temperature = weather.temp;
          description = weather.description;
        } else {
          temperature = 0;
          description = 'clear sky';
        }
      } else {
        // For Moon, use the predefined moon location data
        const moonData = moonLocations[locationKey];
        temperature = moonData ? moonData.temp : -180;
        description = moonData ? moonData.description : 'clear sky';
      }

      // Pin geometry
      const pinGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const pinMaterial = new THREE.MeshBasicMaterial({
        color: 'rgb(7, 87, 247)',
      });
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);

      // Position pin on globe
      const pinPosition = latLonToVector3(
        locationData.lat,
        locationData.lon,
        5.1,
      );
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

      // Write location name (centered)
      context.fillText(
        locationKey,
        labelCanvas.width / 2,
        labelCanvas.height / 4,
      );

      // Determine custom icon
      const customIcon =
        customIcons[description.toLowerCase()] || './public/images/clear.png';

      // Create an image object to draw the icon
      const icon = new Image();
      icon.src = customIcon;

      // Wait for icon to load
      await new Promise((resolve) => {
        icon.onload = resolve;
      });

      // Draw icon and temperature
      context.font = '30px "Rubik Mono One"';
      const temperatureText = `${typeof temperature === 'number' ? temperature.toFixed(1) : temperature}°C`;

      // Calculate icon size maintaining aspect ratio
      const maxIconSize = 100; // Maximum icon size
      const iconAspectRatio = icon.width / icon.height;
      let iconWidth, iconHeight;

      if (icon.width > icon.height) {
        iconWidth = maxIconSize;
        iconHeight = maxIconSize / iconAspectRatio;
      } else {
        iconHeight = maxIconSize;
        iconWidth = maxIconSize * iconAspectRatio;
      }

      // Draw icon centered
      context.drawImage(
        icon,
        labelCanvas.width / 3.5 - iconWidth / 2, // Centered horizontally
        (2.8 * labelCanvas.height) / 4 - iconHeight / 2, // Centered vertically
        iconWidth,
        iconHeight,
      );

      // Draw temperature text
      context.fillText(
        temperatureText,
        labelCanvas.width / 2 + 50, // Next to the icon
        (3 * labelCanvas.height) / 4,
      );

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

  // Initial state check to ensure correct swiper is showing
  syncSwiperWithPlanet();

  // Function to sync swiper with current planet
  function syncSwiperWithPlanet() {
    const earthSwiperElement = document.querySelector('.earth-swiper');
    const moonSwiperElement = document.querySelector('.moon-swiper');

    if (ROTATION_SETTINGS.currentPlanet === 'moon') {
      // Show Moon swiper, hide Earth swiper
      earthSwiperElement.style.display = 'none';
      moonSwiperElement.style.display = 'block';
      // Update the Moon swiper to refresh it
      moonSwiper.update();
    } else {
      // Show Earth swiper, hide Moon swiper
      moonSwiperElement.style.display = 'none';
      earthSwiperElement.style.display = 'block';
      // Update the Earth swiper to refresh it
      earthSwiper.update();
    }
  }

  // Add toggle button to UI
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Wissel van planeet';
  toggleButton.classList.add('planet-toggle');
  toggleButton.style.position = 'absolute';
  toggleButton.style.top = '650px';
  toggleButton.style.right = '80px';
  toggleButton.style.zIndex = '1000';
  toggleButton.style.padding = '10px 15px';
  toggleButton.style.backgroundColor = 'rgb(7, 87, 247)';
  toggleButton.style.color = 'white';
  toggleButton.style.border = 'none';
  toggleButton.style.borderRadius = '5px';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.fontFamily = '"Rubik Mono One", sans-serif';
  document.body.appendChild(toggleButton);

  // Toggle between Earth and moon Planet
  toggleButton.addEventListener('click', () => {
    if (ROTATION_SETTINGS.currentPlanet === 'earth') {
      // Switch to moon Planet
      globe.material = moonMaterial;
      ROTATION_SETTINGS.currentPlanet = 'moon';
      // Remove all city pins and labels
      createCityPins();
    } else {
      // Switch back to Earth
      globe.material = earthMaterial;
      ROTATION_SETTINGS.currentPlanet = 'earth';
      // Recreate the city pins and labels
      createCityPins();
    }

    // Sync the swiper with the current planet
    syncSwiperWithPlanet();
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Toggle auto-rotation function
  window.toggleAutoRotation = () => {
    ROTATION_SETTINGS.isAutoRotating = !ROTATION_SETTINGS.isAutoRotating;
    controls.autoRotate = ROTATION_SETTINGS.isAutoRotating;
  };

  // Adjust rotation speed function
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
