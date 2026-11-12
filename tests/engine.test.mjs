import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const child=spawn(process.execPath,['node_modules/stockfish/bin/stockfish-19-lite-single.js']);
let text='',stage=0;const timeout=setTimeout(()=>{child.kill();console.error('Engine timeout',text.slice(-1000));process.exitCode=1;},15000);
child.stderr.on('data',d=>process.stderr.write(d));
child.stdout.on('data',d=>{text+=d;for(const line of String(d).split('\n')){if(line==='uciok'&&stage===0){stage=1;child.stdin.write('isready\n');}else if(line==='readyok'&&stage===1){stage=2;child.stdin.write('setoption name MultiPV value 3\nposition startpos\ngo movetime 500\n');}else if(line.startsWith('bestmove ')&&stage===2){assert.match(text,/score cp -?\d+/);assert.match(text,/multipv 3/);assert.match(line,/bestmove [a-h][1-8][a-h][1-8]/);console.log('PASS: Stockfish boots, UCI ready, returns three scored legal candidate lines.');clearTimeout(timeout);child.stdin.write('quit\n');}}});child.stdin.write('uci\n');
