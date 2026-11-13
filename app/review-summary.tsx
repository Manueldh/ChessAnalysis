'use client';
import { classify, gameSummary, scoreText, type Game, type Evaluation } from '@/lib/chess/core';
type Props={game:Game;evaluations:Record<number,Evaluation>;index:number;onSelect:(index:number)=>void};
const colors:Record<string,string>={Best:'#95bb4a',Excellent:'#a9c790',Good:'#a4b4a0',Inaccuracy:'#e5bb55',Mistake:'#ff9e53',Blunder:'#fa665b'};
const symbols:Record<string,string>={Best:'★',Excellent:'✓',Good:'•',Inaccuracy:'?!',Mistake:'?',Blunder:'??'};
export function EvaluationGraph({game,evaluations,index,onSelect}:Props){
 const points=game.fens.flatMap((_,i)=>{const l=evaluations[i]?.lines[0];return l?[{i,x:i/game.moves.length*600,y:50-44*Math.tanh(l.score/500)}]:[];});
 const line=points.map(p=>`${p.x},${p.y}`).join(' ');
 return <div className="review-graph"><div className="graph-heading"><strong>Game advantage</strong><span>White ↑ · Black ↓</span></div>
 <svg preserveAspectRatio="none" viewBox="0 0 600 100" role="img" aria-label="Game evaluation. Use the slider below to select a move." onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();onSelect(Math.max(0,Math.min(game.moves.length,Math.round((e.clientX-rect.left)/rect.width*game.moves.length))));}}>
 <rect width="600" height="100" fill="#494846"/><line x1="0" y1="50" x2="600" y2="50" stroke="#82807b"/>
 {points.length>1&&<polygon points={`${points[0].x},100 ${line} ${points.at(-1)!.x},100`} fill="#e8e6df"/>}
 <polyline points={line} fill="none" stroke="#fff" strokeWidth="2"/>
 {points.filter(p=>p.i>0).map(p=>{const move=game.moves[p.i-1];const rating=classify(evaluations[p.i-1],evaluations[p.i],move);return ['Inaccuracy','Mistake','Blunder'].includes(rating.label)?<circle key={p.i} cx={p.x} cy={p.y} r="4" fill={colors[rating.label]}><title>{Math.ceil(p.i/2)}{move.color==='w'?'.':'…'} {move.san}: {rating.label}</title></circle>:null;})}
 <line x1={index/game.moves.length*600} x2={index/game.moves.length*600} y1="0" y2="100" stroke="#81b64c" strokeWidth="2"/>
 </svg><input type="range" min="0" max={game.moves.length} value={index} aria-label="Replay position" aria-valuetext={index?`${Math.ceil(index/2)} ${game.moves[index-1].san}`:'Starting position'} onChange={e=>onSelect(Number(e.target.value))}/>
 <div className="graph-heading"><span>Start</span><span>{index?`Move ${Math.ceil(index/2)} · ${game.moves[index-1].san}`:'Starting position'} · {scoreText(evaluations[index]?.lines[0])}</span><span>End</span></div></div>;
}
export function GameSummary(props:Props){
 const {game,evaluations,index,onSelect}=props;const sides=gameSummary(game,evaluations);
 const ready=sides.every(s=>s.assessed===s.total);
 return <div className="game-summary">
 <EvaluationGraph {...props}/>
 <table className="summary-table"><thead><tr><th scope="col">Players</th>{sides.map(s=><th scope="col" key={s.color}><span className={'summary-avatar '+s.color}><img src={`/pieces/${s.color}p.svg`} alt=""/></span><span className="summary-name">{game.headers[s.color==='w'?'White':'Black']||(s.color==='w'?'White':'Black')}</span><small>{s.color==='w'?'White':'Black'}</small></th>)}</tr></thead>
 <tbody><tr className="accuracy-row"><th scope="row">Accuracy <small>Estimated</small></th>{sides.map(s=><td key={s.color}><strong className={'accuracy-score '+s.color}>{s.accuracy===null?'—':s.accuracy.toFixed(1)}</strong></td>)}</tr>
 {sides[0].categories.map((category,c)=><tr key={category.label}><th scope="row"><span className="summary-symbol" style={{color:colors[category.label]}}>{symbols[category.label]}</span>{category.label}</th>{sides.map(s=>{const indices=s.categories[c].indices;return <td key={s.color}><button disabled={!indices.length} style={{color:colors[category.label]}} aria-label={`${s.color==='w'?'White':'Black'}: ${indices.length} ${category.label} moves. Go to next.`} onClick={()=>onSelect(indices.find(i=>i>index)??indices[0])}>{indices.length}</button></td>;})}</tr>)}
 <tr className="unassessed-row"><th scope="row">Brilliant</th><td colSpan={2}>Not assessed</td></tr></tbody></table>
 <p className="summary-note" aria-live="polite">{ready?'Review complete. Click a count to revisit those moves.':`Reviewed ${sides.reduce((n,s)=>n+s.assessed,0)} of ${game.moves.length} moves. Accuracy appears when each side is fully reviewed.`}</p>
 <details className="summary-method"><summary>How are these ratings calculated?</summary><p>Our accuracy estimate averages move scores based on evaluation loss: 100 × exp(−centipawn loss / 100). Engine-best moves score 100. Ratings depend on analysis depth and can change with deeper review. These are not Chess.com’s scores.</p><p>Brilliant moves require more than a small evaluation loss. This review does not assess sacrifices or award a Brilliant label.</p></details>
 <button className="primary full" onClick={()=>onSelect(1)}>Review moves <span aria-hidden="true">→</span></button>
 </div>;
}
