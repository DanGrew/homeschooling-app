import { describe, it, expect } from 'vitest'
import {
  renderRouteSteps,
  renderFlowRows,
  renderGuidanceItems,
  renderFreePlay,
  renderActivityContent,
  renderActivityHTML,
  renderIndexContent,
  renderIndexHTML,
} from '../../core/physical/physical-activity-core.js'

const MOCK_GRAPH = {
  nodes: [
    { id: 'G1', label: 'Ladder base', level: 'ground' },
    { id: 'A1', label: 'Ladder mid', level: 'first' },
    { id: 'B1', label: 'Top platform', level: 'top' },
  ]
}

const MOCK_ACTIVITY = {
  title: 'Test Activity',
  archetype: 'Route Challenge',
  competencies: ['balance', 'motor_planning'],
  key_movements: ['ladder climb', 'slide'],
  route: ['G1', 'A1', 'B1'],
  route_labels: ['Ladder base', 'Ladder mid', 'Top platform'],
  setup: ['Place marker at start'],
  activity_flow: [
    { step: 1, instruction: 'Child climbs ladder', prompt: '"Where does it go?"' },
    { step: 2, instruction: 'Child reaches top', prompt: '"How do you feel up here?"' },
  ],
  adult_guidance: [
    { headline: 'Stay back', detail: 'Let the child lead.' },
    { headline: 'Use position words', detail: 'Up, down, across.' },
  ],
  variations: ['Reverse the route', 'Add a crawl'],
  free_play: ['Make your own route', 'Find the sneakiest path'],
  why_it_works: 'Builds motor planning through varied movement.',
}

describe('renderRouteSteps', () => {
  it('renders a step for each node', () => {
    const html = renderRouteSteps(['G1', 'A1', 'B1'], ['Ladder base', 'Ladder mid', 'Top'], MOCK_GRAPH)
    expect(html).toContain('Ladder base')
    expect(html).toContain('Ladder mid')
    expect(html).toContain('Top')
  })

  it('uses green border for ground nodes', () => {
    const html = renderRouteSteps(['G1'], ['Ladder base'], MOCK_GRAPH)
    expect(html).toContain('#27AE60')
  })

  it('uses orange border for first-level nodes', () => {
    const html = renderRouteSteps(['A1'], ['Ladder mid'], MOCK_GRAPH)
    expect(html).toContain('#F39C12')
  })

  it('uses blue border for top-level nodes', () => {
    const html = renderRouteSteps(['B1'], ['Top'], MOCK_GRAPH)
    expect(html).toContain('#2980B9')
  })

  it('omits arrow after last node', () => {
    const html = renderRouteSteps(['G1', 'B1'], ['A', 'B'], MOCK_GRAPH)
    const arrowCount = (html.match(/›/g) || []).length
    expect(arrowCount).toBe(1)
  })

  it('falls back to node id when label missing', () => {
    const html = renderRouteSteps(['G1'], [], MOCK_GRAPH)
    expect(html).toContain('G1')
  })

  it('falls back to ground color for a node id absent from graphData', () => {
    const html = renderRouteSteps(['ZZZ'], ['Unknown'], MOCK_GRAPH)
    expect(html).toBe(
      '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:#E8F8F5;border:2px solid #27AE60;border-radius:8px;padding:4px 10px;font-size:0.9em;font-weight:bold;white-space:nowrap;">Unknown</span></span>'
    )
  })

  it('produces the exact markup for a three-node route, arrow between each step but not after the last', () => {
    const html = renderRouteSteps(['G1', 'A1', 'B1'], ['Base', 'Mid', 'Top'], MOCK_GRAPH)
    expect(html).toBe(
      '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:#E8F8F5;border:2px solid #27AE60;border-radius:8px;padding:4px 10px;font-size:0.9em;font-weight:bold;white-space:nowrap;">Base</span><span style="color:#aaa;font-size:1.2em;">›</span></span><span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:#FFFDE7;border:2px solid #F39C12;border-radius:8px;padding:4px 10px;font-size:0.9em;font-weight:bold;white-space:nowrap;">Mid</span><span style="color:#aaa;font-size:1.2em;">›</span></span><span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:#EBF5FB;border:2px solid #2980B9;border-radius:8px;padding:4px 10px;font-size:0.9em;font-weight:bold;white-space:nowrap;">Top</span></span>'
    )
  })
})

