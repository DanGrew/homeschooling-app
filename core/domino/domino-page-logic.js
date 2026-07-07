function dominoIsNotNull(value) {
  return value !== null;
}

function dominoIsPhaseComplete(state) {
  return state.phase === 'complete';
}

function dominoIsPhaseIncomplete(state) {
  return state.phase !== 'complete';
}

function dominoResultSucceeded(result) {
  return result.success;
}

function dominoIsDynamicMatchType(setupState, staticTypes) {
  return !staticTypes[setupState.matchType];
}

function dominoPluckId(item) {
  return item.id;
}

function dominoFindTileById(tiles, tileId) {
  return tiles.filter(dominoIsTileId(tileId))[0];
}

function dominoIsTileId(tileId) {
  return function(tile) { return tile.id === tileId; };
}

function dominoPlayerSummary(player, stats) {
  var s = stats[player.id];
  return { player_id: player.id, tiles_placed: s.tilesPlaced, tiles_drawn: s.tilesDrawn };
}

function dominoPerPlayerSummary(players, stats) {
  return players.map(function(player) { return dominoPlayerSummary(player, stats); });
}

function dominoPickRandomSample(items, count, rng) {
  var random = rng || Math.random;
  return items.slice().sort(function() { return random() - 0.5; }).slice(0, count);
}

if (typeof module !== 'undefined') module.exports = {
  dominoIsNotNull,
  dominoIsPhaseComplete,
  dominoIsPhaseIncomplete,
  dominoResultSucceeded,
  dominoIsDynamicMatchType,
  dominoPluckId,
  dominoFindTileById,
  dominoIsTileId,
  dominoPlayerSummary,
  dominoPerPlayerSummary,
  dominoPickRandomSample
};
