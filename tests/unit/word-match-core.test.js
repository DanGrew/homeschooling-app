import {describe,it,expect} from 'vitest';
import {getDistractors,buildRound} from '../../core/word-match/word-match-core.js';

const items=[
  {id:'dog',name:'Dog',tags:['animals']},
  {id:'cat',name:'Cat',tags:['animals']},
  {id:'bird',name:'Bird',tags:['animals','birds']},
  {id:'fish',name:'Fish',tags:['animals','sea']},
  {id:'circle',name:'Circle',tags:['shapes']},
  {id:'square',name:'Square',tags:['shapes']},
];

describe('getDistractors',()=>{
  it('returns n items excluding target',()=>{
    const d=getDistractors(items[0],items,3);
    expect(d).toHaveLength(3);
    expect(d.every(i=>i.id!=='dog')).toBe(true);
  });
  it('prefers shared-tag items',()=>{
    const d=getDistractors(items[0],items,3);
    expect(d.every(i=>i.tags.includes('animals'))).toBe(true);
  });
  it('falls back to full pool when not enough shared-tag items',()=>{
    const d=getDistractors(items[4],items,3);
    expect(d).toHaveLength(3);
    expect(d.every(i=>i.id!=='circle')).toBe(true);
  });
  it('pins the exact shared-tag pool and shuffle order with a seeded rng',()=>{
    let n=0; const seededRng=()=>{n+=1; return (n%10)/10;};
    const d=getDistractors(items[0],items,3,seededRng);
    expect(d).toEqual([items[3],items[2],items[1]]);
  });
  it('pins the exact fallback pool and shuffle order with a seeded rng',()=>{
    let n=0; const seededRng=()=>{n+=1; return (n%10)/10;};
    const d=getDistractors(items[4],items,3,seededRng);
    expect(d).toEqual([items[5],items[3],items[2]]);
  });
  it('calls the injected rng to shuffle',()=>{
    let calls=0; const countingRng=()=>{calls+=1; return Math.random();};
    getDistractors(items[0],items,3,countingRng);
    expect(calls).toBeGreaterThan(0);
  });
});

describe('buildRound',()=>{
  it('returns target and 4 choices',()=>{
    const r=buildRound(items);
    expect(r.target).toBeDefined();
    expect(r.choices).toHaveLength(4);
  });
  it('target is in choices',()=>{
    const r=buildRound(items);
    expect(r.choices.some(c=>c.id===r.target.id)).toBe(true);
  });
  it('choices are unique',()=>{
    const r=buildRound(items);
    expect(new Set(r.choices.map(c=>c.id)).size).toBe(4);
  });
  it('pins the exact target and choice order with a seeded rng',()=>{
    let n=4; const seededRng=()=>{n+=1; return (n%10)/10;};
    const r=buildRound(items,seededRng);
    expect(r).toEqual({
      target: items[3],
      choices: [items[2], items[3], items[0], items[1]],
    });
  });
});