describe('renderFlowRows', () => {
  it('renders step number', () => {
    const html = renderFlowRows([{ step: 3, instruction: 'Do thing', prompt: 'Say this' }])
    expect(html).toContain('>3<')
  })

  it('renders instruction text', () => {
    const html = renderFlowRows([{ step: 1, instruction: 'Child climbs', prompt: '' }])
    expect(html).toContain('Child climbs')
  })

  it('renders prompt text', () => {
    const html = renderFlowRows([{ step: 1, instruction: 'Go', prompt: '"Where next?"' }])
    expect(html).toContain('"Where next?"')
  })

  it('handles missing prompt gracefully', () => {
    expect(() => renderFlowRows([{ step: 1, instruction: 'Go' }])).not.toThrow()
  })

  it('produces the exact markup for two rows, with no separator between them and an empty prompt cell when omitted', () => {
    const html = renderFlowRows([
      { step: 1, instruction: 'First', prompt: 'P1' },
      { step: 2, instruction: 'Second' },
    ])
    expect(html).toBe(
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #eee;"><div style="display:flex;gap:12px;align-items:flex-start;padding:12px 12px 12px 0;border-right:2px solid #E8F8F5;"><span style="min-width:28px;height:28px;border-radius:50%;background:#27AE60;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.95em;flex-shrink:0;">1</span><p style="margin:0;line-height:1.5;font-size:0.95em;padding-top:4px;">First</p></div><div style="padding:12px 0 12px 12px;color:#555;font-style:italic;font-size:0.9em;line-height:1.5;">P1</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #eee;"><div style="display:flex;gap:12px;align-items:flex-start;padding:12px 12px 12px 0;border-right:2px solid #E8F8F5;"><span style="min-width:28px;height:28px;border-radius:50%;background:#27AE60;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.95em;flex-shrink:0;">2</span><p style="margin:0;line-height:1.5;font-size:0.95em;padding-top:4px;">Second</p></div><div style="padding:12px 0 12px 12px;color:#555;font-style:italic;font-size:0.9em;line-height:1.5;"></div></div>'
    )
  })
})

describe('renderGuidanceItems', () => {
  it('renders headline in bold', () => {
    const html = renderGuidanceItems([{ headline: 'Stay back', detail: 'Let child lead.' }])
    expect(html).toContain('font-weight:bold')
    expect(html).toContain('Stay back')
  })

  it('renders detail text', () => {
    const html = renderGuidanceItems([{ headline: 'H', detail: 'Important detail here.' }])
    expect(html).toContain('Important detail here.')
  })

  it('renders multiple items', () => {
    const html = renderGuidanceItems([
      { headline: 'First', detail: 'A' },
      { headline: 'Second', detail: 'B' },
    ])
    expect(html).toContain('First')
    expect(html).toContain('Second')
  })

  it('produces the exact markup for two items, with no separator between them', () => {
    const html = renderGuidanceItems([
      { headline: 'H1', detail: 'D1' },
      { headline: 'H2', detail: 'D2' },
    ])
    expect(html).toBe(
      '<div style="padding:12px 0;border-bottom:1px solid #d5e8d4;"><div style="font-weight:bold;color:#1E8449;margin-bottom:4px;">H1</div><div style="color:#444;font-size:0.9em;line-height:1.5;">D1</div></div><div style="padding:12px 0;border-bottom:1px solid #d5e8d4;"><div style="font-weight:bold;color:#1E8449;margin-bottom:4px;">H2</div><div style="color:#444;font-size:0.9em;line-height:1.5;">D2</div></div>'
    )
  })
})

