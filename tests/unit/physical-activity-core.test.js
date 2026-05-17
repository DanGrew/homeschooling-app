import { describe, it, expect } from 'vitest'
import {
  renderRouteSteps,
  renderFlowRows,
  renderGuidanceItems,
  renderFreePlay,
  renderActivityHTML,
  renderIndexHTML,
} from '../../core/physical/physical-activity-core.js'
import { renderApparatusSVG } from '../../core/physical/jungle-gym-svg.js'

const MOCK_GRAPH = {
  nodes: [
    { id: 'G1', label: 'Ladder base', level: 'ground' },
    { id: 'A1', label: 'Ladder mid', level: 'first' },
    { id: 'B1', label: 'Top platform', level: 'top' },
  ],
  edges: [
    { from: 'G1', to: 'A1', movement: 'climbing_ladder', bidirectional: true },
    { from: 'A1', to: 'B1', movement: 'climbing_wall_holes', bidirectional: true },
  ],
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
})

describe('renderApparatusSVG', () => {
  it('returns an SVG element', () => {
    const svg = renderApparatusSVG(MOCK_GRAPH)
    expect(svg).toMatch(/^<svg /)
    expect(svg).toContain('</svg>')
  })

  it('includes node circle for each known node', () => {
    const svg = renderApparatusSVG(MOCK_GRAPH)
    expect(svg).toContain('id="node-G1"')
    expect(svg).toContain('id="node-A1"')
    expect(svg).toContain('id="node-B1"')
  })

  it('includes edge line for each edge', () => {
    const svg = renderApparatusSVG(MOCK_GRAPH)
    expect(svg).toContain('id="edge-G1-A1"')
    expect(svg).toContain('id="edge-A1-B1"')
  })

  it('highlights active nodes from route', () => {
    const inactive = renderApparatusSVG(MOCK_GRAPH, [])
    const active = renderApparatusSVG(MOCK_GRAPH, ['G1', 'A1', 'B1'])
    const inactiveG1 = inactive.match(/id="node-G1"[^/]*r="(\d+)"/)
    const activeG1 = active.match(/id="node-G1"[^/]*r="(\d+)"/)
    expect(Number(activeG1[1])).toBeGreaterThan(Number(inactiveG1[1]))
  })

  it('highlights active edges in red', () => {
    const svg = renderApparatusSVG(MOCK_GRAPH, ['G1', 'A1'])
    expect(svg).toContain('id="edge-G1-A1"')
    const edgeLine = svg.match(/id="edge-G1-A1"[^/]*stroke="([^"]+)"/)
    expect(edgeLine[1]).toBe('#E74C3C')
  })

  it('inactive edges not red', () => {
    const svg = renderApparatusSVG(MOCK_GRAPH, [])
    const edgeLine = svg.match(/id="edge-G1-A1"[^/]*stroke="([^"]+)"/)
    expect(edgeLine[1]).not.toBe('#E74C3C')
  })

  it('includes level legend', () => {
    const svg = renderApparatusSVG(MOCK_GRAPH)
    expect(svg).toContain('Ground')
    expect(svg).toContain('First')
    expect(svg).toContain('Top')
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

  it('embeds apparatus SVG with node IDs', () => {
    const html = renderActivityHTML(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('id="node-G1"')
    expect(html).toContain('id="node-B1"')
  })

  it('includes apparatus expand dialog', () => {
    const html = renderActivityHTML(MOCK_ACTIVITY, MOCK_GRAPH)
    expect(html).toContain('id="apparatus-dialog"')
    expect(html).toContain('showModal()')
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
