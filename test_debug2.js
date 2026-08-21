// Debug _extractBalanced with logs
function _extractBalancedDEBUG(s) {
    let best = null;
    const attempts = [];
    const bi = s.indexOf("{");
    if (bi >= 0) attempts.push({ start: bi, open: "{", close: "}" });
    const ai = s.indexOf("[");
    if (ai >= 0) attempts.push({ start: ai, open: "[", close: "]" });
    console.log('attempts:', JSON.stringify(attempts));
    for (let idx = 0; idx < attempts.length; idx++) {
      const { start, openCh, closeCh } = attempts[idx];
      console.log('\nAttempt', idx, ': start=', start, 'open=', openCh, 'close=', closeCh);
      let depth = 0, inStr = false, escaped = false, end = -1;
      for (let i = start; i < s.length; i++) {
        const c = s[i];
        if (escaped) { escaped = false; continue; }
        if (c === "\\") { escaped = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === openCh) { depth++; /*console.log('  ', i, 'depth++ ->', depth);*/ }
        else if (c === closeCh) { depth--; /*console.log('  ', i, 'depth-- ->', depth);*/ if (depth === 0) { end = i; console.log('  FOUND end=', end); break; } }
      }
      console.log('  after scan: end=', end);
      if (end >= 0) {
        const region = s.slice(start, end + 1);
        const isObj = openCh === "{";
        console.log('  region len=', region.length, 'isObj=', isObj);
        if (!best || (region.length > best.length) || (region.length === best.length && isObj)) {
          best = region;
          console.log('  -> best updated');
        }
      }
    }
    return best;
}

const s = '{"questions":[{"title":"t","body":"a\nb"}]}';
const result = _extractBalancedDEBUG(s);
console.log('\nFINAL result:', result ? 'FOUND len=' + result.length : 'NULL');