describe('renderFreePlay', () => {
  it('renders array of seeds as list items', () => {
    const html = renderFreePlay(['Make a route', 'Find the top'])
    expect(html).toContain('Make a route')
    expect(html).toContain('Find the top')
  })

  it('renders string fallback as single item', () => {
    const html = renderFreePlay('Explore freely')
    expect(html).toContain('Explore freely')
  })

  it('renders a seed marker for each item', () => {
    const html = renderFreePlay(['A', 'B', 'C'])
    const markers = (html.match(/&#10023;/g) || []).length
    expect(markers).toBe(3)
  })

  it('produces the exact markup for two seeds, with no separator between them', () => {
    const html = renderFreePlay(['Seed1', 'Seed2'])
    expect(html).toBe('<li style="padding:5px 0;">&#10023; Seed1</li><li style="padding:5px 0;">&#10023; Seed2</li>')
  })

  it('produces the exact markup for a single string seed', () => {
    const html = renderFreePlay('SoloSeed')
    expect(html).toBe('<li style="padding:5px 0;">&#10023; SoloSeed</li>')
  })
})

describe('renderActivityContent', () => {
  it('includes the activity title', () => {
    const html = renderActivityContent(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('Test Activity')
  })

  it('includes all competencies', () => {
    const html = renderActivityContent(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('balance')
    expect(html).toContain('motor planning')
  })

  it('includes Steps and Prompts column headers', () => {
    const html = renderActivityContent(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('Steps')
    expect(html).toContain('Prompts')
  })

  it('includes why it works text', () => {
    const html = renderActivityContent(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('Builds motor planning')
  })

  it('does not include DOCTYPE or html tags', () => {
    const html = renderActivityContent(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).not.toMatch(/<!DOCTYPE/i)
    expect(html).not.toContain('<html')
  })
})

describe('renderActivityContent — exact output', () => {
  const EXACT_ACTIVITY = {
    title: 'Test Activity',
    archetype: 'Route Challenge',
    competencies: ['balance', 'motor_skill_test'],
    key_movements: ['climb', 'slide', 'jump'],
    route: ['G1', 'A1'],
    route_labels: ['Base', 'Mid'],
    setup: ['Setup A', 'Setup B'],
    activity_flow: [
      { step: 1, instruction: 'Do thing', prompt: 'Ask this' },
    ],
    adult_guidance: [
      { headline: 'Stay back', detail: 'Let child lead.' },
    ],
    variations: ['Var one', 'Var two', 'Var three'],
    free_play: ['Explore', 'Discover'],
    why_it_works: 'Builds skills.',
    criteria: ['crit.a', 'crit.b'],
  }

  const EXACT_CRITERIA_MAP = {
    'crit.a': { label: 'Label A', areaLabel: 'PD' },
    'crit.b': { label: 'Label B', areaLabel: 'PSED' },
  }

  const EXPECTED_NO_CRITERIA =
    '<div class="header">\n  <a href="../../index.html">&#8592;</a>\n  <div>\n    <h1>Test Activity</h1>\n    <div class="archetype">Route Challenge</div>\n  </div>\n</div>\n\n<div class="card">\n  <h2>Competencies</h2>\n  <div><span style="display:inline-block;background:#D5F5E3;color:#1E8449;border-radius:12px;padding:4px 12px;font-size:0.85em;font-weight:bold;margin:3px;">balance</span><span style="display:inline-block;background:#D5F5E3;color:#1E8449;border-radius:12px;padding:4px 12px;font-size:0.85em;font-weight:bold;margin:3px;">motor skill test</span></div>\n</div>\n\n\n\n<div class="card">\n  <h2>Key Movements</h2>\n  <div class="movements">\n    <span class="movement-tag">climb</span><span class="movement-tag">slide</span><span class="movement-tag">jump</span>\n  </div>\n</div>\n\n<div class="card">\n  <h2>Route</h2>\n  <div class="route"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:#E8F8F5;border:2px solid #27AE60;border-radius:8px;padding:4px 10px;font-size:0.9em;font-weight:bold;white-space:nowrap;">Base</span><span style="color:#aaa;font-size:1.2em;">›</span></span><span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:#FFFDE7;border:2px solid #F39C12;border-radius:8px;padding:4px 10px;font-size:0.9em;font-weight:bold;white-space:nowrap;">Mid</span></span></div>\n</div>\n\n<div class="card">\n  <h2>Setup</h2>\n  <ul><li style="padding:5px 0;border-bottom:1px solid #eee;">Setup A</li><li style="padding:5px 0;border-bottom:1px solid #eee;">Setup B</li></ul>\n</div>\n\n<div class="card">\n  <h2>Activity</h2>\n  <div class="flow-header"><span>Steps</span><span>Prompts</span></div>\n  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #eee;"><div style="display:flex;gap:12px;align-items:flex-start;padding:12px 12px 12px 0;border-right:2px solid #E8F8F5;"><span style="min-width:28px;height:28px;border-radius:50%;background:#27AE60;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.95em;flex-shrink:0;">1</span><p style="margin:0;line-height:1.5;font-size:0.95em;padding-top:4px;">Do thing</p></div><div style="padding:12px 0 12px 12px;color:#555;font-style:italic;font-size:0.9em;line-height:1.5;">Ask this</div></div>\n</div>\n\n<div class="card" style="background:#F0FFF4;border:1px solid #A9DFBF;">\n  <h2>Adult Guidance</h2>\n  <div style="padding:12px 0;border-bottom:1px solid #d5e8d4;"><div style="font-weight:bold;color:#1E8449;margin-bottom:4px;">Stay back</div><div style="color:#444;font-size:0.9em;line-height:1.5;">Let child lead.</div></div>\n</div>\n\n<div class="card">\n  <h2>Variations</h2>\n  <ul><li style="padding:7px 0;border-bottom:1px solid #eee;line-height:1.5;"><strong>1.</strong> Var one</li><li style="padding:7px 0;border-bottom:1px solid #eee;line-height:1.5;"><strong>2.</strong> Var two</li><li style="padding:7px 0;border-bottom:1px solid #eee;line-height:1.5;"><strong>3.</strong> Var three</li></ul>\n</div>\n\n<div class="card">\n  <h2>Free Play</h2>\n  <ul style="color:#1E8449;line-height:1.8;"><li style="padding:5px 0;">&#10023; Explore</li><li style="padding:5px 0;">&#10023; Discover</li></ul>\n</div>\n\n<div class="card">\n  <h2>Why This Works</h2>\n  <p class="why">Builds skills.</p>\n</div>'

  it('produces the exact markup with two criteria, multiple setup/variation/movement items', () => {
    const html = renderActivityContent(EXACT_ACTIVITY, MOCK_GRAPH, EXACT_CRITERIA_MAP)
    expect(html).toBe(
      '<div class="header">\n  <a href="../../index.html">&#8592;</a>\n  <div>\n    <h1>Test Activity</h1>\n    <div class="archetype">Route Challenge</div>\n  </div>\n</div>\n\n<div class="card">\n  <h2>Competencies</h2>\n  <div><span style="display:inline-block;background:#D5F5E3;color:#1E8449;border-radius:12px;padding:4px 12px;font-size:0.85em;font-weight:bold;margin:3px;">balance</span><span style="display:inline-block;background:#D5F5E3;color:#1E8449;border-radius:12px;padding:4px 12px;font-size:0.85em;font-weight:bold;margin:3px;">motor skill test</span></div>\n</div>\n\n<div class="card">\n  <h2>EYFS Criteria</h2>\n  <div><span style="display:inline-block;background:#EBF5FB;color:#1A5276;border-radius:12px;padding:4px 12px;font-size:0.85em;font-weight:bold;margin:3px;">[PD] Label A</span><span style="display:inline-block;background:#EBF5FB;color:#1A5276;border-radius:12px;padding:4px 12px;font-size:0.85em;font-weight:bold;margin:3px;">[PSED] Label B</span></div>\n</div>\n\n<div class="card">\n  <h2>Key Movements</h2>\n  <div class="movements">\n    <span class="movement-tag">climb</span><span class="movement-tag">slide</span><span class="movement-tag">jump</span>\n  </div>\n</div>\n\n<div class="card">\n  <h2>Route</h2>\n  <div class="route"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:#E8F8F5;border:2px solid #27AE60;border-radius:8px;padding:4px 10px;font-size:0.9em;font-weight:bold;white-space:nowrap;">Base</span><span style="color:#aaa;font-size:1.2em;">›</span></span><span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:#FFFDE7;border:2px solid #F39C12;border-radius:8px;padding:4px 10px;font-size:0.9em;font-weight:bold;white-space:nowrap;">Mid</span></span></div>\n</div>\n\n<div class="card">\n  <h2>Setup</h2>\n  <ul><li style="padding:5px 0;border-bottom:1px solid #eee;">Setup A</li><li style="padding:5px 0;border-bottom:1px solid #eee;">Setup B</li></ul>\n</div>\n\n<div class="card">\n  <h2>Activity</h2>\n  <div class="flow-header"><span>Steps</span><span>Prompts</span></div>\n  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #eee;"><div style="display:flex;gap:12px;align-items:flex-start;padding:12px 12px 12px 0;border-right:2px solid #E8F8F5;"><span style="min-width:28px;height:28px;border-radius:50%;background:#27AE60;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.95em;flex-shrink:0;">1</span><p style="margin:0;line-height:1.5;font-size:0.95em;padding-top:4px;">Do thing</p></div><div style="padding:12px 0 12px 12px;color:#555;font-style:italic;font-size:0.9em;line-height:1.5;">Ask this</div></div>\n</div>\n\n<div class="card" style="background:#F0FFF4;border:1px solid #A9DFBF;">\n  <h2>Adult Guidance</h2>\n  <div style="padding:12px 0;border-bottom:1px solid #d5e8d4;"><div style="font-weight:bold;color:#1E8449;margin-bottom:4px;">Stay back</div><div style="color:#444;font-size:0.9em;line-height:1.5;">Let child lead.</div></div>\n</div>\n\n<div class="card">\n  <h2>Variations</h2>\n  <ul><li style="padding:7px 0;border-bottom:1px solid #eee;line-height:1.5;"><strong>1.</strong> Var one</li><li style="padding:7px 0;border-bottom:1px solid #eee;line-height:1.5;"><strong>2.</strong> Var two</li><li style="padding:7px 0;border-bottom:1px solid #eee;line-height:1.5;"><strong>3.</strong> Var three</li></ul>\n</div>\n\n<div class="card">\n  <h2>Free Play</h2>\n  <ul style="color:#1E8449;line-height:1.8;"><li style="padding:5px 0;">&#10023; Explore</li><li style="padding:5px 0;">&#10023; Discover</li></ul>\n</div>\n\n<div class="card">\n  <h2>Why This Works</h2>\n  <p class="why">Builds skills.</p>\n</div>'
    )
  })

  it('produces exactly the no-criteria markup when activity.criteria is absent, even against a criteriaMap that resolves any id', () => {
    const activityNoCriteria = { ...EXACT_ACTIVITY }
    delete activityNoCriteria.criteria
    const catchAllCriteriaMap = new Proxy({}, { get: () => ({ label: 'AnyLabel', areaLabel: 'ANY' }) })

    const html = renderActivityContent(activityNoCriteria, MOCK_GRAPH, catchAllCriteriaMap)
    expect(html).toBe(EXPECTED_NO_CRITERIA)
    expect(html).not.toContain('EYFS Criteria')
  })
})

describe('renderActivityHTML', () => {
  it('includes the activity title', () => {
    const html = renderActivityHTML(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('Test Activity')
  })

  it('includes all competencies', () => {
    const html = renderActivityHTML(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('balance')
    expect(html).toContain('motor planning')
  })

  it('includes why it works text', () => {
    const html = renderActivityHTML(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('Builds motor planning')
  })

  it('includes Steps and Prompts column headers', () => {
    const html = renderActivityHTML(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('Steps')
    expect(html).toContain('Prompts')
  })

  it('includes guidance headlines', () => {
    const html = renderActivityHTML(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('Stay back')
    expect(html).toContain('Use position words')
  })

  it('includes free play seeds', () => {
    const html = renderActivityHTML(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('Make your own route')
  })

  it('is a valid HTML document', () => {
    const html = renderActivityHTML(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toMatch(/^<!DOCTYPE html>/)
    expect(html).toContain('</html>')
  })
})

describe('renderActivityHTML with criteriaMap', () => {
  const criteriaMap = {
    'pd.gross-motor-climb': { label: 'Climbing apparatus', areaLabel: 'PD' },
    'psed.self-regulation': { label: 'Self-regulation', areaLabel: 'PSED' }
  }
  const activityWithCriteria = { ...MOCK_ACTIVITY, criteria: ['pd.gross-motor-climb', 'psed.self-regulation'] }

  it('shows EYFS Criteria section when criteriaMap provided', () => {
    const html = renderActivityHTML(activityWithCriteria, MOCK_GRAPH, criteriaMap)
    expect(html).toContain('EYFS Criteria')
    expect(html).toContain('Climbing apparatus')
    expect(html).toContain('Self-regulation')
  })

  it('includes areaLabel prefix on each badge', () => {
    const html = renderActivityHTML(activityWithCriteria, MOCK_GRAPH, criteriaMap)
    expect(html).toContain('[PD]')
    expect(html).toContain('[PSED]')
  })

  it('omits criteria section when activity has no criteria', () => {
    const html = renderActivityHTML(MOCK_ACTIVITY, MOCK_GRAPH, criteriaMap)
    expect(html).not.toContain('EYFS Criteria')
  })

  it('omits criteria section when criteriaMap is empty', () => {
    const html = renderActivityHTML(activityWithCriteria, MOCK_GRAPH, {})
    expect(html).not.toContain('EYFS Criteria')
  })
})

describe('renderIndexContent', () => {
  it('includes activity title', () => {
    const html = renderIndexContent([{ name: 'test-act', activity: MOCK_ACTIVITY }])
    expect(html).toContain('Test Activity')
  })

  it('includes link to activity', () => {
    const html = renderIndexContent([{ name: 'test-act', activity: MOCK_ACTIVITY }])
    expect(html).toContain('activities/test-act/')
  })

  it('shows empty message when no activities', () => {
    const html = renderIndexContent([])
    expect(html).toContain('No activities yet')
  })

  it('does not include DOCTYPE or html tags', () => {
    const html = renderIndexContent([])
    expect(html).not.toMatch(/<!DOCTYPE/i)
    expect(html).not.toContain('<html')
  })

  it('replaces underscores with spaces in a tile competency badge', () => {
    const html = renderIndexContent([
      { name: 'x', activity: { ...MOCK_ACTIVITY, competencies: ['under_score_word'] } },
    ])
    expect(html).toContain('>under score word<')
  })
})

describe('renderIndexContent — exact output', () => {
  it('produces the exact markup for five activities: truncates competency badges to two per tile, cycles their colours, joins tiles with a newline and adds no trailing empty-message text', () => {
    const base = {
      archetype: 'Route Challenge',
      key_movements: ['climb'],
      route: ['G1'],
      route_labels: ['Base'],
      setup: ['Setup A'],
      activity_flow: [{ step: 1, instruction: 'Do thing', prompt: 'Ask this' }],
      adult_guidance: [{ headline: 'Stay back', detail: 'Let child lead.' }],
      variations: ['Var one'],
      free_play: ['Explore'],
      why_it_works: 'Builds skills.',
    }
    const activities = [
      { name: 'act-1', activity: { ...base, title: 'Act One', competencies: ['a', 'b', 'c'] } },
      { name: 'act-2', activity: { ...base, title: 'Act Two', competencies: ['d'] } },
      { name: 'act-3', activity: { ...base, title: 'Act Three', competencies: ['e'] } },
      { name: 'act-4', activity: { ...base, title: 'Act Four', competencies: ['f'] } },
      { name: 'act-5', activity: { ...base, title: 'Act Five', competencies: ['g'] } },
    ]

    const html = renderIndexContent(activities)

    expect(html).toBe(
      '<a class="home" href="../index.html">&#127968; Home</a>\n<h1>Physical Play</h1>\n<p class="subtitle">Jungle gym activities — adult guided</p>\n<div class="tiles">\n  <a class="tile" href="activities/act-1/" style="background:#F0FFF4;">\n    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px 4px;gap:6px;">\n      <svg viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:48px;height:40px;">\n        <rect x="10" y="30" width="40" height="4" rx="2" fill="#A9DFBF"/>\n        <rect x="20" y="18" width="4" height="14" rx="2" fill="#27AE60"/>\n        <rect x="36" y="18" width="4" height="14" rx="2" fill="#27AE60"/>\n        <rect x="22" y="10" width="16" height="10" rx="3" fill="#52BE80"/>\n        <circle cx="30" cy="6" r="4" fill="#82E0AA"/>\n      </svg>\n      <div style="text-align:center;"><span style="font-size:0.7em;background:#D5F5E3;border-radius:8px;padding:2px 8px;margin:2px;display:inline-block;">a</span><span style="font-size:0.7em;background:#D6EAF8;border-radius:8px;padding:2px 8px;margin:2px;display:inline-block;">b</span></div>\n    </div>\n    <span style="padding:0 8px 12px;text-align:center;font-size:0.95em;">Act One</span>\n  </a>\n  <a class="tile" href="activities/act-2/" style="background:#F0FFF4;">\n    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px 4px;gap:6px;">\n      <svg viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:48px;height:40px;">\n        <rect x="10" y="30" width="40" height="4" rx="2" fill="#A9DFBF"/>\n        <rect x="20" y="18" width="4" height="14" rx="2" fill="#27AE60"/>\n        <rect x="36" y="18" width="4" height="14" rx="2" fill="#27AE60"/>\n        <rect x="22" y="10" width="16" height="10" rx="3" fill="#52BE80"/>\n        <circle cx="30" cy="6" r="4" fill="#82E0AA"/>\n      </svg>\n      <div style="text-align:center;"><span style="font-size:0.7em;background:#D5F5E3;border-radius:8px;padding:2px 8px;margin:2px;display:inline-block;">d</span></div>\n    </div>\n    <span style="padding:0 8px 12px;text-align:center;font-size:0.95em;">Act Two</span>\n  </a>\n  <a class="tile" href="activities/act-3/" style="background:#F0FFF4;">\n    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px 4px;gap:6px;">\n      <svg viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:48px;height:40px;">\n        <rect x="10" y="30" width="40" height="4" rx="2" fill="#A9DFBF"/>\n        <rect x="20" y="18" width="4" height="14" rx="2" fill="#27AE60"/>\n        <rect x="36" y="18" width="4" height="14" rx="2" fill="#27AE60"/>\n        <rect x="22" y="10" width="16" height="10" rx="3" fill="#52BE80"/>\n        <circle cx="30" cy="6" r="4" fill="#82E0AA"/>\n      </svg>\n      <div style="text-align:center;"><span style="font-size:0.7em;background:#D5F5E3;border-radius:8px;padding:2px 8px;margin:2px;display:inline-block;">e</span></div>\n    </div>\n    <span style="padding:0 8px 12px;text-align:center;font-size:0.95em;">Act Three</span>\n  </a>\n  <a class="tile" href="activities/act-4/" style="background:#F0FFF4;">\n    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px 4px;gap:6px;">\n      <svg viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:48px;height:40px;">\n        <rect x="10" y="30" width="40" height="4" rx="2" fill="#A9DFBF"/>\n        <rect x="20" y="18" width="4" height="14" rx="2" fill="#27AE60"/>\n        <rect x="36" y="18" width="4" height="14" rx="2" fill="#27AE60"/>\n        <rect x="22" y="10" width="16" height="10" rx="3" fill="#52BE80"/>\n        <circle cx="30" cy="6" r="4" fill="#82E0AA"/>\n      </svg>\n      <div style="text-align:center;"><span style="font-size:0.7em;background:#D5F5E3;border-radius:8px;padding:2px 8px;margin:2px;display:inline-block;">f</span></div>\n    </div>\n    <span style="padding:0 8px 12px;text-align:center;font-size:0.95em;">Act Four</span>\n  </a>\n  <a class="tile" href="activities/act-5/" style="background:#F0FFF4;">\n    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px 4px;gap:6px;">\n      <svg viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:48px;height:40px;">\n        <rect x="10" y="30" width="40" height="4" rx="2" fill="#A9DFBF"/>\n        <rect x="20" y="18" width="4" height="14" rx="2" fill="#27AE60"/>\n        <rect x="36" y="18" width="4" height="14" rx="2" fill="#27AE60"/>\n        <rect x="22" y="10" width="16" height="10" rx="3" fill="#52BE80"/>\n        <circle cx="30" cy="6" r="4" fill="#82E0AA"/>\n      </svg>\n      <div style="text-align:center;"><span style="font-size:0.7em;background:#D5F5E3;border-radius:8px;padding:2px 8px;margin:2px;display:inline-block;">g</span></div>\n    </div>\n    <span style="padding:0 8px 12px;text-align:center;font-size:0.95em;">Act Five</span>\n  </a>\n</div>'
    )
  })
})

describe('renderIndexHTML', () => {
  it('includes activity title as link text', () => {
    const html = renderIndexHTML([{ name: 'test-act', activity: MOCK_ACTIVITY }])
    expect(html).toContain('Test Activity')
  })

  it('includes link to activity', () => {
    const html = renderIndexHTML([{ name: 'test-act', activity: MOCK_ACTIVITY }])
    expect(html).toContain('activities/test-act/')
  })

  it('shows empty message when no activities', () => {
    const html = renderIndexHTML([])
    expect(html).toContain('No activities yet')
  })

  it('includes Physical Play heading', () => {
    const html = renderIndexHTML([])
    expect(html).toContain('Physical Play')
  })
})
