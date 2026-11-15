import {strict as a} from 'node:assert';
import {matches,analysedGame} from '../lib/chess/export';
import {DEMO} from '../lib/chess/core';
const game={id:'1',pgn:DEMO,white:'You',black:'Other',whiteResult:'resigned',blackResult:'win',time:'rapid',date:1794744000};
const f={time:'',color:'',result:'',opponent:'',from:'',to:''};
a.ok(matches(game,'YOU',f));a.ok(matches(game,'you',{...f,result:'loss',color:'w',opponent:'OTH'}));a.ok(!matches(game,'you',{...f,result:'win'}));a.ok(matches(game,'Other',{...f,result:'win',color:'b'}));a.ok(!matches(game,'you',{...f,time:'blitz'}));a.ok(!matches(game,'you',{...f,from:'2030-01-01'}));a.throws(()=>analysedGame(game,'You',{}),/Incomplete/);a.throws(()=>analysedGame(game,'Unknown',{}),/Player/);
console.log('PASS: export filters, colour/result perspective and incomplete-analysis protection');
