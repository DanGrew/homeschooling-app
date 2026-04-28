async function startSim(simId) {
  const spec = await fetch(`sims/${simId}.json`).then(r => r.json());
  document.title = spec.simulation.title;
  new SimulatorEngine(spec, document.getElementById('scene')).start();
}

startSim(new URLSearchParams(location.search).get('sim') || 'grow_a_plant');
