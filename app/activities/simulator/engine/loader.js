async function startSim(simId) {
  const spec = await fetch(`sims/${simId}.json`).then(r => r.json());

  document.title = spec.simulation.title;
  document.getElementById('sim-title').textContent = spec.simulation.title;
  document.getElementById('sim-instructions').textContent = spec.simulation.instructions || '';

  const scene = document.getElementById('scene');
  const frame = document.getElementById('scene-frame');

  window.engine = new SimulatorEngine(spec, scene);
  window.engine.start();

  const scale = Math.min(1, (window.innerWidth - 32) / spec.scene.width);
  scene.style.transformOrigin = 'top left';
  scene.style.transform = `scale(${scale})`;
  frame.style.width = `${spec.scene.width * scale}px`;
  frame.style.height = `${spec.scene.height * scale}px`;
}

startSim(new URLSearchParams(location.search).get('sim') || 'grow_a_plant');
