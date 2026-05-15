import { SimulatorEngine } from './simulator-engine.js';
import '../../components/speech/speakable.js';

async function startSim(simId) {
  const spec = await fetch(`../../../content/simulator/sims/${simId}.json`).then(r => r.json());

  document.title = spec.simulation.title;
  document.querySelector('.activity-title').textContent = spec.simulation.title;
  document.querySelector('.activity-instruction').textContent = spec.simulation.instructions || '';

  const scene = document.getElementById('scene');
  const frame = document.getElementById('scene-frame');

  window.engine = new SimulatorEngine(spec, scene);
  window.engine.start();

  const gameArea = frame.closest('.game-area');
  const header = gameArea.querySelector('.activity-header');
  const availWidth = gameArea.clientWidth;
  const availHeight = gameArea.clientHeight - (header ? header.offsetHeight : 0);
  const scale = Math.min(1, (availWidth - 32) / spec.scene.width, (availHeight - 32) / spec.scene.height);
  scene.style.transformOrigin = 'top left';
  scene.style.transform = `scale(${scale})`;
  frame.style.width = `${spec.scene.width * scale}px`;
  frame.style.height = `${spec.scene.height * scale}px`;
}

startSim(new URLSearchParams(location.search).get('sim') || 'grow_a_plant');
