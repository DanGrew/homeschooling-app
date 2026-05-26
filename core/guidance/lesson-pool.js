export function fisherYates(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
}

export function initPools(data) {
  if (!data.randomPools || !data.randomPools.length) return;
  var queues = {};
  data.randomPools.forEach(function(pool) {
    var q = pool.items.slice();
    fisherYates(q);
    queues[pool.id] = { items: pool.items, queue: q };
  });
  data.steps = data.steps.map(function(step) {
    if (!step.random) return step;
    var pool = queues[step.random];
    if (!pool) return step;
    if (pool.queue.length === 0) {
      pool.queue = pool.items.slice();
      fisherYates(pool.queue);
    }
    var item = pool.queue.shift();
    return { prompt: item.prompt, expect: item.expect, feedback: item.feedback };
  });
}

if (typeof module !== 'undefined') module.exports = { fisherYates, initPools };
