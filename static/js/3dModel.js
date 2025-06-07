// Import Three.js and helpers
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

import getLayer from "./getLayer.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.5   ,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const container = document.getElementById("three-container");
container.appendChild(renderer.domElement);
const width = container.clientWidth;
const height = container.clientHeight;
renderer.setSize(width, height);
camera.aspect = width / height;
camera.updateProjectionMatrix();

renderer.setClearColor(0x000011);


// Camera position
camera.position.set(0, 0, 10);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Create Earth
const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
const earthTexture = new THREE.TextureLoader().load(
  "https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg"
);
const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthTexture,
  shininess: 0.1,
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Ocean pins data
const oceanData = [
  {
    name: "Pacific Ocean",
    lat: 0,
    lon: -160,
    info: "The largest and deepest ocean basin on Earth, covering about 63 million square miles. It contains more than half of the world's free water and is home to the Mariana Trench, the deepest point on Earth.",
  },
  {
    name: "Atlantic Ocean",
    lat: 20,
    lon: -30,
    info: "The second-largest ocean, known for its distinctive S-shape. The Mid-Atlantic Ridge runs down its center, and it's famous for being the site of the Titanic disaster.",
  },
  {
    name: "Indian Ocean",
    lat: -20,
    lon: 70,
    info: "The third-largest ocean, bounded by Africa, Asia, and Australia. It's the warmest ocean and is known for its monsoon weather patterns and rich marine biodiversity.",
  },
  {
    name: "Arctic Ocean",
    lat: 85,
    lon: 0,
    info: "The smallest and shallowest ocean, mostly covered by sea ice. It's home to polar bears, seals, and unique Arctic marine life adapted to extreme cold.",
  },
  {
    name: "Southern Ocean",
    lat: -70,
    lon: 0,
    info: "The newest recognized ocean, surrounding Antarctica. It's characterized by strong winds, large waves, and unique wildlife including penguins, seals, and whales.",
  },
];

const oceanPins = [];

// Convert lat/lon to 3D position
function latLonToCartesian(lat, lon, radius = 5.2) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Create ocean pins - Add them as children of Earth so they rotate together
oceanData.forEach((ocean) => {
  // Create pin geometry
  const pinGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const pinMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4444,
    transparent: true,
    opacity: 0.9,
  });
  const pin = new THREE.Mesh(pinGeometry, pinMaterial);

  // Position pin relative to Earth center
  pin.position.copy(latLonToCartesian(ocean.lat, ocean.lon));
  pin.userData = {
    name: ocean.name,
    info: ocean.info,
    originalColor: 0xff4444,
  };

  // Add glow effect
  const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4444,
    transparent: true,
    opacity: 0.3,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.copy(pin.position);

  // Add both pin and glow to Earth so they rotate together
  earth.add(pin);
  earth.add(glow);

  oceanPins.push(pin);
});


// Mouse interaction - FIXED VERSION
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredPin = null;

function onMouseMove(event) {
  // Get the Three.js container's position and size
  const rect = container.getBoundingClientRect();
  
  // Calculate mouse position relative to the THREE.JS CONTAINER, not the window
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(oceanPins);

  // Reset previous hovered pin
  if (hoveredPin) {
    hoveredPin.material.color.setHex(hoveredPin.userData.originalColor);
    hoveredPin.scale.set(1, 1, 1);
    document.body.style.cursor = "default";
  }

  if (intersects.length > 0) {
    hoveredPin = intersects[0].object;
    hoveredPin.material.color.setHex(0xffff00); // Yellow on hover
    hoveredPin.scale.set(1.3, 1.3, 1.3);
    document.body.style.cursor = "pointer";
  } else {
    hoveredPin = null;
  }
}

function onMouseClick(event) {
  // Same fix for click detection
  const rect = container.getBoundingClientRect();
  
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(oceanPins);

  if (intersects.length > 0) {
    const pin = intersects[0].object;
    showOceanInfo(pin.userData.name, pin.userData.info);
  }
}

// Popup functionality
function showOceanInfo(title, text) {
  const popup = document.getElementById("popup");
  const content = document.getElementById("popup-content");
  content.innerHTML = `<strong>${title}</strong><br><br>${text}`;
  popup.style.display = "block";
}

function hidePopup() {
  document.getElementById("popup").style.display = "none";
}

// Event listeners - ONLY THESE ONES (remove the duplicate window listeners)
container.addEventListener("mousemove", onMouseMove);
container.addEventListener("click", onMouseClick);
document.getElementById("close-popup").addEventListener("click", hidePopup);

// Simple orbit controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

renderer.domElement.addEventListener("mousedown", (event) => {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", (event) => {
  if (isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y,
    };

    const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(deltaMove.y * 0.01, deltaMove.x * 0.01, 0, "XYZ")
    );

    earth.quaternion.multiplyQuaternions(
      deltaRotationQuaternion,
      earth.quaternion
    );

    previousMousePosition = { x: event.clientX, y: event.clientY };
  }
});


let scrolledToInfo = false;
let lastZoomDirection = 0;

window.addEventListener("wheel", (event) => {
  const zoom = event.deltaY * 0.01;
  camera.position.z += zoom;
  camera.position.z = Math.max(10, Math.min(20, camera.position.z));

  // Scroll down: go to info section
  // if (camera.position.z >= 18 && !scrolledToInfo) {
  //   scrolledToInfo = true;
  //   document.getElementById("info-section").scrollIntoView({ behavior: "smooth" });
  // }

  // Scroll up: go back to 3D model
  if (camera.position.z <= 18 && scrolledToInfo) {
    scrolledToInfo = false;
    document.getElementById("title").scrollIntoView({ behavior: "smooth" });
  }
});


if (camera.position.z < 22) {
  scrolledToInfo = false;
}



// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Gentle auto-rotation - pins rotate with Earth automatically
  if (!isDragging) {
    earth.rotation.y += 0.002;
  }

  // Animate pin glow
  const time = Date.now() * 0.005;
  oceanPins.forEach((pin, index) => {
    pin.material.opacity = 0.8 + Math.sin(time + index) * 0.2;
  });

  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

