// Standalone test of _extractBalanced with real newline
const s = '{"questions":[{"title":"t","body":"a\nb"}]}';
console.log('Input length:', s.length);
console.log('Has real newline:', s.includes('\n'));
console.log('First char:', JSON.stringify(s[0]), 'Last char:', JSON.stringify(s[s.length-1]));
console.log('bi:', s.indexOf('{'), 'ai:', s.indexOf('['));

// Copy-paste the exact function from api.js
function _extractBalanced(s) {
    let best = null;
    const attempts = [];
    const bi = s.indexOf("{");
    if (bi >= 0) attempts.push({ start: bi, open: "{", close: "}" });
    const ai = s.indexOf("[");
    if (ai >= 0) attempts.push({ start: ai, open: "[", close: "]" });
    for (const { start, openCh, closeCh } of attempts) {
      let depth = 0, inStr = false, escaped = false, end = -1;
      for (let i = start; i < s.length; i++) {
        const c = s[i];
        if (escaped) { escaped = false; continue; }
        if (c === "\\") { escaped = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === openCh) depth++;
        else if (c === closeCh) { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end >= 0) {
        const region = s.slice(start, end + 1);
        const isObj = openCh === "{";
        if (!best || (region.length > best.length) || (region.length === best.length && isObj)) best = region;
      }
    }
    return best;
}

const result = _extractBalanced(s);
console.log('_extractBalanced result:', result ? 'FOUND (' + result.length + ' chars)' : 'NULL');
if (result) console.log('First 50:', JSON.stringify(result.slice(0, 50)));
if (!result) {
  // Debug: trace character by character
  console.log('\nManual trace:');
  let depth=0, inStr=false, escaped=false;
  for(let i=0;i<s.length;i++){
    const c=s[i];
    const repr = c==='\n' ? '\\n' : c==='"' ? '"' : c==='\\' ? '\\' : c;
    if(escaped){escaped=false;console.log(i, repr, '(esc->off)');continue;}
    if(c==='\\'){escaped=true;console.log(i, repr, '(esc->on)');continue;}
    if(c==='"'){inStr=!inStr;console.log(i, repr, inStr?'(str->on)':'(str->off)');continue;}
    if(inStr){console.log(i, repr, '(in-str)');continue;}
    if(c==='{'){depth++;console.log(i, repr, 'depth='+depth);}
    else if(c==='}'){depth--;console.log(i, repr, 'depth='+depth);}
    else console.log(i, repr);
  }
}
