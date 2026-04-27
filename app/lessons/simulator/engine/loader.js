async function startSim(simId) {
  const spec = await fetch(`sims/${simId}.json`).then(r => r.json());

  const names = new Set();
  spec.objects.forEach(o => {
    if (o.sprite) names.add(o.sprite);
    if (o.sprite_states) o.sprite_states.forEach(s => names.add(s));
  });

  window.SPRITES = {};
  await Promise.all([...names].map(name =>
    fetch(`sprites/${name}.svg`).then(r => r.text()).then(svg => { window.SPRITES[name] = svg; })
  ));

  document.title = spec.simulation.title;
  new SimulatorEngine(spec, document.getElementById('scene')).start();
}

startSim(new URLSearchParams(location.search).get('sim') || 'grow_a_plant');
