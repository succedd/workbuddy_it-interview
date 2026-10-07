/* =========================================================================
 *  js/bundle/bundle-extra.js  —— **自动生成，请勿直接编辑**
 * =========================================================================
 *  由 tools/bundle-js.py 按依赖顺序拼接以下 7 个文件（非首屏（路由 / 交互触发时才用））：
 *    · vendor/highlight.min.js
 *    · js/panorama.js
 *    · js/sharecard.js
 *    · js/guide.js
 *    · js/docs.js
 *    · js/festival.js
 *    · js/importexport.js

 *
 *  为什么合并：实测 Cloudflare 到中国大陆链路约一半请求会卡死，请求数直接决定
 *  首屏能否加载成功（27 个文件全成功概率约 2.7%，4 个约 88%，详见脚本注释）。
 *
 *  ⚠️ 修改上述任一源文件后，必须重跑：python tools/bundle-js.py --write
 * ========================================================================= */

;/* ===== >> vendor/highlight.min.js ===== */
/*!
  Highlight.js v11.9.0 (git: f47103d4f1)
  (c) 2006-2023 undefined and other contributors
  License: BSD-3-Clause
 */
var hljs=function(){"use strict";function e(n){
return n instanceof Map?n.clear=n.delete=n.set=()=>{
throw Error("map is read-only")}:n instanceof Set&&(n.add=n.clear=n.delete=()=>{
throw Error("set is read-only")
}),Object.freeze(n),Object.getOwnPropertyNames(n).forEach((t=>{
const a=n[t],i=typeof a;"object"!==i&&"function"!==i||Object.isFrozen(a)||e(a)
})),n}class n{constructor(e){
void 0===e.data&&(e.data={}),this.data=e.data,this.isMatchIgnored=!1}
ignoreMatch(){this.isMatchIgnored=!0}}function t(e){
return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")
}function a(e,...n){const t=Object.create(null);for(const n in e)t[n]=e[n]
;return n.forEach((e=>{for(const n in e)t[n]=e[n]})),t}const i=e=>!!e.scope
;class r{constructor(e,n){
this.buffer="",this.classPrefix=n.classPrefix,e.walk(this)}addText(e){
this.buffer+=t(e)}openNode(e){if(!i(e))return;const n=((e,{prefix:n})=>{
if(e.startsWith("language:"))return e.replace("language:","language-")
;if(e.includes(".")){const t=e.split(".")
;return[`${n}${t.shift()}`,...t.map(((e,n)=>`${e}${"_".repeat(n+1)}`))].join(" ")
}return`${n}${e}`})(e.scope,{prefix:this.classPrefix});this.span(n)}
closeNode(e){i(e)&&(this.buffer+="</span>")}value(){return this.buffer}span(e){
this.buffer+=`<span class="${e}">`}}const s=(e={})=>{const n={children:[]}
;return Object.assign(n,e),n};class o{constructor(){
this.rootNode=s(),this.stack=[this.rootNode]}get top(){
return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(e){
this.top.children.push(e)}openNode(e){const n=s({scope:e})
;this.add(n),this.stack.push(n)}closeNode(){
if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){
for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}
walk(e){return this.constructor._walk(e,this.rootNode)}static _walk(e,n){
return"string"==typeof n?e.addText(n):n.children&&(e.openNode(n),
n.children.forEach((n=>this._walk(e,n))),e.closeNode(n)),e}static _collapse(e){
"string"!=typeof e&&e.children&&(e.children.every((e=>"string"==typeof e))?e.children=[e.children.join("")]:e.children.forEach((e=>{
o._collapse(e)})))}}class l extends o{constructor(e){super(),this.options=e}
addText(e){""!==e&&this.add(e)}startScope(e){this.openNode(e)}endScope(){
this.closeNode()}__addSublanguage(e,n){const t=e.root
;n&&(t.scope="language:"+n),this.add(t)}toHTML(){
return new r(this,this.options).value()}finalize(){
return this.closeAllNodes(),!0}}function c(e){
return e?"string"==typeof e?e:e.source:null}function d(e){return b("(?=",e,")")}
function g(e){return b("(?:",e,")*")}function u(e){return b("(?:",e,")?")}
function b(...e){return e.map((e=>c(e))).join("")}function m(...e){const n=(e=>{
const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(e);return"("+(n.capture?"":"?:")+e.map((e=>c(e))).join("|")+")"}
function p(e){return RegExp(e.toString()+"|").exec("").length-1}
const _=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./
;function h(e,{joinWith:n}){let t=0;return e.map((e=>{t+=1;const n=t
;let a=c(e),i="";for(;a.length>0;){const e=_.exec(a);if(!e){i+=a;break}
i+=a.substring(0,e.index),
a=a.substring(e.index+e[0].length),"\\"===e[0][0]&&e[1]?i+="\\"+(Number(e[1])+n):(i+=e[0],
"("===e[0]&&t++)}return i})).map((e=>`(${e})`)).join(n)}
const f="[a-zA-Z]\\w*",E="[a-zA-Z_]\\w*",y="\\b\\d+(\\.\\d+)?",N="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",w="\\b(0b[01]+)",v={
begin:"\\\\[\\s\\S]",relevance:0},O={scope:"string",begin:"'",end:"'",
illegal:"\\n",contains:[v]},k={scope:"string",begin:'"',end:'"',illegal:"\\n",
contains:[v]},x=(e,n,t={})=>{const i=a({scope:"comment",begin:e,end:n,
contains:[]},t);i.contains.push({scope:"doctag",
begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0})
;const r=m("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/)
;return i.contains.push({begin:b(/[ ]+/,"(",r,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),i
},M=x("//","$"),S=x("/\\*","\\*/"),A=x("#","$");var C=Object.freeze({
__proto__:null,APOS_STRING_MODE:O,BACKSLASH_ESCAPE:v,BINARY_NUMBER_MODE:{
scope:"number",begin:w,relevance:0},BINARY_NUMBER_RE:w,COMMENT:x,
C_BLOCK_COMMENT_MODE:S,C_LINE_COMMENT_MODE:M,C_NUMBER_MODE:{scope:"number",
begin:N,relevance:0},C_NUMBER_RE:N,END_SAME_AS_BEGIN:e=>Object.assign(e,{
"on:begin":(e,n)=>{n.data._beginMatch=e[1]},"on:end":(e,n)=>{
n.data._beginMatch!==e[1]&&n.ignoreMatch()}}),HASH_COMMENT_MODE:A,IDENT_RE:f,
MATCH_NOTHING_RE:/\b\B/,METHOD_GUARD:{begin:"\\.\\s*"+E,relevance:0},
NUMBER_MODE:{scope:"number",begin:y,relevance:0},NUMBER_RE:y,
PHRASAL_WORDS_MODE:{
begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
},QUOTE_STRING_MODE:k,REGEXP_MODE:{scope:"regexp",begin:/\/(?=[^/\n]*\/)/,
end:/\/[gimuy]*/,contains:[v,{begin:/\[/,end:/\]/,relevance:0,contains:[v]}]},
RE_STARTERS_RE:"!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",
SHEBANG:(e={})=>{const n=/^#![ ]*\//
;return e.binary&&(e.begin=b(n,/.*\b/,e.binary,/\b.*/)),a({scope:"meta",begin:n,
end:/$/,relevance:0,"on:begin":(e,n)=>{0!==e.index&&n.ignoreMatch()}},e)},
TITLE_MODE:{scope:"title",begin:f,relevance:0},UNDERSCORE_IDENT_RE:E,
UNDERSCORE_TITLE_MODE:{scope:"title",begin:E,relevance:0}});function T(e,n){
"."===e.input[e.index-1]&&n.ignoreMatch()}function R(e,n){
void 0!==e.className&&(e.scope=e.className,delete e.className)}function D(e,n){
n&&e.beginKeywords&&(e.begin="\\b("+e.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",
e.__beforeBegin=T,e.keywords=e.keywords||e.beginKeywords,delete e.beginKeywords,
void 0===e.relevance&&(e.relevance=0))}function I(e,n){
Array.isArray(e.illegal)&&(e.illegal=m(...e.illegal))}function L(e,n){
if(e.match){
if(e.begin||e.end)throw Error("begin & end are not supported with match")
;e.begin=e.match,delete e.match}}function B(e,n){
void 0===e.relevance&&(e.relevance=1)}const $=(e,n)=>{if(!e.beforeMatch)return
;if(e.starts)throw Error("beforeMatch cannot be used with starts")
;const t=Object.assign({},e);Object.keys(e).forEach((n=>{delete e[n]
})),e.keywords=t.keywords,e.begin=b(t.beforeMatch,d(t.begin)),e.starts={
relevance:0,contains:[Object.assign(t,{endsParent:!0})]
},e.relevance=0,delete t.beforeMatch
},z=["of","and","for","in","not","or","if","then","parent","list","value"],F="keyword"
;function U(e,n,t=F){const a=Object.create(null)
;return"string"==typeof e?i(t,e.split(" ")):Array.isArray(e)?i(t,e):Object.keys(e).forEach((t=>{
Object.assign(a,U(e[t],n,t))})),a;function i(e,t){
n&&(t=t.map((e=>e.toLowerCase()))),t.forEach((n=>{const t=n.split("|")
;a[t[0]]=[e,j(t[0],t[1])]}))}}function j(e,n){
return n?Number(n):(e=>z.includes(e.toLowerCase()))(e)?0:1}const P={},K=e=>{
console.error(e)},H=(e,...n)=>{console.log("WARN: "+e,...n)},q=(e,n)=>{
P[`${e}/${n}`]||(console.log(`Deprecated as of ${e}. ${n}`),P[`${e}/${n}`]=!0)
},G=Error();function Z(e,n,{key:t}){let a=0;const i=e[t],r={},s={}
;for(let e=1;e<=n.length;e++)s[e+a]=i[e],r[e+a]=!0,a+=p(n[e-1])
;e[t]=s,e[t]._emit=r,e[t]._multi=!0}function W(e){(e=>{
e.scope&&"object"==typeof e.scope&&null!==e.scope&&(e.beginScope=e.scope,
delete e.scope)})(e),"string"==typeof e.beginScope&&(e.beginScope={
_wrap:e.beginScope}),"string"==typeof e.endScope&&(e.endScope={_wrap:e.endScope
}),(e=>{if(Array.isArray(e.begin)){
if(e.skip||e.excludeBegin||e.returnBegin)throw K("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),
G
;if("object"!=typeof e.beginScope||null===e.beginScope)throw K("beginScope must be object"),
G;Z(e,e.begin,{key:"beginScope"}),e.begin=h(e.begin,{joinWith:""})}})(e),(e=>{
if(Array.isArray(e.end)){
if(e.skip||e.excludeEnd||e.returnEnd)throw K("skip, excludeEnd, returnEnd not compatible with endScope: {}"),
G
;if("object"!=typeof e.endScope||null===e.endScope)throw K("endScope must be object"),
G;Z(e,e.end,{key:"endScope"}),e.end=h(e.end,{joinWith:""})}})(e)}function Q(e){
function n(n,t){
return RegExp(c(n),"m"+(e.case_insensitive?"i":"")+(e.unicodeRegex?"u":"")+(t?"g":""))
}class t{constructor(){
this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}
addRule(e,n){
n.position=this.position++,this.matchIndexes[this.matchAt]=n,this.regexes.push([n,e]),
this.matchAt+=p(e)+1}compile(){0===this.regexes.length&&(this.exec=()=>null)
;const e=this.regexes.map((e=>e[1]));this.matcherRe=n(h(e,{joinWith:"|"
}),!0),this.lastIndex=0}exec(e){this.matcherRe.lastIndex=this.lastIndex
;const n=this.matcherRe.exec(e);if(!n)return null
;const t=n.findIndex(((e,n)=>n>0&&void 0!==e)),a=this.matchIndexes[t]
;return n.splice(0,t),Object.assign(n,a)}}class i{constructor(){
this.rules=[],this.multiRegexes=[],
this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(e){
if(this.multiRegexes[e])return this.multiRegexes[e];const n=new t
;return this.rules.slice(e).forEach((([e,t])=>n.addRule(e,t))),
n.compile(),this.multiRegexes[e]=n,n}resumingScanAtSamePosition(){
return 0!==this.regexIndex}considerAll(){this.regexIndex=0}addRule(e,n){
this.rules.push([e,n]),"begin"===n.type&&this.count++}exec(e){
const n=this.getMatcher(this.regexIndex);n.lastIndex=this.lastIndex
;let t=n.exec(e)
;if(this.resumingScanAtSamePosition())if(t&&t.index===this.lastIndex);else{
const n=this.getMatcher(0);n.lastIndex=this.lastIndex+1,t=n.exec(e)}
return t&&(this.regexIndex+=t.position+1,
this.regexIndex===this.count&&this.considerAll()),t}}
if(e.compilerExtensions||(e.compilerExtensions=[]),
e.contains&&e.contains.includes("self"))throw Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.")
;return e.classNameAliases=a(e.classNameAliases||{}),function t(r,s){const o=r
;if(r.isCompiled)return o
;[R,L,W,$].forEach((e=>e(r,s))),e.compilerExtensions.forEach((e=>e(r,s))),
r.__beforeBegin=null,[D,I,B].forEach((e=>e(r,s))),r.isCompiled=!0;let l=null
;return"object"==typeof r.keywords&&r.keywords.$pattern&&(r.keywords=Object.assign({},r.keywords),
l=r.keywords.$pattern,
delete r.keywords.$pattern),l=l||/\w+/,r.keywords&&(r.keywords=U(r.keywords,e.case_insensitive)),
o.keywordPatternRe=n(l,!0),
s&&(r.begin||(r.begin=/\B|\b/),o.beginRe=n(o.begin),r.end||r.endsWithParent||(r.end=/\B|\b/),
r.end&&(o.endRe=n(o.end)),
o.terminatorEnd=c(o.end)||"",r.endsWithParent&&s.terminatorEnd&&(o.terminatorEnd+=(r.end?"|":"")+s.terminatorEnd)),
r.illegal&&(o.illegalRe=n(r.illegal)),
r.contains||(r.contains=[]),r.contains=[].concat(...r.contains.map((e=>(e=>(e.variants&&!e.cachedVariants&&(e.cachedVariants=e.variants.map((n=>a(e,{
variants:null},n)))),e.cachedVariants?e.cachedVariants:X(e)?a(e,{
starts:e.starts?a(e.starts):null
}):Object.isFrozen(e)?a(e):e))("self"===e?r:e)))),r.contains.forEach((e=>{t(e,o)
})),r.starts&&t(r.starts,s),o.matcher=(e=>{const n=new i
;return e.contains.forEach((e=>n.addRule(e.begin,{rule:e,type:"begin"
}))),e.terminatorEnd&&n.addRule(e.terminatorEnd,{type:"end"
}),e.illegal&&n.addRule(e.illegal,{type:"illegal"}),n})(o),o}(e)}function X(e){
return!!e&&(e.endsWithParent||X(e.starts))}class V extends Error{
constructor(e,n){super(e),this.name="HTMLInjectionError",this.html=n}}
const J=t,Y=a,ee=Symbol("nomatch"),ne=t=>{
const a=Object.create(null),i=Object.create(null),r=[];let s=!0
;const o="Could not find the language '{}', did you forget to load/include a language module?",c={
disableAutodetect:!0,name:"Plain text",contains:[]};let p={
ignoreUnescapedHTML:!1,throwUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,
languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",
cssSelector:"pre code",languages:null,__emitter:l};function _(e){
return p.noHighlightRe.test(e)}function h(e,n,t){let a="",i=""
;"object"==typeof n?(a=e,
t=n.ignoreIllegals,i=n.language):(q("10.7.0","highlight(lang, code, ...args) has been deprecated."),
q("10.7.0","Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277"),
i=e,a=n),void 0===t&&(t=!0);const r={code:a,language:i};x("before:highlight",r)
;const s=r.result?r.result:f(r.language,r.code,t)
;return s.code=r.code,x("after:highlight",s),s}function f(e,t,i,r){
const l=Object.create(null);function c(){if(!x.keywords)return void S.addText(A)
;let e=0;x.keywordPatternRe.lastIndex=0;let n=x.keywordPatternRe.exec(A),t=""
;for(;n;){t+=A.substring(e,n.index)
;const i=w.case_insensitive?n[0].toLowerCase():n[0],r=(a=i,x.keywords[a]);if(r){
const[e,a]=r
;if(S.addText(t),t="",l[i]=(l[i]||0)+1,l[i]<=7&&(C+=a),e.startsWith("_"))t+=n[0];else{
const t=w.classNameAliases[e]||e;g(n[0],t)}}else t+=n[0]
;e=x.keywordPatternRe.lastIndex,n=x.keywordPatternRe.exec(A)}var a
;t+=A.substring(e),S.addText(t)}function d(){null!=x.subLanguage?(()=>{
if(""===A)return;let e=null;if("string"==typeof x.subLanguage){
if(!a[x.subLanguage])return void S.addText(A)
;e=f(x.subLanguage,A,!0,M[x.subLanguage]),M[x.subLanguage]=e._top
}else e=E(A,x.subLanguage.length?x.subLanguage:null)
;x.relevance>0&&(C+=e.relevance),S.__addSublanguage(e._emitter,e.language)
})():c(),A=""}function g(e,n){
""!==e&&(S.startScope(n),S.addText(e),S.endScope())}function u(e,n){let t=1
;const a=n.length-1;for(;t<=a;){if(!e._emit[t]){t++;continue}
const a=w.classNameAliases[e[t]]||e[t],i=n[t];a?g(i,a):(A=i,c(),A=""),t++}}
function b(e,n){
return e.scope&&"string"==typeof e.scope&&S.openNode(w.classNameAliases[e.scope]||e.scope),
e.beginScope&&(e.beginScope._wrap?(g(A,w.classNameAliases[e.beginScope._wrap]||e.beginScope._wrap),
A=""):e.beginScope._multi&&(u(e.beginScope,n),A="")),x=Object.create(e,{parent:{
value:x}}),x}function m(e,t,a){let i=((e,n)=>{const t=e&&e.exec(n)
;return t&&0===t.index})(e.endRe,a);if(i){if(e["on:end"]){const a=new n(e)
;e["on:end"](t,a),a.isMatchIgnored&&(i=!1)}if(i){
for(;e.endsParent&&e.parent;)e=e.parent;return e}}
if(e.endsWithParent)return m(e.parent,t,a)}function _(e){
return 0===x.matcher.regexIndex?(A+=e[0],1):(D=!0,0)}function h(e){
const n=e[0],a=t.substring(e.index),i=m(x,e,a);if(!i)return ee;const r=x
;x.endScope&&x.endScope._wrap?(d(),
g(n,x.endScope._wrap)):x.endScope&&x.endScope._multi?(d(),
u(x.endScope,e)):r.skip?A+=n:(r.returnEnd||r.excludeEnd||(A+=n),
d(),r.excludeEnd&&(A=n));do{
x.scope&&S.closeNode(),x.skip||x.subLanguage||(C+=x.relevance),x=x.parent
}while(x!==i.parent);return i.starts&&b(i.starts,e),r.returnEnd?0:n.length}
let y={};function N(a,r){const o=r&&r[0];if(A+=a,null==o)return d(),0
;if("begin"===y.type&&"end"===r.type&&y.index===r.index&&""===o){
if(A+=t.slice(r.index,r.index+1),!s){const n=Error(`0 width match regex (${e})`)
;throw n.languageName=e,n.badRule=y.rule,n}return 1}
if(y=r,"begin"===r.type)return(e=>{
const t=e[0],a=e.rule,i=new n(a),r=[a.__beforeBegin,a["on:begin"]]
;for(const n of r)if(n&&(n(e,i),i.isMatchIgnored))return _(t)
;return a.skip?A+=t:(a.excludeBegin&&(A+=t),
d(),a.returnBegin||a.excludeBegin||(A=t)),b(a,e),a.returnBegin?0:t.length})(r)
;if("illegal"===r.type&&!i){
const e=Error('Illegal lexeme "'+o+'" for mode "'+(x.scope||"<unnamed>")+'"')
;throw e.mode=x,e}if("end"===r.type){const e=h(r);if(e!==ee)return e}
if("illegal"===r.type&&""===o)return 1
;if(R>1e5&&R>3*r.index)throw Error("potential infinite loop, way more iterations than matches")
;return A+=o,o.length}const w=v(e)
;if(!w)throw K(o.replace("{}",e)),Error('Unknown language: "'+e+'"')
;const O=Q(w);let k="",x=r||O;const M={},S=new p.__emitter(p);(()=>{const e=[]
;for(let n=x;n!==w;n=n.parent)n.scope&&e.unshift(n.scope)
;e.forEach((e=>S.openNode(e)))})();let A="",C=0,T=0,R=0,D=!1;try{
if(w.__emitTokens)w.__emitTokens(t,S);else{for(x.matcher.considerAll();;){
R++,D?D=!1:x.matcher.considerAll(),x.matcher.lastIndex=T
;const e=x.matcher.exec(t);if(!e)break;const n=N(t.substring(T,e.index),e)
;T=e.index+n}N(t.substring(T))}return S.finalize(),k=S.toHTML(),{language:e,
value:k,relevance:C,illegal:!1,_emitter:S,_top:x}}catch(n){
if(n.message&&n.message.includes("Illegal"))return{language:e,value:J(t),
illegal:!0,relevance:0,_illegalBy:{message:n.message,index:T,
context:t.slice(T-100,T+100),mode:n.mode,resultSoFar:k},_emitter:S};if(s)return{
language:e,value:J(t),illegal:!1,relevance:0,errorRaised:n,_emitter:S,_top:x}
;throw n}}function E(e,n){n=n||p.languages||Object.keys(a);const t=(e=>{
const n={value:J(e),illegal:!1,relevance:0,_top:c,_emitter:new p.__emitter(p)}
;return n._emitter.addText(e),n})(e),i=n.filter(v).filter(k).map((n=>f(n,e,!1)))
;i.unshift(t);const r=i.sort(((e,n)=>{
if(e.relevance!==n.relevance)return n.relevance-e.relevance
;if(e.language&&n.language){if(v(e.language).supersetOf===n.language)return 1
;if(v(n.language).supersetOf===e.language)return-1}return 0})),[s,o]=r,l=s
;return l.secondBest=o,l}function y(e){let n=null;const t=(e=>{
let n=e.className+" ";n+=e.parentNode?e.parentNode.className:""
;const t=p.languageDetectRe.exec(n);if(t){const n=v(t[1])
;return n||(H(o.replace("{}",t[1])),
H("Falling back to no-highlight mode for this block.",e)),n?t[1]:"no-highlight"}
return n.split(/\s+/).find((e=>_(e)||v(e)))})(e);if(_(t))return
;if(x("before:highlightElement",{el:e,language:t
}),e.dataset.highlighted)return void console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.",e)
;if(e.children.length>0&&(p.ignoreUnescapedHTML||(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),
console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),
console.warn("The element with unescaped HTML:"),
console.warn(e)),p.throwUnescapedHTML))throw new V("One of your code blocks includes unescaped HTML.",e.innerHTML)
;n=e;const a=n.textContent,r=t?h(a,{language:t,ignoreIllegals:!0}):E(a)
;e.innerHTML=r.value,e.dataset.highlighted="yes",((e,n,t)=>{const a=n&&i[n]||t
;e.classList.add("hljs"),e.classList.add("language-"+a)
})(e,t,r.language),e.result={language:r.language,re:r.relevance,
relevance:r.relevance},r.secondBest&&(e.secondBest={
language:r.secondBest.language,relevance:r.secondBest.relevance
}),x("after:highlightElement",{el:e,result:r,text:a})}let N=!1;function w(){
"loading"!==document.readyState?document.querySelectorAll(p.cssSelector).forEach(y):N=!0
}function v(e){return e=(e||"").toLowerCase(),a[e]||a[i[e]]}
function O(e,{languageName:n}){"string"==typeof e&&(e=[e]),e.forEach((e=>{
i[e.toLowerCase()]=n}))}function k(e){const n=v(e)
;return n&&!n.disableAutodetect}function x(e,n){const t=e;r.forEach((e=>{
e[t]&&e[t](n)}))}
"undefined"!=typeof window&&window.addEventListener&&window.addEventListener("DOMContentLoaded",(()=>{
N&&w()}),!1),Object.assign(t,{highlight:h,highlightAuto:E,highlightAll:w,
highlightElement:y,
highlightBlock:e=>(q("10.7.0","highlightBlock will be removed entirely in v12.0"),
q("10.7.0","Please use highlightElement now."),y(e)),configure:e=>{p=Y(p,e)},
initHighlighting:()=>{
w(),q("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")},
initHighlightingOnLoad:()=>{
w(),q("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")
},registerLanguage:(e,n)=>{let i=null;try{i=n(t)}catch(n){
if(K("Language definition for '{}' could not be registered.".replace("{}",e)),
!s)throw n;K(n),i=c}
i.name||(i.name=e),a[e]=i,i.rawDefinition=n.bind(null,t),i.aliases&&O(i.aliases,{
languageName:e})},unregisterLanguage:e=>{delete a[e]
;for(const n of Object.keys(i))i[n]===e&&delete i[n]},
listLanguages:()=>Object.keys(a),getLanguage:v,registerAliases:O,
autoDetection:k,inherit:Y,addPlugin:e=>{(e=>{
e["before:highlightBlock"]&&!e["before:highlightElement"]&&(e["before:highlightElement"]=n=>{
e["before:highlightBlock"](Object.assign({block:n.el},n))
}),e["after:highlightBlock"]&&!e["after:highlightElement"]&&(e["after:highlightElement"]=n=>{
e["after:highlightBlock"](Object.assign({block:n.el},n))})})(e),r.push(e)},
removePlugin:e=>{const n=r.indexOf(e);-1!==n&&r.splice(n,1)}}),t.debugMode=()=>{
s=!1},t.safeMode=()=>{s=!0},t.versionString="11.9.0",t.regex={concat:b,
lookahead:d,either:m,optional:u,anyNumberOfTimes:g}
;for(const n in C)"object"==typeof C[n]&&e(C[n]);return Object.assign(t,C),t
},te=ne({});te.newInstance=()=>ne({});var ae=te;const ie=e=>({IMPORTANT:{
scope:"meta",begin:"!important"},BLOCK_COMMENT:e.C_BLOCK_COMMENT_MODE,HEXCOLOR:{
scope:"number",begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},
FUNCTION_DISPATCH:{className:"built_in",begin:/[\w-]+(?=\()/},
ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",
contains:[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{
scope:"number",
begin:e.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}
}),re=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","p","q","quote","samp","section","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],se=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"],oe=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"],le=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"],ce=["align-content","align-items","align-self","all","animation","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-timing-function","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-repeat","background-size","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-decoration-break","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","content","content-visibility","counter-increment","counter-reset","cue","cue-after","cue-before","cursor","direction","display","empty-cells","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-size","font-size-adjust","font-smoothing","font-stretch","font-style","font-synthesis","font-variant","font-variant-caps","font-variant-east-asian","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","gap","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","inline-size","isolation","justify-content","left","letter-spacing","line-break","line-height","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-wrap","overflow-x","overflow-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page-break-after","page-break-before","page-break-inside","pause","pause-after","pause-before","perspective","perspective-origin","pointer-events","position","quotes","resize","rest","rest-after","rest-before","right","row-gap","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","speak","speak-as","src","tab-size","table-layout","text-align","text-align-all","text-align-last","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-style","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-transform","text-underline-position","top","transform","transform-box","transform-origin","transform-style","transition","transition-delay","transition-duration","transition-property","transition-timing-function","unicode-bidi","vertical-align","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","z-index"].reverse(),de=oe.concat(le)
;var ge="[0-9](_*[0-9])*",ue=`\\.(${ge})`,be="[0-9a-fA-F](_*[0-9a-fA-F])*",me={
className:"number",variants:[{
begin:`(\\b(${ge})((${ue})|\\.)?|(${ue}))[eE][+-]?(${ge})[fFdD]?\\b`},{
begin:`\\b(${ge})((${ue})[fFdD]?\\b|\\.([fFdD]\\b)?)`},{
begin:`(${ue})[fFdD]?\\b`},{begin:`\\b(${ge})[fFdD]\\b`},{
begin:`\\b0[xX]((${be})\\.?|(${be})?\\.(${be}))[pP][+-]?(${ge})[fFdD]?\\b`},{
begin:"\\b(0|[1-9](_*[0-9])*)[lL]?\\b"},{begin:`\\b0[xX](${be})[lL]?\\b`},{
begin:"\\b0(_*[0-7])*[lL]?\\b"},{begin:"\\b0[bB][01](_*[01])*[lL]?\\b"}],
relevance:0};function pe(e,n,t){return-1===t?"":e.replace(n,(a=>pe(e,n,t-1)))}
const _e="[A-Za-z$_][0-9A-Za-z$_]*",he=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends"],fe=["true","false","null","undefined","NaN","Infinity"],Ee=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],ye=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],Ne=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],we=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],ve=[].concat(Ne,Ee,ye)
;function Oe(e){const n=e.regex,t=_e,a={begin:/<[A-Za-z0-9\\._:-]+/,
end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(e,n)=>{
const t=e[0].length+e.index,a=e.input[t]
;if("<"===a||","===a)return void n.ignoreMatch();let i
;">"===a&&(((e,{after:n})=>{const t="</"+e[0].slice(1)
;return-1!==e.input.indexOf(t,n)})(e,{after:t})||n.ignoreMatch())
;const r=e.input.substring(t)
;((i=r.match(/^\s*=/))||(i=r.match(/^\s+extends\s+/))&&0===i.index)&&n.ignoreMatch()
}},i={$pattern:_e,keyword:he,literal:fe,built_in:ve,"variable.language":we
},r="[0-9](_?[0-9])*",s=`\\.(${r})`,o="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",l={
className:"number",variants:[{
begin:`(\\b(${o})((${s})|\\.)?|(${s}))[eE][+-]?(${r})\\b`},{
begin:`\\b(${o})\\b((${s})\\b|\\.)?|(${s})\\b`},{
begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{
begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{
begin:"\\b0[0-7]+n?\\b"}],relevance:0},c={className:"subst",begin:"\\$\\{",
end:"\\}",keywords:i,contains:[]},d={begin:"html`",end:"",starts:{end:"`",
returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,c],subLanguage:"xml"}},g={
begin:"css`",end:"",starts:{end:"`",returnEnd:!1,
contains:[e.BACKSLASH_ESCAPE,c],subLanguage:"css"}},u={begin:"gql`",end:"",
starts:{end:"`",returnEnd:!1,contains:[e.BACKSLASH_ESCAPE,c],
subLanguage:"graphql"}},b={className:"string",begin:"`",end:"`",
contains:[e.BACKSLASH_ESCAPE,c]},m={className:"comment",
variants:[e.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{
begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,
excludeBegin:!0,relevance:0},{className:"variable",begin:t+"(?=\\s*(-)|$)",
endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]
}),e.C_BLOCK_COMMENT_MODE,e.C_LINE_COMMENT_MODE]
},p=[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,d,g,u,b,{match:/\$\d+/},l]
;c.contains=p.concat({begin:/\{/,end:/\}/,keywords:i,contains:["self"].concat(p)
});const _=[].concat(m,c.contains),h=_.concat([{begin:/\(/,end:/\)/,keywords:i,
contains:["self"].concat(_)}]),f={className:"params",begin:/\(/,end:/\)/,
excludeBegin:!0,excludeEnd:!0,keywords:i,contains:h},E={variants:[{
match:[/class/,/\s+/,t,/\s+/,/extends/,/\s+/,n.concat(t,"(",n.concat(/\./,t),")*")],
scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{
match:[/class/,/\s+/,t],scope:{1:"keyword",3:"title.class"}}]},y={relevance:0,
match:n.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),
className:"title.class",keywords:{_:[...Ee,...ye]}},N={variants:[{
match:[/function/,/\s+/,t,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],
className:{1:"keyword",3:"title.function"},label:"func.def",contains:[f],
illegal:/%/},w={
match:n.concat(/\b/,(v=[...Ne,"super","import"],n.concat("(?!",v.join("|"),")")),t,n.lookahead(/\(/)),
className:"title.function",relevance:0};var v;const O={
begin:n.concat(/\./,n.lookahead(n.concat(t,/(?![0-9A-Za-z$_(])/))),end:t,
excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},k={
match:[/get|set/,/\s+/,t,/(?=\()/],className:{1:"keyword",3:"title.function"},
contains:[{begin:/\(\)/},f]
},x="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+e.UNDERSCORE_IDENT_RE+")\\s*=>",M={
match:[/const|var|let/,/\s+/,t,/\s*/,/=\s*/,/(async\s*)?/,n.lookahead(x)],
keywords:"async",className:{1:"keyword",3:"title.function"},contains:[f]}
;return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:i,exports:{
PARAMS_CONTAINS:h,CLASS_REFERENCE:y},illegal:/#(?![$_A-z])/,
contains:[e.SHEBANG({label:"shebang",binary:"node",relevance:5}),{
label:"use_strict",className:"meta",relevance:10,
begin:/^\s*['"]use (strict|asm)['"]/
},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,d,g,u,b,m,{match:/\$\d+/},l,y,{
className:"attr",begin:t+n.lookahead(":"),relevance:0},M,{
begin:"("+e.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",
keywords:"return throw case",relevance:0,contains:[m,e.REGEXP_MODE,{
className:"function",begin:x,returnBegin:!0,end:"\\s*=>",contains:[{
className:"params",variants:[{begin:e.UNDERSCORE_IDENT_RE,relevance:0},{
className:null,begin:/\(\s*\)/,skip:!0},{begin:/\(/,end:/\)/,excludeBegin:!0,
excludeEnd:!0,keywords:i,contains:h}]}]},{begin:/,/,relevance:0},{match:/\s+/,
relevance:0},{variants:[{begin:"<>",end:"</>"},{
match:/<[A-Za-z0-9\\._:-]+\s*\/>/},{begin:a.begin,
"on:begin":a.isTrulyOpeningTag,end:a.end}],subLanguage:"xml",contains:[{
begin:a.begin,end:a.end,skip:!0,contains:["self"]}]}]},N,{
beginKeywords:"while if switch catch for"},{
begin:"\\b(?!function)"+e.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
returnBegin:!0,label:"func.def",contains:[f,e.inherit(e.TITLE_MODE,{begin:t,
className:"title.function"})]},{match:/\.\.\./,relevance:0},O,{match:"\\$"+t,
relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},
contains:[f]},w,{relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,
className:"variable.constant"},E,k,{match:/\$[(.]/}]}}
const ke=e=>b(/\b/,e,/\w$/.test(e)?/\b/:/\B/),xe=["Protocol","Type"].map(ke),Me=["init","self"].map(ke),Se=["Any","Self"],Ae=["actor","any","associatedtype","async","await",/as\?/,/as!/,"as","borrowing","break","case","catch","class","consume","consuming","continue","convenience","copy","default","defer","deinit","didSet","distributed","do","dynamic","each","else","enum","extension","fallthrough",/fileprivate\(set\)/,"fileprivate","final","for","func","get","guard","if","import","indirect","infix",/init\?/,/init!/,"inout",/internal\(set\)/,"internal","in","is","isolated","nonisolated","lazy","let","macro","mutating","nonmutating",/open\(set\)/,"open","operator","optional","override","postfix","precedencegroup","prefix",/private\(set\)/,"private","protocol",/public\(set\)/,"public","repeat","required","rethrows","return","set","some","static","struct","subscript","super","switch","throws","throw",/try\?/,/try!/,"try","typealias",/unowned\(safe\)/,/unowned\(unsafe\)/,"unowned","var","weak","where","while","willSet"],Ce=["false","nil","true"],Te=["assignment","associativity","higherThan","left","lowerThan","none","right"],Re=["#colorLiteral","#column","#dsohandle","#else","#elseif","#endif","#error","#file","#fileID","#fileLiteral","#filePath","#function","#if","#imageLiteral","#keyPath","#line","#selector","#sourceLocation","#warning"],De=["abs","all","any","assert","assertionFailure","debugPrint","dump","fatalError","getVaList","isKnownUniquelyReferenced","max","min","numericCast","pointwiseMax","pointwiseMin","precondition","preconditionFailure","print","readLine","repeatElement","sequence","stride","swap","swift_unboxFromSwiftValueWithType","transcode","type","unsafeBitCast","unsafeDowncast","withExtendedLifetime","withUnsafeMutablePointer","withUnsafePointer","withVaList","withoutActuallyEscaping","zip"],Ie=m(/[/=\-+!*%<>&|^~?]/,/[\u00A1-\u00A7]/,/[\u00A9\u00AB]/,/[\u00AC\u00AE]/,/[\u00B0\u00B1]/,/[\u00B6\u00BB\u00BF\u00D7\u00F7]/,/[\u2016-\u2017]/,/[\u2020-\u2027]/,/[\u2030-\u203E]/,/[\u2041-\u2053]/,/[\u2055-\u205E]/,/[\u2190-\u23FF]/,/[\u2500-\u2775]/,/[\u2794-\u2BFF]/,/[\u2E00-\u2E7F]/,/[\u3001-\u3003]/,/[\u3008-\u3020]/,/[\u3030]/),Le=m(Ie,/[\u0300-\u036F]/,/[\u1DC0-\u1DFF]/,/[\u20D0-\u20FF]/,/[\uFE00-\uFE0F]/,/[\uFE20-\uFE2F]/),Be=b(Ie,Le,"*"),$e=m(/[a-zA-Z_]/,/[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/,/[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/,/[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/,/[\u1E00-\u1FFF]/,/[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/,/[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/,/[\u2C00-\u2DFF\u2E80-\u2FFF]/,/[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/,/[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/,/[\uFE47-\uFEFE\uFF00-\uFFFD]/),ze=m($e,/\d/,/[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/),Fe=b($e,ze,"*"),Ue=b(/[A-Z]/,ze,"*"),je=["attached","autoclosure",b(/convention\(/,m("swift","block","c"),/\)/),"discardableResult","dynamicCallable","dynamicMemberLookup","escaping","freestanding","frozen","GKInspectable","IBAction","IBDesignable","IBInspectable","IBOutlet","IBSegueAction","inlinable","main","nonobjc","NSApplicationMain","NSCopying","NSManaged",b(/objc\(/,Fe,/\)/),"objc","objcMembers","propertyWrapper","requires_stored_property_inits","resultBuilder","Sendable","testable","UIApplicationMain","unchecked","unknown","usableFromInline","warn_unqualified_access"],Pe=["iOS","iOSApplicationExtension","macOS","macOSApplicationExtension","macCatalyst","macCatalystApplicationExtension","watchOS","watchOSApplicationExtension","tvOS","tvOSApplicationExtension","swift"]
;var Ke=Object.freeze({__proto__:null,grmr_bash:e=>{const n=e.regex,t={},a={
begin:/\$\{/,end:/\}/,contains:["self",{begin:/:-/,contains:[t]}]}
;Object.assign(t,{className:"variable",variants:[{
begin:n.concat(/\$[\w\d#@][\w\d_]*/,"(?![\\w\\d])(?![$])")},a]});const i={
className:"subst",begin:/\$\(/,end:/\)/,contains:[e.BACKSLASH_ESCAPE]},r={
begin:/<<-?\s*(?=\w+)/,starts:{contains:[e.END_SAME_AS_BEGIN({begin:/(\w+)/,
end:/(\w+)/,className:"string"})]}},s={className:"string",begin:/"/,end:/"/,
contains:[e.BACKSLASH_ESCAPE,t,i]};i.contains.push(s);const o={begin:/\$?\(\(/,
end:/\)\)/,contains:[{begin:/\d+#[0-9a-f]+/,className:"number"},e.NUMBER_MODE,t]
},l=e.SHEBANG({binary:"(fish|bash|zsh|sh|csh|ksh|tcsh|dash|scsh)",relevance:10
}),c={className:"function",begin:/\w[\w\d_]*\s*\(\s*\)\s*\{/,returnBegin:!0,
contains:[e.inherit(e.TITLE_MODE,{begin:/\w[\w\d_]*/})],relevance:0};return{
name:"Bash",aliases:["sh"],keywords:{$pattern:/\b[a-z][a-z0-9._-]+\b/,
keyword:["if","then","else","elif","fi","for","while","until","in","do","done","case","esac","function","select"],
literal:["true","false"],
built_in:["break","cd","continue","eval","exec","exit","export","getopts","hash","pwd","readonly","return","shift","test","times","trap","umask","unset","alias","bind","builtin","caller","command","declare","echo","enable","help","let","local","logout","mapfile","printf","read","readarray","source","type","typeset","ulimit","unalias","set","shopt","autoload","bg","bindkey","bye","cap","chdir","clone","comparguments","compcall","compctl","compdescribe","compfiles","compgroups","compquote","comptags","comptry","compvalues","dirs","disable","disown","echotc","echoti","emulate","fc","fg","float","functions","getcap","getln","history","integer","jobs","kill","limit","log","noglob","popd","print","pushd","pushln","rehash","sched","setcap","setopt","stat","suspend","ttyctl","unfunction","unhash","unlimit","unsetopt","vared","wait","whence","where","which","zcompile","zformat","zftp","zle","zmodload","zparseopts","zprof","zpty","zregexparse","zsocket","zstyle","ztcp","chcon","chgrp","chown","chmod","cp","dd","df","dir","dircolors","ln","ls","mkdir","mkfifo","mknod","mktemp","mv","realpath","rm","rmdir","shred","sync","touch","truncate","vdir","b2sum","base32","base64","cat","cksum","comm","csplit","cut","expand","fmt","fold","head","join","md5sum","nl","numfmt","od","paste","ptx","pr","sha1sum","sha224sum","sha256sum","sha384sum","sha512sum","shuf","sort","split","sum","tac","tail","tr","tsort","unexpand","uniq","wc","arch","basename","chroot","date","dirname","du","echo","env","expr","factor","groups","hostid","id","link","logname","nice","nohup","nproc","pathchk","pinky","printenv","printf","pwd","readlink","runcon","seq","sleep","stat","stdbuf","stty","tee","test","timeout","tty","uname","unlink","uptime","users","who","whoami","yes"]
},contains:[l,e.SHEBANG(),c,o,e.HASH_COMMENT_MODE,r,{match:/(\/[a-z._-]+)+/},s,{
match:/\\"/},{className:"string",begin:/'/,end:/'/},{match:/\\'/},t]}},
grmr_c:e=>{const n=e.regex,t=e.COMMENT("//","$",{contains:[{begin:/\\\n/}]
}),a="decltype\\(auto\\)",i="[a-zA-Z_]\\w*::",r="("+a+"|"+n.optional(i)+"[a-zA-Z_]\\w*"+n.optional("<[^<>]+>")+")",s={
className:"type",variants:[{begin:"\\b[a-z\\d_]*_t\\b"},{
match:/\batomic_[a-z]{3,6}\b/}]},o={className:"string",variants:[{
begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]},{
begin:"(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
end:"'",illegal:"."},e.END_SAME_AS_BEGIN({
begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},l={
className:"number",variants:[{begin:"\\b(0b[01']+)"},{
begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)"
},{
begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
}],relevance:0},c={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{
keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"
},contains:[{begin:/\\\n/,relevance:0},e.inherit(o,{className:"string"}),{
className:"string",begin:/<.*?>/},t,e.C_BLOCK_COMMENT_MODE]},d={
className:"title",begin:n.optional(i)+e.IDENT_RE,relevance:0
},g=n.optional(i)+e.IDENT_RE+"\\s*\\(",u={
keyword:["asm","auto","break","case","continue","default","do","else","enum","extern","for","fortran","goto","if","inline","register","restrict","return","sizeof","struct","switch","typedef","union","volatile","while","_Alignas","_Alignof","_Atomic","_Generic","_Noreturn","_Static_assert","_Thread_local","alignas","alignof","noreturn","static_assert","thread_local","_Pragma"],
type:["float","double","signed","unsigned","int","short","long","char","void","_Bool","_Complex","_Imaginary","_Decimal32","_Decimal64","_Decimal128","const","static","complex","bool","imaginary"],
literal:"true false NULL",
built_in:"std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr"
},b=[c,s,t,e.C_BLOCK_COMMENT_MODE,l,o],m={variants:[{begin:/=/,end:/;/},{
begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],
keywords:u,contains:b.concat([{begin:/\(/,end:/\)/,keywords:u,
contains:b.concat(["self"]),relevance:0}]),relevance:0},p={
begin:"("+r+"[\\*&\\s]+)+"+g,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,
keywords:u,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:a,keywords:u,relevance:0},{
begin:g,returnBegin:!0,contains:[e.inherit(d,{className:"title.function"})],
relevance:0},{relevance:0,match:/,/},{className:"params",begin:/\(/,end:/\)/,
keywords:u,relevance:0,contains:[t,e.C_BLOCK_COMMENT_MODE,o,l,s,{begin:/\(/,
end:/\)/,keywords:u,relevance:0,contains:["self",t,e.C_BLOCK_COMMENT_MODE,o,l,s]
}]},s,t,e.C_BLOCK_COMMENT_MODE,c]};return{name:"C",aliases:["h"],keywords:u,
disableAutodetect:!0,illegal:"</",contains:[].concat(m,p,b,[c,{
begin:e.IDENT_RE+"::",keywords:u},{className:"class",
beginKeywords:"enum class struct union",end:/[{;:<>=]/,contains:[{
beginKeywords:"final class struct"},e.TITLE_MODE]}]),exports:{preprocessor:c,
strings:o,keywords:u}}},grmr_cpp:e=>{const n=e.regex,t=e.COMMENT("//","$",{
contains:[{begin:/\\\n/}]
}),a="decltype\\(auto\\)",i="[a-zA-Z_]\\w*::",r="(?!struct)("+a+"|"+n.optional(i)+"[a-zA-Z_]\\w*"+n.optional("<[^<>]+>")+")",s={
className:"type",begin:"\\b[a-z\\d_]*_t\\b"},o={className:"string",variants:[{
begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]},{
begin:"(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
end:"'",illegal:"."},e.END_SAME_AS_BEGIN({
begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},l={
className:"number",variants:[{begin:"\\b(0b[01']+)"},{
begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)"
},{
begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
}],relevance:0},c={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{
keyword:"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"
},contains:[{begin:/\\\n/,relevance:0},e.inherit(o,{className:"string"}),{
className:"string",begin:/<.*?>/},t,e.C_BLOCK_COMMENT_MODE]},d={
className:"title",begin:n.optional(i)+e.IDENT_RE,relevance:0
},g=n.optional(i)+e.IDENT_RE+"\\s*\\(",u={
type:["bool","char","char16_t","char32_t","char8_t","double","float","int","long","short","void","wchar_t","unsigned","signed","const","static"],
keyword:["alignas","alignof","and","and_eq","asm","atomic_cancel","atomic_commit","atomic_noexcept","auto","bitand","bitor","break","case","catch","class","co_await","co_return","co_yield","compl","concept","const_cast|10","consteval","constexpr","constinit","continue","decltype","default","delete","do","dynamic_cast|10","else","enum","explicit","export","extern","false","final","for","friend","goto","if","import","inline","module","mutable","namespace","new","noexcept","not","not_eq","nullptr","operator","or","or_eq","override","private","protected","public","reflexpr","register","reinterpret_cast|10","requires","return","sizeof","static_assert","static_cast|10","struct","switch","synchronized","template","this","thread_local","throw","transaction_safe","transaction_safe_dynamic","true","try","typedef","typeid","typename","union","using","virtual","volatile","while","xor","xor_eq"],
literal:["NULL","false","nullopt","nullptr","true"],built_in:["_Pragma"],
_type_hints:["any","auto_ptr","barrier","binary_semaphore","bitset","complex","condition_variable","condition_variable_any","counting_semaphore","deque","false_type","future","imaginary","initializer_list","istringstream","jthread","latch","lock_guard","multimap","multiset","mutex","optional","ostringstream","packaged_task","pair","promise","priority_queue","queue","recursive_mutex","recursive_timed_mutex","scoped_lock","set","shared_future","shared_lock","shared_mutex","shared_timed_mutex","shared_ptr","stack","string_view","stringstream","timed_mutex","thread","true_type","tuple","unique_lock","unique_ptr","unordered_map","unordered_multimap","unordered_multiset","unordered_set","variant","vector","weak_ptr","wstring","wstring_view"]
},b={className:"function.dispatch",relevance:0,keywords:{
_hint:["abort","abs","acos","apply","as_const","asin","atan","atan2","calloc","ceil","cerr","cin","clog","cos","cosh","cout","declval","endl","exchange","exit","exp","fabs","floor","fmod","forward","fprintf","fputs","free","frexp","fscanf","future","invoke","isalnum","isalpha","iscntrl","isdigit","isgraph","islower","isprint","ispunct","isspace","isupper","isxdigit","labs","launder","ldexp","log","log10","make_pair","make_shared","make_shared_for_overwrite","make_tuple","make_unique","malloc","memchr","memcmp","memcpy","memset","modf","move","pow","printf","putchar","puts","realloc","scanf","sin","sinh","snprintf","sprintf","sqrt","sscanf","std","stderr","stdin","stdout","strcat","strchr","strcmp","strcpy","strcspn","strlen","strncat","strncmp","strncpy","strpbrk","strrchr","strspn","strstr","swap","tan","tanh","terminate","to_underlying","tolower","toupper","vfprintf","visit","vprintf","vsprintf"]
},
begin:n.concat(/\b/,/(?!decltype)/,/(?!if)/,/(?!for)/,/(?!switch)/,/(?!while)/,e.IDENT_RE,n.lookahead(/(<[^<>]+>|)\s*\(/))
},m=[b,c,s,t,e.C_BLOCK_COMMENT_MODE,l,o],p={variants:[{begin:/=/,end:/;/},{
begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],
keywords:u,contains:m.concat([{begin:/\(/,end:/\)/,keywords:u,
contains:m.concat(["self"]),relevance:0}]),relevance:0},_={className:"function",
begin:"("+r+"[\\*&\\s]+)+"+g,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,
keywords:u,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:a,keywords:u,relevance:0},{
begin:g,returnBegin:!0,contains:[d],relevance:0},{begin:/::/,relevance:0},{
begin:/:/,endsWithParent:!0,contains:[o,l]},{relevance:0,match:/,/},{
className:"params",begin:/\(/,end:/\)/,keywords:u,relevance:0,
contains:[t,e.C_BLOCK_COMMENT_MODE,o,l,s,{begin:/\(/,end:/\)/,keywords:u,
relevance:0,contains:["self",t,e.C_BLOCK_COMMENT_MODE,o,l,s]}]
},s,t,e.C_BLOCK_COMMENT_MODE,c]};return{name:"C++",
aliases:["cc","c++","h++","hpp","hh","hxx","cxx"],keywords:u,illegal:"</",
classNameAliases:{"function.dispatch":"built_in"},
contains:[].concat(p,_,b,m,[c,{
begin:"\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function)\\s*<(?!<)",
end:">",keywords:u,contains:["self",s]},{begin:e.IDENT_RE+"::",keywords:u},{
match:[/\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,/\s+/,/\w+/],
className:{1:"keyword",3:"title.class"}}])}},grmr_csharp:e=>{const n={
keyword:["abstract","as","base","break","case","catch","class","const","continue","do","else","event","explicit","extern","finally","fixed","for","foreach","goto","if","implicit","in","interface","internal","is","lock","namespace","new","operator","out","override","params","private","protected","public","readonly","record","ref","return","scoped","sealed","sizeof","stackalloc","static","struct","switch","this","throw","try","typeof","unchecked","unsafe","using","virtual","void","volatile","while"].concat(["add","alias","and","ascending","async","await","by","descending","equals","from","get","global","group","init","into","join","let","nameof","not","notnull","on","or","orderby","partial","remove","select","set","unmanaged","value|0","var","when","where","with","yield"]),
built_in:["bool","byte","char","decimal","delegate","double","dynamic","enum","float","int","long","nint","nuint","object","sbyte","short","string","ulong","uint","ushort"],
literal:["default","false","null","true"]},t=e.inherit(e.TITLE_MODE,{
begin:"[a-zA-Z](\\.?\\w)*"}),a={className:"number",variants:[{
begin:"\\b(0b[01']+)"},{
begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)(u|U|l|L|ul|UL|f|F|b|B)"},{
begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"
}],relevance:0},i={className:"string",begin:'@"',end:'"',contains:[{begin:'""'}]
},r=e.inherit(i,{illegal:/\n/}),s={className:"subst",begin:/\{/,end:/\}/,
keywords:n},o=e.inherit(s,{illegal:/\n/}),l={className:"string",begin:/\$"/,
end:'"',illegal:/\n/,contains:[{begin:/\{\{/},{begin:/\}\}/
},e.BACKSLASH_ESCAPE,o]},c={className:"string",begin:/\$@"/,end:'"',contains:[{
begin:/\{\{/},{begin:/\}\}/},{begin:'""'},s]},d=e.inherit(c,{illegal:/\n/,
contains:[{begin:/\{\{/},{begin:/\}\}/},{begin:'""'},o]})
;s.contains=[c,l,i,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,a,e.C_BLOCK_COMMENT_MODE],
o.contains=[d,l,r,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,a,e.inherit(e.C_BLOCK_COMMENT_MODE,{
illegal:/\n/})];const g={variants:[c,l,i,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]
},u={begin:"<",end:">",contains:[{beginKeywords:"in out"},t]
},b=e.IDENT_RE+"(<"+e.IDENT_RE+"(\\s*,\\s*"+e.IDENT_RE+")*>)?(\\[\\])?",m={
begin:"@"+e.IDENT_RE,relevance:0};return{name:"C#",aliases:["cs","c#"],
keywords:n,illegal:/::/,contains:[e.COMMENT("///","$",{returnBegin:!0,
contains:[{className:"doctag",variants:[{begin:"///",relevance:0},{
begin:"\x3c!--|--\x3e"},{begin:"</?",end:">"}]}]
}),e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{className:"meta",begin:"#",
end:"$",keywords:{
keyword:"if else elif endif define undef warning error line region endregion pragma checksum"
}},g,a,{beginKeywords:"class interface",relevance:0,end:/[{;=]/,
illegal:/[^\s:,]/,contains:[{beginKeywords:"where class"
},t,u,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{beginKeywords:"namespace",
relevance:0,end:/[{;=]/,illegal:/[^\s:]/,
contains:[t,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{
beginKeywords:"record",relevance:0,end:/[{;=]/,illegal:/[^\s:]/,
contains:[t,u,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{className:"meta",
begin:"^\\s*\\[(?=[\\w])",excludeBegin:!0,end:"\\]",excludeEnd:!0,contains:[{
className:"string",begin:/"/,end:/"/}]},{
beginKeywords:"new return throw await else",relevance:0},{className:"function",
begin:"("+b+"\\s+)+"+e.IDENT_RE+"\\s*(<[^=]+>\\s*)?\\(",returnBegin:!0,
end:/\s*[{;=]/,excludeEnd:!0,keywords:n,contains:[{
beginKeywords:"public private protected static internal protected abstract async extern override unsafe virtual new sealed partial",
relevance:0},{begin:e.IDENT_RE+"\\s*(<[^=]+>\\s*)?\\(",returnBegin:!0,
contains:[e.TITLE_MODE,u],relevance:0},{match:/\(\)/},{className:"params",
begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:n,relevance:0,
contains:[g,a,e.C_BLOCK_COMMENT_MODE]
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},m]}},grmr_css:e=>{
const n=e.regex,t=ie(e),a=[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE];return{
name:"CSS",case_insensitive:!0,illegal:/[=|'\$]/,keywords:{
keyframePosition:"from to"},classNameAliases:{keyframePosition:"selector-tag"},
contains:[t.BLOCK_COMMENT,{begin:/-(webkit|moz|ms|o)-(?=[a-z])/
},t.CSS_NUMBER_MODE,{className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0
},{className:"selector-class",begin:"\\.[a-zA-Z-][a-zA-Z0-9_-]*",relevance:0
},t.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{
begin:":("+oe.join("|")+")"},{begin:":(:)?("+le.join("|")+")"}]
},t.CSS_VARIABLE,{className:"attribute",begin:"\\b("+ce.join("|")+")\\b"},{
begin:/:/,end:/[;}{]/,
contains:[t.BLOCK_COMMENT,t.HEXCOLOR,t.IMPORTANT,t.CSS_NUMBER_MODE,...a,{
begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"
},contains:[...a,{className:"string",begin:/[^)]/,endsWithParent:!0,
excludeEnd:!0}]},t.FUNCTION_DISPATCH]},{begin:n.lookahead(/@/),end:"[{;]",
relevance:0,illegal:/:/,contains:[{className:"keyword",begin:/@-?\w[\w]*(-\w+)*/
},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{
$pattern:/[a-z-]+/,keyword:"and or not only",attribute:se.join(" ")},contains:[{
begin:/[a-z-]+(?=:)/,className:"attribute"},...a,t.CSS_NUMBER_MODE]}]},{
className:"selector-tag",begin:"\\b("+re.join("|")+")\\b"}]}},grmr_diff:e=>{
const n=e.regex;return{name:"Diff",aliases:["patch"],contains:[{
className:"meta",relevance:10,
match:n.either(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,/^\*\*\* +\d+,\d+ +\*\*\*\*$/,/^--- +\d+,\d+ +----$/)
},{className:"comment",variants:[{
begin:n.either(/Index: /,/^index/,/={3,}/,/^-{3}/,/^\*{3} /,/^\+{3}/,/^diff --git/),
end:/$/},{match:/^\*{15}$/}]},{className:"addition",begin:/^\+/,end:/$/},{
className:"deletion",begin:/^-/,end:/$/},{className:"addition",begin:/^!/,
end:/$/}]}},grmr_go:e=>{const n={
keyword:["break","case","chan","const","continue","default","defer","else","fallthrough","for","func","go","goto","if","import","interface","map","package","range","return","select","struct","switch","type","var"],
type:["bool","byte","complex64","complex128","error","float32","float64","int8","int16","int32","int64","string","uint8","uint16","uint32","uint64","int","uint","uintptr","rune"],
literal:["true","false","iota","nil"],
built_in:["append","cap","close","complex","copy","imag","len","make","new","panic","print","println","real","recover","delete"]
};return{name:"Go",aliases:["golang"],keywords:n,illegal:"</",
contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{className:"string",
variants:[e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,{begin:"`",end:"`"}]},{
className:"number",variants:[{begin:e.C_NUMBER_RE+"[i]",relevance:1
},e.C_NUMBER_MODE]},{begin:/:=/},{className:"function",beginKeywords:"func",
end:"\\s*(\\{|$)",excludeEnd:!0,contains:[e.TITLE_MODE,{className:"params",
begin:/\(/,end:/\)/,endsParent:!0,keywords:n,illegal:/["']/}]}]}},
grmr_graphql:e=>{const n=e.regex;return{name:"GraphQL",aliases:["gql"],
case_insensitive:!0,disableAutodetect:!1,keywords:{
keyword:["query","mutation","subscription","type","input","schema","directive","interface","union","scalar","fragment","enum","on"],
literal:["true","false","null"]},
contains:[e.HASH_COMMENT_MODE,e.QUOTE_STRING_MODE,e.NUMBER_MODE,{
scope:"punctuation",match:/[.]{3}/,relevance:0},{scope:"punctuation",
begin:/[\!\(\)\:\=\[\]\{\|\}]{1}/,relevance:0},{scope:"variable",begin:/\$/,
end:/\W/,excludeEnd:!0,relevance:0},{scope:"meta",match:/@\w+/,excludeEnd:!0},{
scope:"symbol",begin:n.concat(/[_A-Za-z][_0-9A-Za-z]*/,n.lookahead(/\s*:/)),
relevance:0}],illegal:[/[;<']/,/BEGIN/]}},grmr_ini:e=>{const n=e.regex,t={
className:"number",relevance:0,variants:[{begin:/([+-]+)?[\d]+_[\d_]+/},{
begin:e.NUMBER_RE}]},a=e.COMMENT();a.variants=[{begin:/;/,end:/$/},{begin:/#/,
end:/$/}];const i={className:"variable",variants:[{begin:/\$[\w\d"][\w\d_]*/},{
begin:/\$\{(.*?)\}/}]},r={className:"literal",
begin:/\bon|off|true|false|yes|no\b/},s={className:"string",
contains:[e.BACKSLASH_ESCAPE],variants:[{begin:"'''",end:"'''",relevance:10},{
begin:'"""',end:'"""',relevance:10},{begin:'"',end:'"'},{begin:"'",end:"'"}]
},o={begin:/\[/,end:/\]/,contains:[a,r,i,s,t,"self"],relevance:0
},l=n.either(/[A-Za-z0-9_-]+/,/"(\\"|[^"])*"/,/'[^']*'/);return{
name:"TOML, also INI",aliases:["toml"],case_insensitive:!0,illegal:/\S/,
contains:[a,{className:"section",begin:/\[+/,end:/\]+/},{
begin:n.concat(l,"(\\s*\\.\\s*",l,")*",n.lookahead(/\s*=\s*[^#\s]/)),
className:"attr",starts:{end:/$/,contains:[a,o,r,i,s,t]}}]}},grmr_java:e=>{
const n=e.regex,t="[\xc0-\u02b8a-zA-Z_$][\xc0-\u02b8a-zA-Z_$0-9]*",a=t+pe("(?:<"+t+"~~~(?:\\s*,\\s*"+t+"~~~)*>)?",/~~~/g,2),i={
keyword:["synchronized","abstract","private","var","static","if","const ","for","while","strictfp","finally","protected","import","native","final","void","enum","else","break","transient","catch","instanceof","volatile","case","assert","package","default","public","try","switch","continue","throws","protected","public","private","module","requires","exports","do","sealed","yield","permits"],
literal:["false","true","null"],
type:["char","boolean","long","float","int","byte","short","double"],
built_in:["super","this"]},r={className:"meta",begin:"@"+t,contains:[{
begin:/\(/,end:/\)/,contains:["self"]}]},s={className:"params",begin:/\(/,
end:/\)/,keywords:i,relevance:0,contains:[e.C_BLOCK_COMMENT_MODE],endsParent:!0}
;return{name:"Java",aliases:["jsp"],keywords:i,illegal:/<\/|#/,
contains:[e.COMMENT("/\\*\\*","\\*/",{relevance:0,contains:[{begin:/\w+@/,
relevance:0},{className:"doctag",begin:"@[A-Za-z]+"}]}),{
begin:/import java\.[a-z]+\./,keywords:"import",relevance:2
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,{begin:/"""/,end:/"""/,
className:"string",contains:[e.BACKSLASH_ESCAPE]
},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,{
match:[/\b(?:class|interface|enum|extends|implements|new)/,/\s+/,t],className:{
1:"keyword",3:"title.class"}},{match:/non-sealed/,scope:"keyword"},{
begin:[n.concat(/(?!else)/,t),/\s+/,t,/\s+/,/=(?!=)/],className:{1:"type",
3:"variable",5:"operator"}},{begin:[/record/,/\s+/,t],className:{1:"keyword",
3:"title.class"},contains:[s,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{
beginKeywords:"new throw return else",relevance:0},{
begin:["(?:"+a+"\\s+)",e.UNDERSCORE_IDENT_RE,/\s*(?=\()/],className:{
2:"title.function"},keywords:i,contains:[{className:"params",begin:/\(/,
end:/\)/,keywords:i,relevance:0,
contains:[r,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,me,e.C_BLOCK_COMMENT_MODE]
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},me,r]}},grmr_javascript:Oe,
grmr_json:e=>{const n=["true","false","null"],t={scope:"literal",
beginKeywords:n.join(" ")};return{name:"JSON",keywords:{literal:n},contains:[{
className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,relevance:1.01},{
match:/[{}[\],:]/,className:"punctuation",relevance:0
},e.QUOTE_STRING_MODE,t,e.C_NUMBER_MODE,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE],
illegal:"\\S"}},grmr_kotlin:e=>{const n={
keyword:"abstract as val var vararg get set class object open private protected public noinline crossinline dynamic final enum if else do while for when throw try catch finally import package is in fun override companion reified inline lateinit init interface annotation data sealed internal infix operator out by constructor super tailrec where const inner suspend typealias external expect actual",
built_in:"Byte Short Char Int Long Boolean Float Double Void Unit Nothing",
literal:"true false null"},t={className:"symbol",begin:e.UNDERSCORE_IDENT_RE+"@"
},a={className:"subst",begin:/\$\{/,end:/\}/,contains:[e.C_NUMBER_MODE]},i={
className:"variable",begin:"\\$"+e.UNDERSCORE_IDENT_RE},r={className:"string",
variants:[{begin:'"""',end:'"""(?=[^"])',contains:[i,a]},{begin:"'",end:"'",
illegal:/\n/,contains:[e.BACKSLASH_ESCAPE]},{begin:'"',end:'"',illegal:/\n/,
contains:[e.BACKSLASH_ESCAPE,i,a]}]};a.contains.push(r);const s={
className:"meta",
begin:"@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*"+e.UNDERSCORE_IDENT_RE+")?"
},o={className:"meta",begin:"@"+e.UNDERSCORE_IDENT_RE,contains:[{begin:/\(/,
end:/\)/,contains:[e.inherit(r,{className:"string"}),"self"]}]
},l=me,c=e.COMMENT("/\\*","\\*/",{contains:[e.C_BLOCK_COMMENT_MODE]}),d={
variants:[{className:"type",begin:e.UNDERSCORE_IDENT_RE},{begin:/\(/,end:/\)/,
contains:[]}]},g=d;return g.variants[1].contains=[d],d.variants[1].contains=[g],
{name:"Kotlin",aliases:["kt","kts"],keywords:n,
contains:[e.COMMENT("/\\*\\*","\\*/",{relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"}]}),e.C_LINE_COMMENT_MODE,c,{className:"keyword",
begin:/\b(break|continue|return|this)\b/,starts:{contains:[{className:"symbol",
begin:/@\w+/}]}},t,s,o,{className:"function",beginKeywords:"fun",end:"[(]|$",
returnBegin:!0,excludeEnd:!0,keywords:n,relevance:5,contains:[{
begin:e.UNDERSCORE_IDENT_RE+"\\s*\\(",returnBegin:!0,relevance:0,
contains:[e.UNDERSCORE_TITLE_MODE]},{className:"type",begin:/</,end:/>/,
keywords:"reified",relevance:0},{className:"params",begin:/\(/,end:/\)/,
endsParent:!0,keywords:n,relevance:0,contains:[{begin:/:/,end:/[=,\/]/,
endsWithParent:!0,contains:[d,e.C_LINE_COMMENT_MODE,c],relevance:0
},e.C_LINE_COMMENT_MODE,c,s,o,r,e.C_NUMBER_MODE]},c]},{
begin:[/class|interface|trait/,/\s+/,e.UNDERSCORE_IDENT_RE],beginScope:{
3:"title.class"},keywords:"class interface trait",end:/[:\{(]|$/,excludeEnd:!0,
illegal:"extends implements",contains:[{
beginKeywords:"public protected internal private constructor"
},e.UNDERSCORE_TITLE_MODE,{className:"type",begin:/</,end:/>/,excludeBegin:!0,
excludeEnd:!0,relevance:0},{className:"type",begin:/[,:]\s*/,end:/[<\(,){\s]|$/,
excludeBegin:!0,returnEnd:!0},s,o]},r,{className:"meta",begin:"^#!/usr/bin/env",
end:"$",illegal:"\n"},l]}},grmr_less:e=>{
const n=ie(e),t=de,a="[\\w-]+",i="("+a+"|@\\{"+a+"\\})",r=[],s=[],o=e=>({
className:"string",begin:"~?"+e+".*?"+e}),l=(e,n,t)=>({className:e,begin:n,
relevance:t}),c={$pattern:/[a-z-]+/,keyword:"and or not only",
attribute:se.join(" ")},d={begin:"\\(",end:"\\)",contains:s,keywords:c,
relevance:0}
;s.push(e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,o("'"),o('"'),n.CSS_NUMBER_MODE,{
begin:"(url|data-uri)\\(",starts:{className:"string",end:"[\\)\\n]",
excludeEnd:!0}
},n.HEXCOLOR,d,l("variable","@@?"+a,10),l("variable","@\\{"+a+"\\}"),l("built_in","~?`[^`]*?`"),{
className:"attribute",begin:a+"\\s*:",end:":",returnBegin:!0,excludeEnd:!0
},n.IMPORTANT,{beginKeywords:"and not"},n.FUNCTION_DISPATCH);const g=s.concat({
begin:/\{/,end:/\}/,contains:r}),u={beginKeywords:"when",endsWithParent:!0,
contains:[{beginKeywords:"and not"}].concat(s)},b={begin:i+"\\s*:",
returnBegin:!0,end:/[;}]/,relevance:0,contains:[{begin:/-(webkit|moz|ms|o)-/
},n.CSS_VARIABLE,{className:"attribute",begin:"\\b("+ce.join("|")+")\\b",
end:/(?=:)/,starts:{endsWithParent:!0,illegal:"[<=$]",relevance:0,contains:s}}]
},m={className:"keyword",
begin:"@(import|media|charset|font-face|(-[a-z]+-)?keyframes|supports|document|namespace|page|viewport|host)\\b",
starts:{end:"[;{}]",keywords:c,returnEnd:!0,contains:s,relevance:0}},p={
className:"variable",variants:[{begin:"@"+a+"\\s*:",relevance:15},{begin:"@"+a
}],starts:{end:"[;}]",returnEnd:!0,contains:g}},_={variants:[{
begin:"[\\.#:&\\[>]",end:"[;{}]"},{begin:i,end:/\{/}],returnBegin:!0,
returnEnd:!0,illegal:"[<='$\"]",relevance:0,
contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,u,l("keyword","all\\b"),l("variable","@\\{"+a+"\\}"),{
begin:"\\b("+re.join("|")+")\\b",className:"selector-tag"
},n.CSS_NUMBER_MODE,l("selector-tag",i,0),l("selector-id","#"+i),l("selector-class","\\."+i,0),l("selector-tag","&",0),n.ATTRIBUTE_SELECTOR_MODE,{
className:"selector-pseudo",begin:":("+oe.join("|")+")"},{
className:"selector-pseudo",begin:":(:)?("+le.join("|")+")"},{begin:/\(/,
end:/\)/,relevance:0,contains:g},{begin:"!important"},n.FUNCTION_DISPATCH]},h={
begin:a+":(:)?"+`(${t.join("|")})`,returnBegin:!0,contains:[_]}
;return r.push(e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,m,p,h,b,_,u,n.FUNCTION_DISPATCH),
{name:"Less",case_insensitive:!0,illegal:"[=>'/<($\"]",contains:r}},
grmr_lua:e=>{const n="\\[=*\\[",t="\\]=*\\]",a={begin:n,end:t,contains:["self"]
},i=[e.COMMENT("--(?!"+n+")","$"),e.COMMENT("--"+n,t,{contains:[a],relevance:10
})];return{name:"Lua",keywords:{$pattern:e.UNDERSCORE_IDENT_RE,
literal:"true false nil",
keyword:"and break do else elseif end for goto if in local not or repeat return then until while",
built_in:"_G _ENV _VERSION __index __newindex __mode __call __metatable __tostring __len __gc __add __sub __mul __div __mod __pow __concat __unm __eq __lt __le assert collectgarbage dofile error getfenv getmetatable ipairs load loadfile loadstring module next pairs pcall print rawequal rawget rawset require select setfenv setmetatable tonumber tostring type unpack xpcall arg self coroutine resume yield status wrap create running debug getupvalue debug sethook getmetatable gethook setmetatable setlocal traceback setfenv getinfo setupvalue getlocal getregistry getfenv io lines write close flush open output type read stderr stdin input stdout popen tmpfile math log max acos huge ldexp pi cos tanh pow deg tan cosh sinh random randomseed frexp ceil floor rad abs sqrt modf asin min mod fmod log10 atan2 exp sin atan os exit setlocale date getenv difftime remove time clock tmpname rename execute package preload loadlib loaded loaders cpath config path seeall string sub upper len gfind rep find match char dump gmatch reverse byte format gsub lower table setn insert getn foreachi maxn foreach concat sort remove"
},contains:i.concat([{className:"function",beginKeywords:"function",end:"\\)",
contains:[e.inherit(e.TITLE_MODE,{
begin:"([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*"}),{className:"params",
begin:"\\(",endsWithParent:!0,contains:i}].concat(i)
},e.C_NUMBER_MODE,e.APOS_STRING_MODE,e.QUOTE_STRING_MODE,{className:"string",
begin:n,end:t,contains:[a],relevance:5}])}},grmr_makefile:e=>{const n={
className:"variable",variants:[{begin:"\\$\\("+e.UNDERSCORE_IDENT_RE+"\\)",
contains:[e.BACKSLASH_ESCAPE]},{begin:/\$[@%<?\^\+\*]/}]},t={className:"string",
begin:/"/,end:/"/,contains:[e.BACKSLASH_ESCAPE,n]},a={className:"variable",
begin:/\$\([\w-]+\s/,end:/\)/,keywords:{
built_in:"subst patsubst strip findstring filter filter-out sort word wordlist firstword lastword dir notdir suffix basename addsuffix addprefix join wildcard realpath abspath error warning shell origin flavor foreach if or and call eval file value"
},contains:[n]},i={begin:"^"+e.UNDERSCORE_IDENT_RE+"\\s*(?=[:+?]?=)"},r={
className:"section",begin:/^[^\s]+:/,end:/$/,contains:[n]};return{
name:"Makefile",aliases:["mk","mak","make"],keywords:{$pattern:/[\w-]+/,
keyword:"define endef undefine ifdef ifndef ifeq ifneq else endif include -include sinclude override export unexport private vpath"
},contains:[e.HASH_COMMENT_MODE,n,t,a,i,{className:"meta",begin:/^\.PHONY:/,
end:/$/,keywords:{$pattern:/[\.\w]+/,keyword:".PHONY"}},r]}},grmr_markdown:e=>{
const n={begin:/<\/?[A-Za-z_]/,end:">",subLanguage:"xml",relevance:0},t={
variants:[{begin:/\[.+?\]\[.*?\]/,relevance:0},{
begin:/\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
relevance:2},{
begin:e.regex.concat(/\[.+?\]\(/,/[A-Za-z][A-Za-z0-9+.-]*/,/:\/\/.*?\)/),
relevance:2},{begin:/\[.+?\]\([./?&#].*?\)/,relevance:1},{
begin:/\[.*?\]\(.*?\)/,relevance:0}],returnBegin:!0,contains:[{match:/\[(?=\])/
},{className:"string",relevance:0,begin:"\\[",end:"\\]",excludeBegin:!0,
returnEnd:!0},{className:"link",relevance:0,begin:"\\]\\(",end:"\\)",
excludeBegin:!0,excludeEnd:!0},{className:"symbol",relevance:0,begin:"\\]\\[",
end:"\\]",excludeBegin:!0,excludeEnd:!0}]},a={className:"strong",contains:[],
variants:[{begin:/_{2}(?!\s)/,end:/_{2}/},{begin:/\*{2}(?!\s)/,end:/\*{2}/}]
},i={className:"emphasis",contains:[],variants:[{begin:/\*(?![*\s])/,end:/\*/},{
begin:/_(?![_\s])/,end:/_/,relevance:0}]},r=e.inherit(a,{contains:[]
}),s=e.inherit(i,{contains:[]});a.contains.push(s),i.contains.push(r)
;let o=[n,t];return[a,i,r,s].forEach((e=>{e.contains=e.contains.concat(o)
})),o=o.concat(a,i),{name:"Markdown",aliases:["md","mkdown","mkd"],contains:[{
className:"section",variants:[{begin:"^#{1,6}",end:"$",contains:o},{
begin:"(?=^.+?\\n[=-]{2,}$)",contains:[{begin:"^[=-]*$"},{begin:"^",end:"\\n",
contains:o}]}]},n,{className:"bullet",begin:"^[ \t]*([*+-]|(\\d+\\.))(?=\\s+)",
end:"\\s+",excludeEnd:!0},a,i,{className:"quote",begin:"^>\\s+",contains:o,
end:"$"},{className:"code",variants:[{begin:"(`{3,})[^`](.|\\n)*?\\1`*[ ]*"},{
begin:"(~{3,})[^~](.|\\n)*?\\1~*[ ]*"},{begin:"```",end:"```+[ ]*$"},{
begin:"~~~",end:"~~~+[ ]*$"},{begin:"`.+?`"},{begin:"(?=^( {4}|\\t))",
contains:[{begin:"^( {4}|\\t)",end:"(\\n)$"}],relevance:0}]},{
begin:"^[-\\*]{3,}",end:"$"},t,{begin:/^\[[^\n]+\]:/,returnBegin:!0,contains:[{
className:"symbol",begin:/\[/,end:/\]/,excludeBegin:!0,excludeEnd:!0},{
className:"link",begin:/:\s*/,end:/$/,excludeBegin:!0}]}]}},grmr_objectivec:e=>{
const n=/[a-zA-Z@][a-zA-Z0-9_]*/,t={$pattern:n,
keyword:["@interface","@class","@protocol","@implementation"]};return{
name:"Objective-C",aliases:["mm","objc","obj-c","obj-c++","objective-c++"],
keywords:{"variable.language":["this","super"],$pattern:n,
keyword:["while","export","sizeof","typedef","const","struct","for","union","volatile","static","mutable","if","do","return","goto","enum","else","break","extern","asm","case","default","register","explicit","typename","switch","continue","inline","readonly","assign","readwrite","self","@synchronized","id","typeof","nonatomic","IBOutlet","IBAction","strong","weak","copy","in","out","inout","bycopy","byref","oneway","__strong","__weak","__block","__autoreleasing","@private","@protected","@public","@try","@property","@end","@throw","@catch","@finally","@autoreleasepool","@synthesize","@dynamic","@selector","@optional","@required","@encode","@package","@import","@defs","@compatibility_alias","__bridge","__bridge_transfer","__bridge_retained","__bridge_retain","__covariant","__contravariant","__kindof","_Nonnull","_Nullable","_Null_unspecified","__FUNCTION__","__PRETTY_FUNCTION__","__attribute__","getter","setter","retain","unsafe_unretained","nonnull","nullable","null_unspecified","null_resettable","class","instancetype","NS_DESIGNATED_INITIALIZER","NS_UNAVAILABLE","NS_REQUIRES_SUPER","NS_RETURNS_INNER_POINTER","NS_INLINE","NS_AVAILABLE","NS_DEPRECATED","NS_ENUM","NS_OPTIONS","NS_SWIFT_UNAVAILABLE","NS_ASSUME_NONNULL_BEGIN","NS_ASSUME_NONNULL_END","NS_REFINED_FOR_SWIFT","NS_SWIFT_NAME","NS_SWIFT_NOTHROW","NS_DURING","NS_HANDLER","NS_ENDHANDLER","NS_VALUERETURN","NS_VOIDRETURN"],
literal:["false","true","FALSE","TRUE","nil","YES","NO","NULL"],
built_in:["dispatch_once_t","dispatch_queue_t","dispatch_sync","dispatch_async","dispatch_once"],
type:["int","float","char","unsigned","signed","short","long","double","wchar_t","unichar","void","bool","BOOL","id|0","_Bool"]
},illegal:"</",contains:[{className:"built_in",
begin:"\\b(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)\\w+"
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,e.C_NUMBER_MODE,e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,{
className:"string",variants:[{begin:'@"',end:'"',illegal:"\\n",
contains:[e.BACKSLASH_ESCAPE]}]},{className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,
keywords:{
keyword:"if else elif endif define undef warning error line pragma ifdef ifndef include"
},contains:[{begin:/\\\n/,relevance:0},e.inherit(e.QUOTE_STRING_MODE,{
className:"string"}),{className:"string",begin:/<.*?>/,end:/$/,illegal:"\\n"
},e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE]},{className:"class",
begin:"("+t.keyword.join("|")+")\\b",end:/(\{|$)/,excludeEnd:!0,keywords:t,
contains:[e.UNDERSCORE_TITLE_MODE]},{begin:"\\."+e.UNDERSCORE_IDENT_RE,
relevance:0}]}},grmr_perl:e=>{const n=e.regex,t=/[dualxmsipngr]{0,12}/,a={
$pattern:/[\w.]+/,
keyword:"abs accept alarm and atan2 bind binmode bless break caller chdir chmod chomp chop chown chr chroot close closedir connect continue cos crypt dbmclose dbmopen defined delete die do dump each else elsif endgrent endhostent endnetent endprotoent endpwent endservent eof eval exec exists exit exp fcntl fileno flock for foreach fork format formline getc getgrent getgrgid getgrnam gethostbyaddr gethostbyname gethostent getlogin getnetbyaddr getnetbyname getnetent getpeername getpgrp getpriority getprotobyname getprotobynumber getprotoent getpwent getpwnam getpwuid getservbyname getservbyport getservent getsockname getsockopt given glob gmtime goto grep gt hex if index int ioctl join keys kill last lc lcfirst length link listen local localtime log lstat lt ma map mkdir msgctl msgget msgrcv msgsnd my ne next no not oct open opendir or ord our pack package pipe pop pos print printf prototype push q|0 qq quotemeta qw qx rand read readdir readline readlink readpipe recv redo ref rename require reset return reverse rewinddir rindex rmdir say scalar seek seekdir select semctl semget semop send setgrent sethostent setnetent setpgrp setpriority setprotoent setpwent setservent setsockopt shift shmctl shmget shmread shmwrite shutdown sin sleep socket socketpair sort splice split sprintf sqrt srand stat state study sub substr symlink syscall sysopen sysread sysseek system syswrite tell telldir tie tied time times tr truncate uc ucfirst umask undef unless unlink unpack unshift untie until use utime values vec wait waitpid wantarray warn when while write x|0 xor y|0"
},i={className:"subst",begin:"[$@]\\{",end:"\\}",keywords:a},r={begin:/->\{/,
end:/\}/},s={variants:[{begin:/\$\d/},{
begin:n.concat(/[$%@](\^\w\b|#\w+(::\w+)*|\{\w+\}|\w+(::\w*)*)/,"(?![A-Za-z])(?![@$%])")
},{begin:/[$%@][^\s\w{]/,relevance:0}]
},o=[e.BACKSLASH_ESCAPE,i,s],l=[/!/,/\//,/\|/,/\?/,/'/,/"/,/#/],c=(e,a,i="\\1")=>{
const r="\\1"===i?i:n.concat(i,a)
;return n.concat(n.concat("(?:",e,")"),a,/(?:\\.|[^\\\/])*?/,r,/(?:\\.|[^\\\/])*?/,i,t)
},d=(e,a,i)=>n.concat(n.concat("(?:",e,")"),a,/(?:\\.|[^\\\/])*?/,i,t),g=[s,e.HASH_COMMENT_MODE,e.COMMENT(/^=\w/,/=cut/,{
endsWithParent:!0}),r,{className:"string",contains:o,variants:[{
begin:"q[qwxr]?\\s*\\(",end:"\\)",relevance:5},{begin:"q[qwxr]?\\s*\\[",
end:"\\]",relevance:5},{begin:"q[qwxr]?\\s*\\{",end:"\\}",relevance:5},{
begin:"q[qwxr]?\\s*\\|",end:"\\|",relevance:5},{begin:"q[qwxr]?\\s*<",end:">",
relevance:5},{begin:"qw\\s+q",end:"q",relevance:5},{begin:"'",end:"'",
contains:[e.BACKSLASH_ESCAPE]},{begin:'"',end:'"'},{begin:"`",end:"`",
contains:[e.BACKSLASH_ESCAPE]},{begin:/\{\w+\}/,relevance:0},{
begin:"-?\\w+\\s*=>",relevance:0}]},{className:"number",
begin:"(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b",
relevance:0},{
begin:"(\\/\\/|"+e.RE_STARTERS_RE+"|\\b(split|return|print|reverse|grep)\\b)\\s*",
keywords:"split return print reverse grep",relevance:0,
contains:[e.HASH_COMMENT_MODE,{className:"regexp",variants:[{
begin:c("s|tr|y",n.either(...l,{capture:!0}))},{begin:c("s|tr|y","\\(","\\)")},{
begin:c("s|tr|y","\\[","\\]")},{begin:c("s|tr|y","\\{","\\}")}],relevance:2},{
className:"regexp",variants:[{begin:/(m|qr)\/\//,relevance:0},{
begin:d("(?:m|qr)?",/\//,/\//)},{begin:d("m|qr",n.either(...l,{capture:!0
}),/\1/)},{begin:d("m|qr",/\(/,/\)/)},{begin:d("m|qr",/\[/,/\]/)},{
begin:d("m|qr",/\{/,/\}/)}]}]},{className:"function",beginKeywords:"sub",
end:"(\\s*\\(.*?\\))?[;{]",excludeEnd:!0,relevance:5,contains:[e.TITLE_MODE]},{
begin:"-\\w\\b",relevance:0},{begin:"^__DATA__$",end:"^__END__$",
subLanguage:"mojolicious",contains:[{begin:"^@@.*",end:"$",className:"comment"}]
}];return i.contains=g,r.contains=g,{name:"Perl",aliases:["pl","pm"],keywords:a,
contains:g}},grmr_php:e=>{
const n=e.regex,t=/(?![A-Za-z0-9])(?![$])/,a=n.concat(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,t),i=n.concat(/(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,t),r={
scope:"variable",match:"\\$+"+a},s={scope:"subst",variants:[{begin:/\$\w+/},{
begin:/\{\$/,end:/\}/}]},o=e.inherit(e.APOS_STRING_MODE,{illegal:null
}),l="[ \t\n]",c={scope:"string",variants:[e.inherit(e.QUOTE_STRING_MODE,{
illegal:null,contains:e.QUOTE_STRING_MODE.contains.concat(s)}),o,{
begin:/<<<[ \t]*(?:(\w+)|"(\w+)")\n/,end:/[ \t]*(\w+)\b/,
contains:e.QUOTE_STRING_MODE.contains.concat(s),"on:begin":(e,n)=>{
n.data._beginMatch=e[1]||e[2]},"on:end":(e,n)=>{
n.data._beginMatch!==e[1]&&n.ignoreMatch()}},e.END_SAME_AS_BEGIN({
begin:/<<<[ \t]*'(\w+)'\n/,end:/[ \t]*(\w+)\b/})]},d={scope:"number",variants:[{
begin:"\\b0[bB][01]+(?:_[01]+)*\\b"},{begin:"\\b0[oO][0-7]+(?:_[0-7]+)*\\b"},{
begin:"\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b"},{
begin:"(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?"
}],relevance:0
},g=["false","null","true"],u=["__CLASS__","__DIR__","__FILE__","__FUNCTION__","__COMPILER_HALT_OFFSET__","__LINE__","__METHOD__","__NAMESPACE__","__TRAIT__","die","echo","exit","include","include_once","print","require","require_once","array","abstract","and","as","binary","bool","boolean","break","callable","case","catch","class","clone","const","continue","declare","default","do","double","else","elseif","empty","enddeclare","endfor","endforeach","endif","endswitch","endwhile","enum","eval","extends","final","finally","float","for","foreach","from","global","goto","if","implements","instanceof","insteadof","int","integer","interface","isset","iterable","list","match|0","mixed","new","never","object","or","private","protected","public","readonly","real","return","string","switch","throw","trait","try","unset","use","var","void","while","xor","yield"],b=["Error|0","AppendIterator","ArgumentCountError","ArithmeticError","ArrayIterator","ArrayObject","AssertionError","BadFunctionCallException","BadMethodCallException","CachingIterator","CallbackFilterIterator","CompileError","Countable","DirectoryIterator","DivisionByZeroError","DomainException","EmptyIterator","ErrorException","Exception","FilesystemIterator","FilterIterator","GlobIterator","InfiniteIterator","InvalidArgumentException","IteratorIterator","LengthException","LimitIterator","LogicException","MultipleIterator","NoRewindIterator","OutOfBoundsException","OutOfRangeException","OuterIterator","OverflowException","ParentIterator","ParseError","RangeException","RecursiveArrayIterator","RecursiveCachingIterator","RecursiveCallbackFilterIterator","RecursiveDirectoryIterator","RecursiveFilterIterator","RecursiveIterator","RecursiveIteratorIterator","RecursiveRegexIterator","RecursiveTreeIterator","RegexIterator","RuntimeException","SeekableIterator","SplDoublyLinkedList","SplFileInfo","SplFileObject","SplFixedArray","SplHeap","SplMaxHeap","SplMinHeap","SplObjectStorage","SplObserver","SplPriorityQueue","SplQueue","SplStack","SplSubject","SplTempFileObject","TypeError","UnderflowException","UnexpectedValueException","UnhandledMatchError","ArrayAccess","BackedEnum","Closure","Fiber","Generator","Iterator","IteratorAggregate","Serializable","Stringable","Throwable","Traversable","UnitEnum","WeakReference","WeakMap","Directory","__PHP_Incomplete_Class","parent","php_user_filter","self","static","stdClass"],m={
keyword:u,literal:(e=>{const n=[];return e.forEach((e=>{
n.push(e),e.toLowerCase()===e?n.push(e.toUpperCase()):n.push(e.toLowerCase())
})),n})(g),built_in:b},p=e=>e.map((e=>e.replace(/\|\d+$/,""))),_={variants:[{
match:[/new/,n.concat(l,"+"),n.concat("(?!",p(b).join("\\b|"),"\\b)"),i],scope:{
1:"keyword",4:"title.class"}}]},h=n.concat(a,"\\b(?!\\()"),f={variants:[{
match:[n.concat(/::/,n.lookahead(/(?!class\b)/)),h],scope:{2:"variable.constant"
}},{match:[/::/,/class/],scope:{2:"variable.language"}},{
match:[i,n.concat(/::/,n.lookahead(/(?!class\b)/)),h],scope:{1:"title.class",
3:"variable.constant"}},{match:[i,n.concat("::",n.lookahead(/(?!class\b)/))],
scope:{1:"title.class"}},{match:[i,/::/,/class/],scope:{1:"title.class",
3:"variable.language"}}]},E={scope:"attr",
match:n.concat(a,n.lookahead(":"),n.lookahead(/(?!::)/))},y={relevance:0,
begin:/\(/,end:/\)/,keywords:m,contains:[E,r,f,e.C_BLOCK_COMMENT_MODE,c,d,_]
},N={relevance:0,
match:[/\b/,n.concat("(?!fn\\b|function\\b|",p(u).join("\\b|"),"|",p(b).join("\\b|"),"\\b)"),a,n.concat(l,"*"),n.lookahead(/(?=\()/)],
scope:{3:"title.function.invoke"},contains:[y]};y.contains.push(N)
;const w=[E,f,e.C_BLOCK_COMMENT_MODE,c,d,_];return{case_insensitive:!1,
keywords:m,contains:[{begin:n.concat(/#\[\s*/,i),beginScope:"meta",end:/]/,
endScope:"meta",keywords:{literal:g,keyword:["new","array"]},contains:[{
begin:/\[/,end:/]/,keywords:{literal:g,keyword:["new","array"]},
contains:["self",...w]},...w,{scope:"meta",match:i}]
},e.HASH_COMMENT_MODE,e.COMMENT("//","$"),e.COMMENT("/\\*","\\*/",{contains:[{
scope:"doctag",match:"@[A-Za-z]+"}]}),{match:/__halt_compiler\(\);/,
keywords:"__halt_compiler",starts:{scope:"comment",end:e.MATCH_NOTHING_RE,
contains:[{match:/\?>/,scope:"meta",endsParent:!0}]}},{scope:"meta",variants:[{
begin:/<\?php/,relevance:10},{begin:/<\?=/},{begin:/<\?/,relevance:.1},{
begin:/\?>/}]},{scope:"variable.language",match:/\$this\b/},r,N,f,{
match:[/const/,/\s/,a],scope:{1:"keyword",3:"variable.constant"}},_,{
scope:"function",relevance:0,beginKeywords:"fn function",end:/[;{]/,
excludeEnd:!0,illegal:"[$%\\[]",contains:[{beginKeywords:"use"
},e.UNDERSCORE_TITLE_MODE,{begin:"=>",endsParent:!0},{scope:"params",
begin:"\\(",end:"\\)",excludeBegin:!0,excludeEnd:!0,keywords:m,
contains:["self",r,f,e.C_BLOCK_COMMENT_MODE,c,d]}]},{scope:"class",variants:[{
beginKeywords:"enum",illegal:/[($"]/},{beginKeywords:"class interface trait",
illegal:/[:($"]/}],relevance:0,end:/\{/,excludeEnd:!0,contains:[{
beginKeywords:"extends implements"},e.UNDERSCORE_TITLE_MODE]},{
beginKeywords:"namespace",relevance:0,end:";",illegal:/[.']/,
contains:[e.inherit(e.UNDERSCORE_TITLE_MODE,{scope:"title.class"})]},{
beginKeywords:"use",relevance:0,end:";",contains:[{
match:/\b(as|const|function)\b/,scope:"keyword"},e.UNDERSCORE_TITLE_MODE]},c,d]}
},grmr_php_template:e=>({name:"PHP template",subLanguage:"xml",contains:[{
begin:/<\?(php|=)?/,end:/\?>/,subLanguage:"php",contains:[{begin:"/\\*",
end:"\\*/",skip:!0},{begin:'b"',end:'"',skip:!0},{begin:"b'",end:"'",skip:!0
},e.inherit(e.APOS_STRING_MODE,{illegal:null,className:null,contains:null,
skip:!0}),e.inherit(e.QUOTE_STRING_MODE,{illegal:null,className:null,
contains:null,skip:!0})]}]}),grmr_plaintext:e=>({name:"Plain text",
aliases:["text","txt"],disableAutodetect:!0}),grmr_python:e=>{
const n=e.regex,t=/[\p{XID_Start}_]\p{XID_Continue}*/u,a=["and","as","assert","async","await","break","case","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","match","nonlocal|10","not","or","pass","raise","return","try","while","with","yield"],i={
$pattern:/[A-Za-z]\w+|__\w+__/,keyword:a,
built_in:["__import__","abs","all","any","ascii","bin","bool","breakpoint","bytearray","bytes","callable","chr","classmethod","compile","complex","delattr","dict","dir","divmod","enumerate","eval","exec","filter","float","format","frozenset","getattr","globals","hasattr","hash","help","hex","id","input","int","isinstance","issubclass","iter","len","list","locals","map","max","memoryview","min","next","object","oct","open","ord","pow","print","property","range","repr","reversed","round","set","setattr","slice","sorted","staticmethod","str","sum","super","tuple","type","vars","zip"],
literal:["__debug__","Ellipsis","False","None","NotImplemented","True"],
type:["Any","Callable","Coroutine","Dict","List","Literal","Generic","Optional","Sequence","Set","Tuple","Type","Union"]
},r={className:"meta",begin:/^(>>>|\.\.\.) /},s={className:"subst",begin:/\{/,
end:/\}/,keywords:i,illegal:/#/},o={begin:/\{\{/,relevance:0},l={
className:"string",contains:[e.BACKSLASH_ESCAPE],variants:[{
begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,end:/'''/,
contains:[e.BACKSLASH_ESCAPE,r],relevance:10},{
begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,end:/"""/,
contains:[e.BACKSLASH_ESCAPE,r],relevance:10},{
begin:/([fF][rR]|[rR][fF]|[fF])'''/,end:/'''/,
contains:[e.BACKSLASH_ESCAPE,r,o,s]},{begin:/([fF][rR]|[rR][fF]|[fF])"""/,
end:/"""/,contains:[e.BACKSLASH_ESCAPE,r,o,s]},{begin:/([uU]|[rR])'/,end:/'/,
relevance:10},{begin:/([uU]|[rR])"/,end:/"/,relevance:10},{
begin:/([bB]|[bB][rR]|[rR][bB])'/,end:/'/},{begin:/([bB]|[bB][rR]|[rR][bB])"/,
end:/"/},{begin:/([fF][rR]|[rR][fF]|[fF])'/,end:/'/,
contains:[e.BACKSLASH_ESCAPE,o,s]},{begin:/([fF][rR]|[rR][fF]|[fF])"/,end:/"/,
contains:[e.BACKSLASH_ESCAPE,o,s]},e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]
},c="[0-9](_?[0-9])*",d=`(\\b(${c}))?\\.(${c})|\\b(${c})\\.`,g="\\b|"+a.join("|"),u={
className:"number",relevance:0,variants:[{
begin:`(\\b(${c})|(${d}))[eE][+-]?(${c})[jJ]?(?=${g})`},{begin:`(${d})[jJ]?`},{
begin:`\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${g})`},{
begin:`\\b0[bB](_?[01])+[lL]?(?=${g})`},{begin:`\\b0[oO](_?[0-7])+[lL]?(?=${g})`
},{begin:`\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${g})`},{begin:`\\b(${c})[jJ](?=${g})`
}]},b={className:"comment",begin:n.lookahead(/# type:/),end:/$/,keywords:i,
contains:[{begin:/# type:/},{begin:/#/,end:/\b\B/,endsWithParent:!0}]},m={
className:"params",variants:[{className:"",begin:/\(\s*\)/,skip:!0},{begin:/\(/,
end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:i,
contains:["self",r,u,l,e.HASH_COMMENT_MODE]}]};return s.contains=[l,u,r],{
name:"Python",aliases:["py","gyp","ipython"],unicodeRegex:!0,keywords:i,
illegal:/(<\/|\?)|=>/,contains:[r,u,{begin:/\bself\b/},{beginKeywords:"if",
relevance:0},l,b,e.HASH_COMMENT_MODE,{match:[/\bdef/,/\s+/,t],scope:{
1:"keyword",3:"title.function"},contains:[m]},{variants:[{
match:[/\bclass/,/\s+/,t,/\s*/,/\(\s*/,t,/\s*\)/]},{match:[/\bclass/,/\s+/,t]}],
scope:{1:"keyword",3:"title.class",6:"title.class.inherited"}},{
className:"meta",begin:/^[\t ]*@/,end:/(?=#)|$/,contains:[u,m,l]}]}},
grmr_python_repl:e=>({aliases:["pycon"],contains:[{className:"meta.prompt",
starts:{end:/ |$/,starts:{end:"$",subLanguage:"python"}},variants:[{
begin:/^>>>(?=[ ]|$)/},{begin:/^\.\.\.(?=[ ]|$)/}]}]}),grmr_r:e=>{
const n=e.regex,t=/(?:(?:[a-zA-Z]|\.[._a-zA-Z])[._a-zA-Z0-9]*)|\.(?!\d)/,a=n.either(/0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*[pP][+-]?\d+i?/,/0[xX][0-9a-fA-F]+(?:[pP][+-]?\d+)?[Li]?/,/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[Li]?/),i=/[=!<>:]=|\|\||&&|:::?|<-|<<-|->>|->|\|>|[-+*\/?!$&|:<=>@^~]|\*\*/,r=n.either(/[()]/,/[{}]/,/\[\[/,/[[\]]/,/\\/,/,/)
;return{name:"R",keywords:{$pattern:t,
keyword:"function if in break next repeat else for while",
literal:"NULL NA TRUE FALSE Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 NA_complex_|10",
built_in:"LETTERS letters month.abb month.name pi T F abs acos acosh all any anyNA Arg as.call as.character as.complex as.double as.environment as.integer as.logical as.null.default as.numeric as.raw asin asinh atan atanh attr attributes baseenv browser c call ceiling class Conj cos cosh cospi cummax cummin cumprod cumsum digamma dim dimnames emptyenv exp expression floor forceAndCall gamma gc.time globalenv Im interactive invisible is.array is.atomic is.call is.character is.complex is.double is.environment is.expression is.finite is.function is.infinite is.integer is.language is.list is.logical is.matrix is.na is.name is.nan is.null is.numeric is.object is.pairlist is.raw is.recursive is.single is.symbol lazyLoadDBfetch length lgamma list log max min missing Mod names nargs nzchar oldClass on.exit pos.to.env proc.time prod quote range Re rep retracemem return round seq_along seq_len seq.int sign signif sin sinh sinpi sqrt standardGeneric substitute sum switch tan tanh tanpi tracemem trigamma trunc unclass untracemem UseMethod xtfrm"
},contains:[e.COMMENT(/#'/,/$/,{contains:[{scope:"doctag",match:/@examples/,
starts:{end:n.lookahead(n.either(/\n^#'\s*(?=@[a-zA-Z]+)/,/\n^(?!#')/)),
endsParent:!0}},{scope:"doctag",begin:"@param",end:/$/,contains:[{
scope:"variable",variants:[{match:t},{match:/`(?:\\.|[^`\\])+`/}],endsParent:!0
}]},{scope:"doctag",match:/@[a-zA-Z]+/},{scope:"keyword",match:/\\[a-zA-Z]+/}]
}),e.HASH_COMMENT_MODE,{scope:"string",contains:[e.BACKSLASH_ESCAPE],
variants:[e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\(/,end:/\)(-*)"/
}),e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\{/,end:/\}(-*)"/
}),e.END_SAME_AS_BEGIN({begin:/[rR]"(-*)\[/,end:/\](-*)"/
}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\(/,end:/\)(-*)'/
}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\{/,end:/\}(-*)'/
}),e.END_SAME_AS_BEGIN({begin:/[rR]'(-*)\[/,end:/\](-*)'/}),{begin:'"',end:'"',
relevance:0},{begin:"'",end:"'",relevance:0}]},{relevance:0,variants:[{scope:{
1:"operator",2:"number"},match:[i,a]},{scope:{1:"operator",2:"number"},
match:[/%[^%]*%/,a]},{scope:{1:"punctuation",2:"number"},match:[r,a]},{scope:{
2:"number"},match:[/[^a-zA-Z0-9._]|^/,a]}]},{scope:{3:"operator"},
match:[t,/\s+/,/<-/,/\s+/]},{scope:"operator",relevance:0,variants:[{match:i},{
match:/%[^%]*%/}]},{scope:"punctuation",relevance:0,match:r},{begin:"`",end:"`",
contains:[{begin:/\\./}]}]}},grmr_ruby:e=>{
const n=e.regex,t="([a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?)",a=n.either(/\b([A-Z]+[a-z0-9]+)+/,/\b([A-Z]+[a-z0-9]+)+[A-Z]+/),i=n.concat(a,/(::\w+)*/),r={
"variable.constant":["__FILE__","__LINE__","__ENCODING__"],
"variable.language":["self","super"],
keyword:["alias","and","begin","BEGIN","break","case","class","defined","do","else","elsif","end","END","ensure","for","if","in","module","next","not","or","redo","require","rescue","retry","return","then","undef","unless","until","when","while","yield","include","extend","prepend","public","private","protected","raise","throw"],
built_in:["proc","lambda","attr_accessor","attr_reader","attr_writer","define_method","private_constant","module_function"],
literal:["true","false","nil"]},s={className:"doctag",begin:"@[A-Za-z]+"},o={
begin:"#<",end:">"},l=[e.COMMENT("#","$",{contains:[s]
}),e.COMMENT("^=begin","^=end",{contains:[s],relevance:10
}),e.COMMENT("^__END__",e.MATCH_NOTHING_RE)],c={className:"subst",begin:/#\{/,
end:/\}/,keywords:r},d={className:"string",contains:[e.BACKSLASH_ESCAPE,c],
variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/},{begin:/`/,end:/`/},{
begin:/%[qQwWx]?\(/,end:/\)/},{begin:/%[qQwWx]?\[/,end:/\]/},{
begin:/%[qQwWx]?\{/,end:/\}/},{begin:/%[qQwWx]?</,end:/>/},{begin:/%[qQwWx]?\//,
end:/\//},{begin:/%[qQwWx]?%/,end:/%/},{begin:/%[qQwWx]?-/,end:/-/},{
begin:/%[qQwWx]?\|/,end:/\|/},{begin:/\B\?(\\\d{1,3})/},{
begin:/\B\?(\\x[A-Fa-f0-9]{1,2})/},{begin:/\B\?(\\u\{?[A-Fa-f0-9]{1,6}\}?)/},{
begin:/\B\?(\\M-\\C-|\\M-\\c|\\c\\M-|\\M-|\\C-\\M-)[\x20-\x7e]/},{
begin:/\B\?\\(c|C-)[\x20-\x7e]/},{begin:/\B\?\\?\S/},{
begin:n.concat(/<<[-~]?'?/,n.lookahead(/(\w+)(?=\W)[^\n]*\n(?:[^\n]*\n)*?\s*\1\b/)),
contains:[e.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,
contains:[e.BACKSLASH_ESCAPE,c]})]}]},g="[0-9](_?[0-9])*",u={className:"number",
relevance:0,variants:[{
begin:`\\b([1-9](_?[0-9])*|0)(\\.(${g}))?([eE][+-]?(${g})|r)?i?\\b`},{
begin:"\\b0[dD][0-9](_?[0-9])*r?i?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*r?i?\\b"
},{begin:"\\b0[oO][0-7](_?[0-7])*r?i?\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*r?i?\\b"},{
begin:"\\b0(_?[0-7])+r?i?\\b"}]},b={variants:[{match:/\(\)/},{
className:"params",begin:/\(/,end:/(?=\))/,excludeBegin:!0,endsParent:!0,
keywords:r}]},m=[d,{variants:[{match:[/class\s+/,i,/\s+<\s+/,i]},{
match:[/\b(class|module)\s+/,i]}],scope:{2:"title.class",
4:"title.class.inherited"},keywords:r},{match:[/(include|extend)\s+/,i],scope:{
2:"title.class"},keywords:r},{relevance:0,match:[i,/\.new[. (]/],scope:{
1:"title.class"}},{relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,
className:"variable.constant"},{relevance:0,match:a,scope:"title.class"},{
match:[/def/,/\s+/,t],scope:{1:"keyword",3:"title.function"},contains:[b]},{
begin:e.IDENT_RE+"::"},{className:"symbol",
begin:e.UNDERSCORE_IDENT_RE+"(!|\\?)?:",relevance:0},{className:"symbol",
begin:":(?!\\s)",contains:[d,{begin:t}],relevance:0},u,{className:"variable",
begin:"(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])(?![A-Za-z])(?![@$?'])"},{
className:"params",begin:/\|/,end:/\|/,excludeBegin:!0,excludeEnd:!0,
relevance:0,keywords:r},{begin:"("+e.RE_STARTERS_RE+"|unless)\\s*",
keywords:"unless",contains:[{className:"regexp",contains:[e.BACKSLASH_ESCAPE,c],
illegal:/\n/,variants:[{begin:"/",end:"/[a-z]*"},{begin:/%r\{/,end:/\}[a-z]*/},{
begin:"%r\\(",end:"\\)[a-z]*"},{begin:"%r!",end:"![a-z]*"},{begin:"%r\\[",
end:"\\][a-z]*"}]}].concat(o,l),relevance:0}].concat(o,l)
;c.contains=m,b.contains=m;const p=[{begin:/^\s*=>/,starts:{end:"$",contains:m}
},{className:"meta.prompt",
begin:"^([>?]>|[\\w#]+\\(\\w+\\):\\d+:\\d+[>*]|(\\w+-)?\\d+\\.\\d+\\.\\d+(p\\d+)?[^\\d][^>]+>)(?=[ ])",
starts:{end:"$",keywords:r,contains:m}}];return l.unshift(o),{name:"Ruby",
aliases:["rb","gemspec","podspec","thor","irb"],keywords:r,illegal:/\/\*/,
contains:[e.SHEBANG({binary:"ruby"})].concat(p).concat(l).concat(m)}},
grmr_rust:e=>{const n=e.regex,t={className:"title.function.invoke",relevance:0,
begin:n.concat(/\b/,/(?!let|for|while|if|else|match\b)/,e.IDENT_RE,n.lookahead(/\s*\(/))
},a="([ui](8|16|32|64|128|size)|f(32|64))?",i=["drop ","Copy","Send","Sized","Sync","Drop","Fn","FnMut","FnOnce","ToOwned","Clone","Debug","PartialEq","PartialOrd","Eq","Ord","AsRef","AsMut","Into","From","Default","Iterator","Extend","IntoIterator","DoubleEndedIterator","ExactSizeIterator","SliceConcatExt","ToString","assert!","assert_eq!","bitflags!","bytes!","cfg!","col!","concat!","concat_idents!","debug_assert!","debug_assert_eq!","env!","eprintln!","panic!","file!","format!","format_args!","include_bytes!","include_str!","line!","local_data_key!","module_path!","option_env!","print!","println!","select!","stringify!","try!","unimplemented!","unreachable!","vec!","write!","writeln!","macro_rules!","assert_ne!","debug_assert_ne!"],r=["i8","i16","i32","i64","i128","isize","u8","u16","u32","u64","u128","usize","f32","f64","str","char","bool","Box","Option","Result","String","Vec"]
;return{name:"Rust",aliases:["rs"],keywords:{$pattern:e.IDENT_RE+"!?",type:r,
keyword:["abstract","as","async","await","become","box","break","const","continue","crate","do","dyn","else","enum","extern","false","final","fn","for","if","impl","in","let","loop","macro","match","mod","move","mut","override","priv","pub","ref","return","self","Self","static","struct","super","trait","true","try","type","typeof","unsafe","unsized","use","virtual","where","while","yield"],
literal:["true","false","Some","None","Ok","Err"],built_in:i},illegal:"</",
contains:[e.C_LINE_COMMENT_MODE,e.COMMENT("/\\*","\\*/",{contains:["self"]
}),e.inherit(e.QUOTE_STRING_MODE,{begin:/b?"/,illegal:null}),{
className:"string",variants:[{begin:/b?r(#*)"(.|\n)*?"\1(?!#)/},{
begin:/b?'\\?(x\w{2}|u\w{4}|U\w{8}|.)'/}]},{className:"symbol",
begin:/'[a-zA-Z_][a-zA-Z0-9_]*/},{className:"number",variants:[{
begin:"\\b0b([01_]+)"+a},{begin:"\\b0o([0-7_]+)"+a},{
begin:"\\b0x([A-Fa-f0-9_]+)"+a},{
begin:"\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)"+a}],relevance:0},{
begin:[/fn/,/\s+/,e.UNDERSCORE_IDENT_RE],className:{1:"keyword",
3:"title.function"}},{className:"meta",begin:"#!?\\[",end:"\\]",contains:[{
className:"string",begin:/"/,end:/"/}]},{
begin:[/let/,/\s+/,/(?:mut\s+)?/,e.UNDERSCORE_IDENT_RE],className:{1:"keyword",
3:"keyword",4:"variable"}},{
begin:[/for/,/\s+/,e.UNDERSCORE_IDENT_RE,/\s+/,/in/],className:{1:"keyword",
3:"variable",5:"keyword"}},{begin:[/type/,/\s+/,e.UNDERSCORE_IDENT_RE],
className:{1:"keyword",3:"title.class"}},{
begin:[/(?:trait|enum|struct|union|impl|for)/,/\s+/,e.UNDERSCORE_IDENT_RE],
className:{1:"keyword",3:"title.class"}},{begin:e.IDENT_RE+"::",keywords:{
keyword:"Self",built_in:i,type:r}},{className:"punctuation",begin:"->"},t]}},
grmr_scss:e=>{const n=ie(e),t=le,a=oe,i="@[a-z-]+",r={className:"variable",
begin:"(\\$[a-zA-Z-][a-zA-Z0-9_-]*)\\b",relevance:0};return{name:"SCSS",
case_insensitive:!0,illegal:"[=/|']",
contains:[e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE,n.CSS_NUMBER_MODE,{
className:"selector-id",begin:"#[A-Za-z0-9_-]+",relevance:0},{
className:"selector-class",begin:"\\.[A-Za-z0-9_-]+",relevance:0
},n.ATTRIBUTE_SELECTOR_MODE,{className:"selector-tag",
begin:"\\b("+re.join("|")+")\\b",relevance:0},{className:"selector-pseudo",
begin:":("+a.join("|")+")"},{className:"selector-pseudo",
begin:":(:)?("+t.join("|")+")"},r,{begin:/\(/,end:/\)/,
contains:[n.CSS_NUMBER_MODE]},n.CSS_VARIABLE,{className:"attribute",
begin:"\\b("+ce.join("|")+")\\b"},{
begin:"\\b(whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic|uppercase|upper-roman|upper-alpha|underline|transparent|top|thin|thick|text|text-top|text-bottom|tb-rl|table-header-group|table-footer-group|sw-resize|super|strict|static|square|solid|small-caps|separate|se-resize|scroll|s-resize|rtl|row-resize|ridge|right|repeat|repeat-y|repeat-x|relative|progress|pointer|overline|outside|outset|oblique|nowrap|not-allowed|normal|none|nw-resize|no-repeat|no-drop|newspaper|ne-resize|n-resize|move|middle|medium|ltr|lr-tb|lowercase|lower-roman|lower-alpha|loose|list-item|line|line-through|line-edge|lighter|left|keep-all|justify|italic|inter-word|inter-ideograph|inside|inset|inline|inline-block|inherit|inactive|ideograph-space|ideograph-parenthesis|ideograph-numeric|ideograph-alpha|horizontal|hidden|help|hand|groove|fixed|ellipsis|e-resize|double|dotted|distribute|distribute-space|distribute-letter|distribute-all-lines|disc|disabled|default|decimal|dashed|crosshair|collapse|col-resize|circle|char|center|capitalize|break-word|break-all|bottom|both|bolder|bold|block|bidi-override|below|baseline|auto|always|all-scroll|absolute|table|table-cell)\\b"
},{begin:/:/,end:/[;}{]/,relevance:0,
contains:[n.BLOCK_COMMENT,r,n.HEXCOLOR,n.CSS_NUMBER_MODE,e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,n.IMPORTANT,n.FUNCTION_DISPATCH]
},{begin:"@(page|font-face)",keywords:{$pattern:i,keyword:"@page @font-face"}},{
begin:"@",end:"[{;]",returnBegin:!0,keywords:{$pattern:/[a-z-]+/,
keyword:"and or not only",attribute:se.join(" ")},contains:[{begin:i,
className:"keyword"},{begin:/[a-z-]+(?=:)/,className:"attribute"
},r,e.QUOTE_STRING_MODE,e.APOS_STRING_MODE,n.HEXCOLOR,n.CSS_NUMBER_MODE]
},n.FUNCTION_DISPATCH]}},grmr_shell:e=>({name:"Shell Session",
aliases:["console","shellsession"],contains:[{className:"meta.prompt",
begin:/^\s{0,3}[/~\w\d[\]()@-]*[>%$#][ ]?/,starts:{end:/[^\\](?=\s*$)/,
subLanguage:"bash"}}]}),grmr_sql:e=>{
const n=e.regex,t=e.COMMENT("--","$"),a=["true","false","unknown"],i=["bigint","binary","blob","boolean","char","character","clob","date","dec","decfloat","decimal","float","int","integer","interval","nchar","nclob","national","numeric","real","row","smallint","time","timestamp","varchar","varying","varbinary"],r=["abs","acos","array_agg","asin","atan","avg","cast","ceil","ceiling","coalesce","corr","cos","cosh","count","covar_pop","covar_samp","cume_dist","dense_rank","deref","element","exp","extract","first_value","floor","json_array","json_arrayagg","json_exists","json_object","json_objectagg","json_query","json_table","json_table_primitive","json_value","lag","last_value","lead","listagg","ln","log","log10","lower","max","min","mod","nth_value","ntile","nullif","percent_rank","percentile_cont","percentile_disc","position","position_regex","power","rank","regr_avgx","regr_avgy","regr_count","regr_intercept","regr_r2","regr_slope","regr_sxx","regr_sxy","regr_syy","row_number","sin","sinh","sqrt","stddev_pop","stddev_samp","substring","substring_regex","sum","tan","tanh","translate","translate_regex","treat","trim","trim_array","unnest","upper","value_of","var_pop","var_samp","width_bucket"],s=["create table","insert into","primary key","foreign key","not null","alter table","add constraint","grouping sets","on overflow","character set","respect nulls","ignore nulls","nulls first","nulls last","depth first","breadth first"],o=r,l=["abs","acos","all","allocate","alter","and","any","are","array","array_agg","array_max_cardinality","as","asensitive","asin","asymmetric","at","atan","atomic","authorization","avg","begin","begin_frame","begin_partition","between","bigint","binary","blob","boolean","both","by","call","called","cardinality","cascaded","case","cast","ceil","ceiling","char","char_length","character","character_length","check","classifier","clob","close","coalesce","collate","collect","column","commit","condition","connect","constraint","contains","convert","copy","corr","corresponding","cos","cosh","count","covar_pop","covar_samp","create","cross","cube","cume_dist","current","current_catalog","current_date","current_default_transform_group","current_path","current_role","current_row","current_schema","current_time","current_timestamp","current_path","current_role","current_transform_group_for_type","current_user","cursor","cycle","date","day","deallocate","dec","decimal","decfloat","declare","default","define","delete","dense_rank","deref","describe","deterministic","disconnect","distinct","double","drop","dynamic","each","element","else","empty","end","end_frame","end_partition","end-exec","equals","escape","every","except","exec","execute","exists","exp","external","extract","false","fetch","filter","first_value","float","floor","for","foreign","frame_row","free","from","full","function","fusion","get","global","grant","group","grouping","groups","having","hold","hour","identity","in","indicator","initial","inner","inout","insensitive","insert","int","integer","intersect","intersection","interval","into","is","join","json_array","json_arrayagg","json_exists","json_object","json_objectagg","json_query","json_table","json_table_primitive","json_value","lag","language","large","last_value","lateral","lead","leading","left","like","like_regex","listagg","ln","local","localtime","localtimestamp","log","log10","lower","match","match_number","match_recognize","matches","max","member","merge","method","min","minute","mod","modifies","module","month","multiset","national","natural","nchar","nclob","new","no","none","normalize","not","nth_value","ntile","null","nullif","numeric","octet_length","occurrences_regex","of","offset","old","omit","on","one","only","open","or","order","out","outer","over","overlaps","overlay","parameter","partition","pattern","per","percent","percent_rank","percentile_cont","percentile_disc","period","portion","position","position_regex","power","precedes","precision","prepare","primary","procedure","ptf","range","rank","reads","real","recursive","ref","references","referencing","regr_avgx","regr_avgy","regr_count","regr_intercept","regr_r2","regr_slope","regr_sxx","regr_sxy","regr_syy","release","result","return","returns","revoke","right","rollback","rollup","row","row_number","rows","running","savepoint","scope","scroll","search","second","seek","select","sensitive","session_user","set","show","similar","sin","sinh","skip","smallint","some","specific","specifictype","sql","sqlexception","sqlstate","sqlwarning","sqrt","start","static","stddev_pop","stddev_samp","submultiset","subset","substring","substring_regex","succeeds","sum","symmetric","system","system_time","system_user","table","tablesample","tan","tanh","then","time","timestamp","timezone_hour","timezone_minute","to","trailing","translate","translate_regex","translation","treat","trigger","trim","trim_array","true","truncate","uescape","union","unique","unknown","unnest","update","upper","user","using","value","values","value_of","var_pop","var_samp","varbinary","varchar","varying","versioning","when","whenever","where","width_bucket","window","with","within","without","year","add","asc","collation","desc","final","first","last","view"].filter((e=>!r.includes(e))),c={
begin:n.concat(/\b/,n.either(...o),/\s*\(/),relevance:0,keywords:{built_in:o}}
;return{name:"SQL",case_insensitive:!0,illegal:/[{}]|<\//,keywords:{
$pattern:/\b[\w\.]+/,keyword:((e,{exceptions:n,when:t}={})=>{const a=t
;return n=n||[],e.map((e=>e.match(/\|\d+$/)||n.includes(e)?e:a(e)?e+"|0":e))
})(l,{when:e=>e.length<3}),literal:a,type:i,
built_in:["current_catalog","current_date","current_default_transform_group","current_path","current_role","current_schema","current_transform_group_for_type","current_user","session_user","system_time","system_user","current_time","localtime","current_timestamp","localtimestamp"]
},contains:[{begin:n.either(...s),relevance:0,keywords:{$pattern:/[\w\.]+/,
keyword:l.concat(s),literal:a,type:i}},{className:"type",
begin:n.either("double precision","large object","with timezone","without timezone")
},c,{className:"variable",begin:/@[a-z0-9][a-z0-9_]*/},{className:"string",
variants:[{begin:/'/,end:/'/,contains:[{begin:/''/}]}]},{begin:/"/,end:/"/,
contains:[{begin:/""/}]},e.C_NUMBER_MODE,e.C_BLOCK_COMMENT_MODE,t,{
className:"operator",begin:/[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
relevance:0}]}},grmr_swift:e=>{const n={match:/\s+/,relevance:0
},t=e.COMMENT("/\\*","\\*/",{contains:["self"]}),a=[e.C_LINE_COMMENT_MODE,t],i={
match:[/\./,m(...xe,...Me)],className:{2:"keyword"}},r={match:b(/\./,m(...Ae)),
relevance:0},s=Ae.filter((e=>"string"==typeof e)).concat(["_|0"]),o={variants:[{
className:"keyword",
match:m(...Ae.filter((e=>"string"!=typeof e)).concat(Se).map(ke),...Me)}]},l={
$pattern:m(/\b\w+/,/#\w+/),keyword:s.concat(Re),literal:Ce},c=[i,r,o],g=[{
match:b(/\./,m(...De)),relevance:0},{className:"built_in",
match:b(/\b/,m(...De),/(?=\()/)}],u={match:/->/,relevance:0},p=[u,{
className:"operator",relevance:0,variants:[{match:Be},{match:`\\.(\\.|${Le})+`}]
}],_="([0-9]_*)+",h="([0-9a-fA-F]_*)+",f={className:"number",relevance:0,
variants:[{match:`\\b(${_})(\\.(${_}))?([eE][+-]?(${_}))?\\b`},{
match:`\\b0x(${h})(\\.(${h}))?([pP][+-]?(${_}))?\\b`},{match:/\b0o([0-7]_*)+\b/
},{match:/\b0b([01]_*)+\b/}]},E=(e="")=>({className:"subst",variants:[{
match:b(/\\/,e,/[0\\tnr"']/)},{match:b(/\\/,e,/u\{[0-9a-fA-F]{1,8}\}/)}]
}),y=(e="")=>({className:"subst",match:b(/\\/,e,/[\t ]*(?:[\r\n]|\r\n)/)
}),N=(e="")=>({className:"subst",label:"interpol",begin:b(/\\/,e,/\(/),end:/\)/
}),w=(e="")=>({begin:b(e,/"""/),end:b(/"""/,e),contains:[E(e),y(e),N(e)]
}),v=(e="")=>({begin:b(e,/"/),end:b(/"/,e),contains:[E(e),N(e)]}),O={
className:"string",
variants:[w(),w("#"),w("##"),w("###"),v(),v("#"),v("##"),v("###")]
},k=[e.BACKSLASH_ESCAPE,{begin:/\[/,end:/\]/,relevance:0,
contains:[e.BACKSLASH_ESCAPE]}],x={begin:/\/[^\s](?=[^/\n]*\/)/,end:/\//,
contains:k},M=e=>{const n=b(e,/\//),t=b(/\//,e);return{begin:n,end:t,
contains:[...k,{scope:"comment",begin:`#(?!.*${t})`,end:/$/}]}},S={
scope:"regexp",variants:[M("###"),M("##"),M("#"),x]},A={match:b(/`/,Fe,/`/)
},C=[A,{className:"variable",match:/\$\d+/},{className:"variable",
match:`\\$${ze}+`}],T=[{match:/(@|#(un)?)available/,scope:"keyword",starts:{
contains:[{begin:/\(/,end:/\)/,keywords:Pe,contains:[...p,f,O]}]}},{
scope:"keyword",match:b(/@/,m(...je))},{scope:"meta",match:b(/@/,Fe)}],R={
match:d(/\b[A-Z]/),relevance:0,contains:[{className:"type",
match:b(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/,ze,"+")
},{className:"type",match:Ue,relevance:0},{match:/[?!]+/,relevance:0},{
match:/\.\.\./,relevance:0},{match:b(/\s+&\s+/,d(Ue)),relevance:0}]},D={
begin:/</,end:/>/,keywords:l,contains:[...a,...c,...T,u,R]};R.contains.push(D)
;const I={begin:/\(/,end:/\)/,relevance:0,keywords:l,contains:["self",{
match:b(Fe,/\s*:/),keywords:"_|0",relevance:0
},...a,S,...c,...g,...p,f,O,...C,...T,R]},L={begin:/</,end:/>/,
keywords:"repeat each",contains:[...a,R]},B={begin:/\(/,end:/\)/,keywords:l,
contains:[{begin:m(d(b(Fe,/\s*:/)),d(b(Fe,/\s+/,Fe,/\s*:/))),end:/:/,
relevance:0,contains:[{className:"keyword",match:/\b_\b/},{className:"params",
match:Fe}]},...a,...c,...p,f,O,...T,R,I],endsParent:!0,illegal:/["']/},$={
match:[/(func|macro)/,/\s+/,m(A.match,Fe,Be)],className:{1:"keyword",
3:"title.function"},contains:[L,B,n],illegal:[/\[/,/%/]},z={
match:[/\b(?:subscript|init[?!]?)/,/\s*(?=[<(])/],className:{1:"keyword"},
contains:[L,B,n],illegal:/\[|%/},F={match:[/operator/,/\s+/,Be],className:{
1:"keyword",3:"title"}},U={begin:[/precedencegroup/,/\s+/,Ue],className:{
1:"keyword",3:"title"},contains:[R],keywords:[...Te,...Ce],end:/}/}
;for(const e of O.variants){const n=e.contains.find((e=>"interpol"===e.label))
;n.keywords=l;const t=[...c,...g,...p,f,O,...C];n.contains=[...t,{begin:/\(/,
end:/\)/,contains:["self",...t]}]}return{name:"Swift",keywords:l,
contains:[...a,$,z,{beginKeywords:"struct protocol class extension enum actor",
end:"\\{",excludeEnd:!0,keywords:l,contains:[e.inherit(e.TITLE_MODE,{
className:"title.class",begin:/[A-Za-z$_][\u00C0-\u02B80-9A-Za-z$_]*/}),...c]
},F,U,{beginKeywords:"import",end:/$/,contains:[...a],relevance:0
},S,...c,...g,...p,f,O,...C,...T,R,I]}},grmr_typescript:e=>{
const n=Oe(e),t=_e,a=["any","void","number","boolean","string","object","never","symbol","bigint","unknown"],i={
beginKeywords:"namespace",end:/\{/,excludeEnd:!0,
contains:[n.exports.CLASS_REFERENCE]},r={beginKeywords:"interface",end:/\{/,
excludeEnd:!0,keywords:{keyword:"interface extends",built_in:a},
contains:[n.exports.CLASS_REFERENCE]},s={$pattern:_e,
keyword:he.concat(["type","namespace","interface","public","private","protected","implements","declare","abstract","readonly","enum","override"]),
literal:fe,built_in:ve.concat(a),"variable.language":we},o={className:"meta",
begin:"@"+t},l=(e,n,t)=>{const a=e.contains.findIndex((e=>e.label===n))
;if(-1===a)throw Error("can not find mode to replace");e.contains.splice(a,1,t)}
;return Object.assign(n.keywords,s),
n.exports.PARAMS_CONTAINS.push(o),n.contains=n.contains.concat([o,i,r]),
l(n,"shebang",e.SHEBANG()),l(n,"use_strict",{className:"meta",relevance:10,
begin:/^\s*['"]use strict['"]/
}),n.contains.find((e=>"func.def"===e.label)).relevance=0,Object.assign(n,{
name:"TypeScript",aliases:["ts","tsx","mts","cts"]}),n},grmr_vbnet:e=>{
const n=e.regex,t=/\d{1,2}\/\d{1,2}\/\d{4}/,a=/\d{4}-\d{1,2}-\d{1,2}/,i=/(\d|1[012])(:\d+){0,2} *(AM|PM)/,r=/\d{1,2}(:\d{1,2}){1,2}/,s={
className:"literal",variants:[{begin:n.concat(/# */,n.either(a,t),/ *#/)},{
begin:n.concat(/# */,r,/ *#/)},{begin:n.concat(/# */,i,/ *#/)},{
begin:n.concat(/# */,n.either(a,t),/ +/,n.either(i,r),/ *#/)}]
},o=e.COMMENT(/'''/,/$/,{contains:[{className:"doctag",begin:/<\/?/,end:/>/}]
}),l=e.COMMENT(null,/$/,{variants:[{begin:/'/},{begin:/([\t ]|^)REM(?=\s)/}]})
;return{name:"Visual Basic .NET",aliases:["vb"],case_insensitive:!0,
classNameAliases:{label:"symbol"},keywords:{
keyword:"addhandler alias aggregate ansi as async assembly auto binary by byref byval call case catch class compare const continue custom declare default delegate dim distinct do each equals else elseif end enum erase error event exit explicit finally for friend from function get global goto group handles if implements imports in inherits interface into iterator join key let lib loop me mid module mustinherit mustoverride mybase myclass namespace narrowing new next notinheritable notoverridable of off on operator option optional order overloads overridable overrides paramarray partial preserve private property protected public raiseevent readonly redim removehandler resume return select set shadows shared skip static step stop structure strict sub synclock take text then throw to try unicode until using when where while widening with withevents writeonly yield",
built_in:"addressof and andalso await directcast gettype getxmlnamespace is isfalse isnot istrue like mod nameof new not or orelse trycast typeof xor cbool cbyte cchar cdate cdbl cdec cint clng cobj csbyte cshort csng cstr cuint culng cushort",
type:"boolean byte char date decimal double integer long object sbyte short single string uinteger ulong ushort",
literal:"true false nothing"},
illegal:"//|\\{|\\}|endif|gosub|variant|wend|^\\$ ",contains:[{
className:"string",begin:/"(""|[^/n])"C\b/},{className:"string",begin:/"/,
end:/"/,illegal:/\n/,contains:[{begin:/""/}]},s,{className:"number",relevance:0,
variants:[{begin:/\b\d[\d_]*((\.[\d_]+(E[+-]?[\d_]+)?)|(E[+-]?[\d_]+))[RFD@!#]?/
},{begin:/\b\d[\d_]*((U?[SIL])|[%&])?/},{begin:/&H[\dA-F_]+((U?[SIL])|[%&])?/},{
begin:/&O[0-7_]+((U?[SIL])|[%&])?/},{begin:/&B[01_]+((U?[SIL])|[%&])?/}]},{
className:"label",begin:/^\w+:/},o,l,{className:"meta",
begin:/[\t ]*#(const|disable|else|elseif|enable|end|externalsource|if|region)\b/,
end:/$/,keywords:{
keyword:"const disable else elseif enable end externalsource if region then"},
contains:[l]}]}},grmr_wasm:e=>{e.regex;const n=e.COMMENT(/\(;/,/;\)/)
;return n.contains.push("self"),{name:"WebAssembly",keywords:{$pattern:/[\w.]+/,
keyword:["anyfunc","block","br","br_if","br_table","call","call_indirect","data","drop","elem","else","end","export","func","global.get","global.set","local.get","local.set","local.tee","get_global","get_local","global","if","import","local","loop","memory","memory.grow","memory.size","module","mut","nop","offset","param","result","return","select","set_global","set_local","start","table","tee_local","then","type","unreachable"]
},contains:[e.COMMENT(/;;/,/$/),n,{match:[/(?:offset|align)/,/\s*/,/=/],
className:{1:"keyword",3:"operator"}},{className:"variable",begin:/\$[\w_]+/},{
match:/(\((?!;)|\))+/,className:"punctuation",relevance:0},{
begin:[/(?:func|call|call_indirect)/,/\s+/,/\$[^\s)]+/],className:{1:"keyword",
3:"title.function"}},e.QUOTE_STRING_MODE,{match:/(i32|i64|f32|f64)(?!\.)/,
className:"type"},{className:"keyword",
match:/\b(f32|f64|i32|i64)(?:\.(?:abs|add|and|ceil|clz|const|convert_[su]\/i(?:32|64)|copysign|ctz|demote\/f64|div(?:_[su])?|eqz?|extend_[su]\/i32|floor|ge(?:_[su])?|gt(?:_[su])?|le(?:_[su])?|load(?:(?:8|16|32)_[su])?|lt(?:_[su])?|max|min|mul|nearest|neg?|or|popcnt|promote\/f32|reinterpret\/[fi](?:32|64)|rem_[su]|rot[lr]|shl|shr_[su]|store(?:8|16|32)?|sqrt|sub|trunc(?:_[su]\/f(?:32|64))?|wrap\/i64|xor))\b/
},{className:"number",relevance:0,
match:/[+-]?\b(?:\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?|0x[\da-fA-F](?:_?[\da-fA-F])*(?:\.[\da-fA-F](?:_?[\da-fA-D])*)?(?:[pP][+-]?\d(?:_?\d)*)?)\b|\binf\b|\bnan(?::0x[\da-fA-F](?:_?[\da-fA-D])*)?\b/
}]}},grmr_xml:e=>{
const n=e.regex,t=n.concat(/[\p{L}_]/u,n.optional(/[\p{L}0-9_.-]*:/u),/[\p{L}0-9_.-]*/u),a={
className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},i={begin:/\s/,
contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]
},r=e.inherit(i,{begin:/\(/,end:/\)/}),s=e.inherit(e.APOS_STRING_MODE,{
className:"string"}),o=e.inherit(e.QUOTE_STRING_MODE,{className:"string"}),l={
endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",
begin:/[\p{L}0-9._:-]+/u,relevance:0},{begin:/=\s*/,relevance:0,contains:[{
className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[a]},{
begin:/'/,end:/'/,contains:[a]},{begin:/[^\s"'=<>`]+/}]}]}]};return{
name:"HTML, XML",
aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],
case_insensitive:!0,unicodeRegex:!0,contains:[{className:"meta",begin:/<![a-z]/,
end:/>/,relevance:10,contains:[i,o,s,r,{begin:/\[/,end:/\]/,contains:[{
className:"meta",begin:/<![a-z]/,end:/>/,contains:[i,r,o,s]}]}]
},e.COMMENT(/<!--/,/-->/,{relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,
relevance:10},a,{className:"meta",end:/\?>/,variants:[{begin:/<\?xml/,
relevance:10,contains:[o]},{begin:/<\?[a-z][a-z0-9]+/}]},{className:"tag",
begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[l],starts:{
end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",
begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[l],starts:{
end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{
className:"tag",begin:/<>|<\/>/},{className:"tag",
begin:n.concat(/</,n.lookahead(n.concat(t,n.either(/\/>/,/>/,/\s/)))),
end:/\/?>/,contains:[{className:"name",begin:t,relevance:0,starts:l}]},{
className:"tag",begin:n.concat(/<\//,n.lookahead(n.concat(t,/>/))),contains:[{
className:"name",begin:t,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}
},grmr_yaml:e=>{
const n="true false yes no null",t="[\\w#;/?:@&=+$,.~*'()[\\]]+",a={
className:"string",relevance:0,variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/
},{begin:/\S+/}],contains:[e.BACKSLASH_ESCAPE,{className:"template-variable",
variants:[{begin:/\{\{/,end:/\}\}/},{begin:/%\{/,end:/\}/}]}]},i=e.inherit(a,{
variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/},{begin:/[^\s,{}[\]]+/}]}),r={
end:",",endsWithParent:!0,excludeEnd:!0,keywords:n,relevance:0},s={begin:/\{/,
end:/\}/,contains:[r],illegal:"\\n",relevance:0},o={begin:"\\[",end:"\\]",
contains:[r],illegal:"\\n",relevance:0},l=[{className:"attr",variants:[{
begin:"\\w[\\w :\\/.-]*:(?=[ \t]|$)"},{begin:'"\\w[\\w :\\/.-]*":(?=[ \t]|$)'},{
begin:"'\\w[\\w :\\/.-]*':(?=[ \t]|$)"}]},{className:"meta",begin:"^---\\s*$",
relevance:10},{className:"string",
begin:"[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"},{
begin:"<%[%=-]?",end:"[%-]?%>",subLanguage:"ruby",excludeBegin:!0,excludeEnd:!0,
relevance:0},{className:"type",begin:"!\\w+!"+t},{className:"type",
begin:"!<"+t+">"},{className:"type",begin:"!"+t},{className:"type",begin:"!!"+t
},{className:"meta",begin:"&"+e.UNDERSCORE_IDENT_RE+"$"},{className:"meta",
begin:"\\*"+e.UNDERSCORE_IDENT_RE+"$"},{className:"bullet",begin:"-(?=[ ]|$)",
relevance:0},e.HASH_COMMENT_MODE,{beginKeywords:n,keywords:{literal:n}},{
className:"number",
begin:"\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"
},{className:"number",begin:e.C_NUMBER_RE+"\\b",relevance:0},s,o,a],c=[...l]
;return c.pop(),c.push(i),r.contains=c,{name:"YAML",case_insensitive:!0,
aliases:["yml"],contains:l}}});const He=ae;for(const e of Object.keys(Ke)){
const n=e.replace("grmr_","").replace("_","-");He.registerLanguage(n,Ke[e])}
return He}()
;"object"==typeof exports&&"undefined"!=typeof module&&(module.exports=hljs);
;/* ===== << vendor/highlight.min.js ===== */

;/* ===== >> js/panorama.js ===== */
/*
 * 题库全景图（panorama）
 * 视图：
 *   - all : 技术演进思维导图（中心 → 4 个演进层 → 21 个技术体系）
 *   - cat : 同上，并展开到每个技术体系下的细分技术点
 *   - pos : 岗位思维导图（中心 → 8 个时代阶段 → 具体岗位）
 *   - ai  : AI 生成题思维导图（中心 → 技术体系 → 具体题目）
 * 设计目标：逻辑直观（树形从属关系，一眼看出谁属于谁）、按技术/岗位演进组织（由内到外）、
 *           数量再多也不乱（默认只展开主干，逐级下钻；径向 / 左右两种布局可切换）
 * 依赖：utils.js(U) / services.js(Services) / app.js(App)，echarts 按需加载
 */
(function () {
  /* App 不能在此快照：本脚本先于 app.js 加载，window.App 尚未定义（否则点击跳转全部失效），必须运行时经 window.App 取用 */
  const S = window.Services, U = window.U;

  /* 注册饼图图标（若尚未存在） */
  if (U && U.ICONS && !U.ICONS.pieChart) {
    U.ICONS.pieChart = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12 2.1 5.3a10 10 0 0 0 0 13.4L12 12z"/><path d="M12 12l8 5.7A10 10 0 0 0 22 12a10 10 0 0 0-2-5.7L12 12z"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/></svg>';
  }

  /* 四个技术演进层（由内到外） */
  const LAYERS = [
    { name: "基石技术", color: "#3b82f6", desc: "一切的地基：组成原理、编程语言、操作系统、计算机网络" },
    { name: "系统与应用开发", color: "#10b981", desc: "把能力落成系统：数据库、前后端、移动端" },
    { name: "架构与工程", color: "#f59e0b", desc: "让系统可扩展可交付：分布式、云原生、工程化与测试" },
    { name: "数据与智能 · 领域前沿", color: "#8b5cf6", desc: "当下与未来：AI、大数据、安全、IoT、图形、区块链等" }
  ];
  /* 一级分类名 → 层号（数据稳定，按名映射更稳妥） */
  const LAYER_BY_NAME = {
    "计算机科学基础": 0, "编程语言与编程基础": 0, "操作系统与系统运维": 0, "计算机网络与协议": 0,
    "数据库与数据存储": 1, "后端开发与服务端框架": 1, "Web前端开发": 1, "移动端与跨平台开发": 1,
    "分布式系统与微服务": 2, "云原生与DevOps": 2, "软件工程与设计模式": 2, "软件测试": 2,
    "人工智能与机器学习": 3, "大数据与数据工程": 3, "信息安全与网络安全": 3, "嵌入式与物联网": 3,
    "游戏开发与图形图像": 3, "音视频与流媒体": 3, "区块链与Web3": 3, "产品与项目管理": 3, "通用面试能力与软技能": 3
  };
  /* 8 个时代阶段的配色（由内到外） */
  const STAGE_COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#e11d48", "#a855f7", "#6366f1", "#14b8a6", "#64748b"];

  function layerOf(name) { return LAYER_BY_NAME[name] != null ? LAYER_BY_NAME[name] : 3; }
  function pct(n, t) { return t ? Math.round((n / t) * 100) + "%" : "0%"; }
  function esc(s) { return U && U.esc ? U.esc(s) : String(s == null ? "" : s); }
  function cssVar(n) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(n);
      return (v && v.trim()) || getComputedStyle(document.body).getPropertyValue(n).trim();
    } catch (e) { return ""; }
  }
  function hexA(hex, a) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    if (!m) return hex;
    return "rgba(" + parseInt(m[1], 16) + "," + parseInt(m[2], 16) + "," + parseInt(m[3], 16) + "," + a + ")";
  }
  function sizeFor(count, k) {
    k = k || 3.2;
    return Math.max(16, Math.min(70, 12 + Math.sqrt(count || 0) * k));
  }

  /* ============================ 对外接口 ============================ */
  const VIEWS = [
    { id: "all", label: "题库全景", icon: "pieChart", desc: "按技术演进由内到外展开的思维导图（可下钻到具体技术）" },
    { id: "cat", label: "技术分类", icon: "layers", desc: "21 个技术体系 → 子类（如关系型数据库）→ 具体技术（如 MySQL），每节点标题数" },
    { id: "pos", label: "覆盖岗位", icon: "briefcase", desc: "岗位按时代阶段 → 父岗位 → 子岗位三级组织，每节点标题数" },
    { id: "ai", label: "AI 生成题", icon: "sparkles", desc: "仅 AI 生成题，按技术体系组织的思维导图（点体系看题单、点题看详情）" }
  ];

  function tabsHtml(active) {
    return '<div class="panorama-tabs">' + VIEWS.map(v =>
      '<a class="panorama-tab' + (v.id === active ? " active" : "") + '" href="#/panorama?view=' + v.id + '">' +
      (U.icon ? U.icon(v.icon) : "") + "<span>" + esc(v.label) + "</span></a>"
    ).join("") + "</div>";
  }

  function breadcrumb(view) {
    const v = VIEWS.filter(x => x.id === view)[0] || VIEWS[0];
    return '<div class="breadcrumb"><a href="#/">' + U.icon("home") + " 首页</a><span>/</span><span>题库全景</span><span>/</span><b>" + esc(v.label) + "</b></div>";
  }

  P_html();

  function P_html() {
    window.Panorama = {
      html: function (view) {
        view = VIEWS.some(v => v.id === view) ? view : "all";
        return breadcrumb(view) +
          '<h1 class="page-title">题库全景</h1>' +
          '<p class="muted" style="margin:-6px 0 14px">一张思维导图看全 ' + (S.questions ? S.questions.length : "") + ' 道题都分布在哪些技术、哪些岗位：由内到外是技术演进，逐级展开是从属关系；悬停节点点「查看题目」直达。</p>' +
          tabsHtml(view) +
          '<div class="panorama-body" id="panorama-body"></div>';
      },
      afterRender: function (view) {
        const box = document.getElementById("panorama-body");
        if (!box) return;
        view = VIEWS.some(v => v.id === view) ? view : "all";
        if (view === "all") renderAll(box);
        else if (view === "cat") renderCat(box);
        else if (view === "pos") renderPos(box);
        else renderAI(box);
      }
    };
  }

  /* ============================ 思维导图（ECharts tree） ============================ */
  /* 以「从属关系」组织：中心主题 → 主干（演进层 / 时代阶段）→ 分支（技术体系 / 岗位）→ 叶（细分技术点 / 题目）。
     折叠下钻天然解决节点过多：默认只展开主干，点分支再展开下一级。支持径向与左右两种布局。 */

  /* 技术分类思维导图：递归整棵分类树（体系 → 子类如「关系型数据库」→ 具体技术如「MySQL」），
     每节点题数 = 子树题数（与分类页 /category?cat= 点击后的结果一致）；标签直接带题数，连线按分组着色。 */
  function buildTechTree() {
    const tree = (S.categoryTree && S.categoryTree()) || [];
    const direct = {};
    (S.questions || []).forEach(function (q) { if (q.categoryId != null) direct[q.categoryId] = (direct[q.categoryId] || 0) + 1; });
    function subCount(node) {
      let n = direct[node.id] || 0;
      (node.children || []).forEach(function (c) { n += subCount(c); });
      node._sub = n;
      return n;
    }
    tree.forEach(subCount);

    function mk(node, layer, depth) {
      const color = LAYERS[layer].color;
      const sub = node._sub || 0;
      const out = {
        name: node.name,
        short: node.name + (sub ? "  " + sub + " 题" : ""),
        count: sub,
        symbolSize: Math.max(10, Math.min(66, 12 + Math.sqrt(sub) * 3.4)),
        itemStyle: { color: color, opacity: depth >= 2 ? 0.85 : 1, borderColor: "#fff", borderWidth: 1 },
        lineStyle: { color: hexA(color, 0.6), width: 2 },
        label: { fontSize: depth === 0 ? 13 : (depth === 1 ? 12 : 11) },
        _catId: node.id,
        tip: LAYERS[layer].name + " · 共 " + sub + " 题"
      };
      if (node.children && node.children.length) {
        out.children = node.children.map(function (c) { return mk(c, layer, depth + 1); });
      }
      return out;
    }

    const layerNodes = LAYERS.map(function (L, li) {
      const tops = tree.filter(function (t) { return layerOf(t.name) === li; });
      const total = tops.reduce(function (s, t) { return s + (t._sub || 0); }, 0);
      return {
        name: L.name, short: L.name + "  " + total + " 题",
        count: total, symbolSize: 24,
        itemStyle: { color: L.color, borderColor: "#fff", borderWidth: 1 },
        lineStyle: { color: hexA(L.color, 0.65), width: 2.4 },
        label: { color: L.color, fontWeight: "bold", fontSize: 13 },
        _layer: true, tip: L.desc,
        children: tops.map(function (t) { return mk(t, li, 0); })
      };
    });
    return {
      name: "IT 技术全景", short: "IT 技术全景  " + (S.questions ? S.questions.length : 0) + " 题",
      count: (S.questions || []).length, symbolSize: 46,
      itemStyle: { color: "#64748b", borderColor: "#fff", borderWidth: 1 },
      label: { color: "#fff", fontWeight: "bold", fontSize: 13 },
      _hub: true, tip: LAYERS.length + " 个演进层 · " + tree.length + " 个技术体系",
      children: layerNodes
    };
  }

  /* 岗位思维导图：时代阶段 → 父岗位（category 为空）→ 子岗位（category = 父岗位名），
     每节点题数 = 该岗位题目数；标签直接带题数，连线按阶段着色。 */
  function buildPosTree() {
    const stages = (S.positionsByStage && S.positionsByStage()) || [];
    const totalQ = (S.questions || []).filter(function (q) { return q.positionIds && q.positionIds.length; }).length;
    function mkPos(p, depth, color) {
      const cnt = (S.questionCountForPosition ? S.questionCountForPosition(p) : 0) || 0;
      const nm = S.posFullName ? S.posFullName(p) : (p.name || p.id);
      return {
        name: nm, short: nm + (cnt ? "  " + cnt + " 题" : ""),
        count: cnt,
        symbolSize: Math.max(9, Math.min(30, 9 + Math.sqrt(cnt) * 3)),
        itemStyle: { color: color, opacity: depth >= 1 ? 0.85 : 1, borderColor: "#fff", borderWidth: 1 },
        lineStyle: { color: hexA(color, 0.6), width: 2 },
        label: { fontSize: depth === 0 ? 12 : 11 },
        _posId: p.id, tip: (p.stage || "") + " · 共 " + cnt + " 题"
      };
    }
    return {
      name: "岗位全景", short: "岗位全景  " + totalQ + " 题",
      count: totalQ, symbolSize: 42,
      itemStyle: { color: "#64748b", borderColor: "#fff", borderWidth: 1 },
      label: { color: "#fff", fontWeight: "bold", fontSize: 13 },
      _hub: true, tip: stages.length + " 个时代阶段",
      children: stages.map(function (st, i) {
        const color = STAGE_COLORS[i % STAGE_COLORS.length];
        let positions = (st.list || []).filter(function (p) { return !(S.isHiddenPosition && S.isHiddenPosition(p)); });
        const byName = {};
        positions.forEach(function (p) { byName[p.name] = p; });
        const parents = positions.filter(function (p) { return !p.category; });
        const kidsOf = function (p) { return positions.filter(function (c) { return c.category === p.name; }); };
        return {
          name: st.stage, short: st.stage + "  " + positions.length + " 岗",
          symbolSize: 26,
          itemStyle: { color: color, borderColor: "#fff", borderWidth: 1 },
          lineStyle: { color: hexA(color, 0.65), width: 2.4 },
          label: { color: color, fontWeight: "bold", fontSize: 13 },
          _stage: true, tip: positions.length + " 个岗位",
          children: parents.map(function (p) {
            const node = mkPos(p, 0, color);
            const kids = kidsOf(p);
            if (kids.length) node.children = kids.map(function (c) { return mkPos(c, 1, color); });
            return node;
          })
        };
      })
    };
  }

  /* 分类 id → 所属一级技术体系名（用于把题目归到体系下） */
  function buildCatTopMap() {
    const map = {};
    const tops = collectTops();
    tops.forEach(function (t) {
      map[t.id] = t.name;
      if (S.descendantIds) {
        (S.descendantIds(t.id) || []).forEach(function (id) { map[id] = t.name; });
      } else {
        (t.children || []).forEach(function (c) { map[c.id] = t.name; });
      }
    });
    return map;
  }

  function srcBranch(name, color, list, topMap, total) {
    const groups = {};
    list.forEach(function (q) {
      const k = topMap[q.categoryId] || "未分类";
      (groups[k] = groups[k] || []).push(q);
    });
    const keys = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; });
    return {
      name: name, short: name, count: list.length,
      symbolSize: Math.max(16, Math.min(48, 14 + Math.sqrt(list.length) * 2.2)),
      itemStyle: { color: color },
      label: { color: color, fontWeight: "bold", fontSize: 13 },
      tip: list.length + " 题 · 占全库 " + pct(list.length, total),
      children: keys.map(function (k) {
        return {
          name: k, short: k, count: groups[k].length,
          symbolSize: Math.max(12, Math.min(30, 12 + Math.sqrt(groups[k].length) * 3)),
          itemStyle: { color: color, opacity: 0.85 },
          label: { fontSize: 12 },
          tip: k + " · " + groups[k].length + " 题",
          children: groups[k].map(function (q) {
            const t = q.title || "";
            return {
              name: t, short: t.length > 16 ? t.slice(0, 16) + "…" : t,
              symbolSize: 10, itemStyle: { color: color, opacity: 0.7 },
              label: { fontSize: 10 },
              _qid: q.id, tip: (q.difficulty || "中等") + " · 来源 " + (q.source || "—")
            };
          })
        };
      })
    };
  }

  /* 题目来源思维导图：中心 = 全库，主干 = 来源类型，分支 = 技术体系，叶 = 具体题目 */
  function buildSourceTree() {
    const qs = (S.questions || []).filter(function (q) { return q.status === "published" || q.status == null; });
    const topMap = buildCatTopMap();
    const SRC = [
      { name: "AI 生成", color: "#8b5cf6", test: function (q) { return q.source === "ai"; } },
      { name: "人工录入", color: "#3b82f6", test: function (q) { return q.source === "manual"; } },
      { name: "内置种子", color: "#10b981", test: function (q) { return q.source === "seed"; } },
      { name: "原理整理", color: "#f59e0b", test: function (q) { return q.source === "principles"; } },
      { name: "批量导入", color: "#ec4899", test: function (q) { return q.source === "import"; } },
      /* 用户投稿（20260919h）：投稿审核通过后由管理员在「待入库」收录，来源记为 submission。
         不注册这一条的话它会落进下面的「其他」分支，来源构成图上就分不出来。 */
      { name: "用户投稿", color: "#14b8a6", test: function (q) { return q.source === "submission"; } },
      { name: "外部文档", color: "#06b6d4", test: function (q) { return /^https?:\/\//i.test(q.source || ""); } }
    ];
    const used = {};
    const nodes = SRC.map(function (s) {
      const list = qs.filter(function (q) { if (s.test(q)) { used[q.id] = 1; return true; } return false; });
      return srcBranch(s.name, s.color, list, topMap, qs.length);
    });
    const rest = qs.filter(function (q) { return !used[q.id]; });
    if (rest.length) nodes.push(srcBranch("其他", "#94a3b8", rest, topMap, qs.length));
    return {
      name: "题目来源", short: "题目来源", count: qs.length, symbolSize: 46,
      itemStyle: { color: "#475569" },
      label: { color: "#fff", fontWeight: "bold", fontSize: 13 },
      _hub: true, tip: qs.length + " 道题按来源归类",
      children: nodes.filter(function (n) { return n.count > 0; })
    };
  }

  /* AI 生成题思维导图：只取 source==="ai" 的题目，按一级技术体系归类。
     中心 = AI 题总量，分支 = 技术体系（点击直达该体系题单），叶 = 具体 AI 题（点击直达详情）。
     与「题目来源」全景不同，本视图专指 AI 生成题，避免把全部来源混在一起。 */
  function buildAITree() {
    const qs = (S.questions || []).filter(function (q) { return (q.status === "published" || q.status == null) && q.source === "ai"; });
    const topMap = buildCatTopMap();
    const tops = S.categoryTree() || [];
    const topNameToId = {};
    tops.forEach(function (t) { topNameToId[t.name] = t.id; });
    const groups = {};
    qs.forEach(function (q) { const k = topMap[q.categoryId] || "未分类"; (groups[k] = groups[k] || []).push(q); });
    const keys = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; });
    return {
      name: "AI 生成题", short: "AI 生成题  " + qs.length + " 题",
      count: qs.length, symbolSize: 46,
      itemStyle: { color: "#8b5cf6", borderColor: "#fff", borderWidth: 1 },
      label: { color: "#fff", fontWeight: "bold", fontSize: 13 },
      _hub: true, tip: qs.length + " 道 AI 生成题 · 按技术体系归类",
      children: keys.map(function (k) {
        const list = groups[k];
        return {
          name: k, short: k + "  " + list.length + " 题",
          count: list.length,
          symbolSize: Math.max(14, Math.min(44, 14 + Math.sqrt(list.length) * 2.6)),
          itemStyle: { color: "#8b5cf6", opacity: 0.9, borderColor: "#fff", borderWidth: 1 },
          label: { fontSize: 12 },
          _catId: topNameToId[k] != null ? topNameToId[k] : undefined,
          tip: k + " · " + list.length + " 道 AI 题",
          children: list.map(function (q) {
            const t = q.title || "";
            return {
              name: t, short: t.length > 18 ? t.slice(0, 18) + "…" : t,
              symbolSize: 10, itemStyle: { color: "#a78bfa", opacity: 0.85 },
              label: { fontSize: 10 },
              _qid: q.id, tip: (q.difficulty || "中等") + " · 点击查看题目"
            };
          })
        };
      })
    };
  }

  function drawMindMap(box, root, opt) {
    opt = opt || {};
    let layout = opt.layout === "orthogonal" ? "orthogonal" : "radial";
    const wrap = document.createElement("div");
    wrap.className = "pan-orbit-wrap pan-mm-wrap";
    wrap.innerHTML = '<div class="pan-orbit-rings"><span></span><span></span><span></span><span></span></div>';
    const holder = document.createElement("div");
    holder.className = "panorama-chart pan-orbit-chart pan-mm-chart";
    holder.innerHTML = '<div class="pan-loading">思维导图加载中…</div>';
    wrap.appendChild(holder);

    const bar = document.createElement("div");
    bar.className = "pan-mm-bar";
    bar.innerHTML =
      '<button type="button" class="pan-mm-btn" data-act="layout">' + (layout === "radial" ? "切为左右逻辑图" : "切为径向图") + '</button>' +
      '<button type="button" class="pan-mm-btn" data-act="expand">展开全部</button>' +
      '<button type="button" class="pan-mm-btn" data-act="collapse">只看主干</button>' +
      '<button type="button" class="pan-mm-btn" data-act="fit">复位</button>' +
      (opt.note ? '<span class="pan-mm-note">' + esc(opt.note) + "</span>" : "");
    wrap.appendChild(bar);
    if (opt.legendHtml) {
      const fsLegend = document.createElement("div");
      fsLegend.className = "pan-fs-legend";
      fsLegend.innerHTML = opt.legendHtml;
      wrap.appendChild(fsLegend);
    }
    box.appendChild(wrap);

    let chart = null;

    let depth = opt.depth != null ? opt.depth : 2;
    const maxDepth = opt.maxDepth != null ? opt.maxDepth : 3;
    const fs = attachFullscreen(wrap, function () { return chart; }, [12, 14], function () { apply(); });

    /* 用节点 collapsed 属性控制展开/收起：initialTreeDepth 在 data 引用不变时
       ECharts 不会重算折叠状态，故展开/收起/复位改为直接改 collapsed（可靠生效）。 */
    function walkClear(n) { if (!n) return; delete n.collapsed; (n.children || []).forEach(walkClear); }
    function walkDepth(n, limit, cur) {
      if (!n || !n.children || !n.children.length) return;
      if (cur >= limit) n.collapsed = true; else delete n.collapsed;
      n.children.forEach(function (c) { walkDepth(c, limit, cur + 1); });
    }
    /* ECharts tree 事件里的 params.data 是副本而非原引用，直接改它的 collapsed 不会影响原树；
       故给每个节点发唯一 _nid，点击时按 _nid 在原树上找到真节点再切换折叠。 */
    let nidSeq = 0;
    (function tagNid(n) { n._nid = ++nidSeq; (n.children || []).forEach(tagNid); })(root);
    function findNodeByNid(n, id) {
      if (!n) return null;
      if (n._nid === id) return n;
      for (let i = 0; i < (n.children || []).length; i++) {
        const hit = findNodeByNid(n.children[i], id);
        if (hit) return hit;
      }
      return null;
    }
    function onNodeClick(params) {
      const d = (params && params.data) || {};
      /* 带 id 的实体节点（题目 / 分类 / 岗位）：点击直达对应题单或题目详情。
         注意顺序：先判 id，带 children 的「数据库」「关系型数据库」等分类/岗位节点
         也直接跳题单，不再被下面的「展开/收起」吞掉 —— 这是「点节点回不到对应题」的根因。 */
      if (d._qid != null) { fs.exit(); window.App.go("/question/" + d._qid); return; }
      if (d._catId != null) { fs.exit(); window.App.go("/category?cat=" + d._catId); return; }
      if (d._posId != null) { fs.exit(); window.App.go("/position/" + d._posId); return; }
      /* 纯结构节点（中心 / 演进层 / 时代阶段 / 来源支 / 体系支，无 id）：点击展开或收起下级 */
      if (d.children && d.children.length) {
        const target = findNodeByNid(root, d._nid);
        if (target) {
          if (target.collapsed) delete target.collapsed; else target.collapsed = true;
          apply();
        }
      }
    }

    function fail(msg) {
      holder.innerHTML = '<div class="pan-loading" style="color:#ef4444;display:flex;flex-direction:column;gap:10px;align-items:flex-start"><div>思维导图加载失败：' + esc(msg || "未知错误") + '</div><div style="font-size:12px;color:var(--text-muted)">可能原因：网络抖动 / Service Worker 缓存了损坏响应 / 代理拦截。<a href="javascript:void(0)" style="color:var(--c-primary);text-decoration:underline;margin-left:6px" onclick="(function(){try{window.U.invalidateCache(\'echarts\')}catch(_){};var v=(new URLSearchParams(location.hash.split(\'?\')[1]||\'\')).get(\'view\')||\'all\';window.App.go(\'/panorama?view=\'+v+\'&_t=\'+Date.now());})()">重试</a></div></div>';
    }
    function buildOption() {
      const labelColor = cssVar("--text") || "#334155";
      const edgeColor = cssVar("--border") || "rgba(71,85,105,.5)";
      const isRadial = layout === "radial";
      return {
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item", enterable: true, hideDelay: 240,
          backgroundColor: "rgba(15,23,42,.94)", borderWidth: 0, padding: [9, 13],
          textStyle: { color: "#e5e7eb", fontSize: 12 },
          formatter: function (p) {
            const d = p.data || {};
            const out = ["<b>" + esc(d.short || d.name) + "</b>"];
            if (d.tip) out.push('<span style="color:#cbd5e1">' + esc(d.tip) + "</span>");
            const href = d._catId != null ? "/category?cat=" + d._catId
              : d._posId != null ? "/position/" + d._posId
                : d._qid != null ? "/question/" + d._qid : null;
            if (href) out.push('<a class="pan-tip-link" data-goto="' + esc(href) + '">查看题目 →</a>');
            else if (d.children && d.children.length) out.push('<span style="color:#94a3b8">点击节点展开 / 收起下级</span>');
            return out.join("<br/>");
          }
        },
        series: [{
          type: "tree",
          data: [root],
          left: "6%", right: "14%", top: "4%", bottom: "4%",
          layout: layout,
          orient: "LR",
          edgeShape: "curve",
          edgeForkPosition: "58%",
          roam: true,
          expandAndCollapse: false,
          animationDuration: 420,
          animationDurationUpdate: 420,
          symbol: "circle",
          symbolSize: function (val, params) { return (params && params.data && params.data.symbolSize) || 14; },
          itemStyle: { borderColor: "#fff", borderWidth: 1 },
          lineStyle: { color: edgeColor, width: 2, curveness: isRadial ? 0.5 : 0.45 },
          label: {
            show: true, position: isRadial ? "outside" : "right", color: labelColor, fontSize: 12,
            formatter: function (p) { return p.data.short || p.data.name; }
          },
          leaves: { label: { position: isRadial ? "outside" : "right" } },
          emphasis: { focus: "descendant", lineStyle: { width: 3.6, opacity: 1 } }
        }]
      };
    }
    /* 左右逻辑图（orthogonal）下，同一层兄弟节点竖向堆叠，且 ECharts 按「子树叶子数比例」
       分配高度——若画布不够高，叶子密集的体系下标签必然交叠。故：① 左右图默认比径向图
       少展开一层（effDepth），避免一上来就 185 个节点铺开；② 画布高度按「当前可见节点数」
       动态给（≈每节点 32px），ECharts 按叶子比例分配后每个叶子都有足够纵向间距。 */
    function effDepth() { return layout === "radial" ? depth : Math.max(1, depth - 1); }
    function visibleNodeCount() {
      let cnt = 0;
      (function rec(n) {
        if (!n) return;
        cnt++;
        if (n.collapsed) return;
        (n.children || []).forEach(rec);
      })(root);
      return cnt;
    }
    function resizeHolder() {
      if (!holder) return;
      const n = visibleNodeCount();
      const inFs = document.fullscreenElement === wrap || wrap.classList.contains("pan-pseudo-fs");
      const fsMin = inFs ? window.innerHeight : 0;
      if (layout === "orthogonal") {
        const h = Math.max(fsMin || 640, Math.min(6000, n * 32));
        holder.style.height = h + "px";
      } else {
        const h = Math.max(fsMin || 640, Math.min(2400, Math.round(n * 6 + 400)));
        holder.style.height = h + "px";
      }
    }
    function apply() {
      if (!chart) return;
      resizeHolder();
      /* 先 resize 同步画布尺寸，再 setOption(notMerge) 重建：setOption 内部按新画布布局并读取
         data.collapsed；若先 setOption 再 resize，resize 触发的重布局会忽略 collapsed 导致全展开 */
      try { chart.resize(); chart.setOption(buildOption(), true); } catch (e) {}
    }
    bar.addEventListener("click", function (e) {
      const b = e.target && e.target.closest ? e.target.closest(".pan-mm-btn") : null;
      if (!b) return;
      const act = b.getAttribute("data-act");
      if (act === "layout") {
        layout = layout === "radial" ? "orthogonal" : "radial";
        b.textContent = layout === "radial" ? "切为左右逻辑图" : "切为径向图";
        /* 左右逻辑图是纵向堆叠，默认收一层 + 更高画布才不挤 */
        wrap.classList.toggle("pan-mm-tall", layout === "orthogonal");
        walkDepth(root, effDepth(), 0);   /* 左右图默认收一层，避免一上来就挤成一团 */
        apply();
      } else if (act === "expand") {
        walkClear(root);   /* 展开全部：清除所有 collapsed，一路铺到叶子（含具体题目） */
        apply();
      }
      else if (act === "collapse") { walkDepth(root, 1, 0); apply(); }
      else if (act === "fit") {
        layout = "radial";
        b.parentNode.querySelector('[data-act="layout"]').textContent = "切为左右逻辑图";
        wrap.classList.remove("pan-mm-tall");
        walkDepth(root, opt.depth != null ? opt.depth : 2, 0);
        apply();
      }
    });
    holder.addEventListener("click", function (e) {
      const a = e.target && e.target.closest ? e.target.closest(".pan-tip-link") : null;
      if (!a) return;
      const to = a.getAttribute("data-goto");
      if (to) { fs.exit(); window.App.go(to); }
    });

    U.loadScript("echarts", U.ECHARTS_URL).then(function () {
      if (!holder || !window.echarts) { fail("echarts 未就绪"); return; }
      try { chart = echarts.init(holder, null, { renderer: "canvas" }); }
      catch (e) { fail(e.message); return; }
      if (window.App && window.App.registerChart) window.App.registerChart(chart);
      chart.showLoading({ text: "思维导图加载中…", color: "#3b82f6", textColor: "#334155", maskColor: "rgba(255,255,255,.55)", fontSize: 13 });
      walkDepth(root, effDepth(), 0);   /* 按当前布局设初始展开层级（左右图默认收一层） */
      resizeHolder();
      try { chart.setOption(buildOption(), true); chart.resize(); chart.hideLoading(); chart.on("click", onNodeClick); }
      catch (e) { try { chart.hideLoading(); } catch (e2) {} fail(e.message); return; }
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(function () { try { chart.resize(); } catch (e) {} });
        ro.observe(holder);
      } else {
        window.addEventListener("resize", function () { try { chart.resize(); } catch (e) {} });
      }

    }).catch(function (e) { fail(e && e.message); });
  }

  /* ============================ 通用：全屏查看 ============================ */
  /* 优先用原生 Fullscreen API；浏览器不支持（如 iOS Safari）时降级为 fixed 伪全屏。
     返回 { exit } ，跳转前调用可自动退出全屏。 */
  function attachFullscreen(wrap, getChart, labelFs, onFsChange) {
    labelFs = labelFs || [11, 14];
    const fsBtn = document.createElement("button");
    fsBtn.type = "button";
    fsBtn.className = "pan-fs-btn";
    fsBtn.title = "全屏查看（Esc 退出）";
    fsBtn.innerHTML = '<span class="pan-fs-ic">&#9974;</span><span class="pan-fs-txt">全屏</span>';
    wrap.appendChild(fsBtn);

    function isNativeFs() {
      return document.fullscreenElement === wrap || document.webkitFullscreenElement === wrap;
    }
    function isFs() { return isNativeFs() || wrap.classList.contains("pan-pseudo-fs"); }
    function syncFs() {
      const on = isFs();
      fsBtn.classList.toggle("on", on);
      const ic = fsBtn.querySelector(".pan-fs-ic"), tx = fsBtn.querySelector(".pan-fs-txt");
      if (ic) ic.innerHTML = on ? "&#10005;" : "&#9974;";
      if (tx) tx.textContent = on ? "退出全屏" : "全屏";
    }
    function afterFsChange() {
      syncFs();
      const chart = getChart ? getChart() : null;
      if (chart) {
        try { chart.setOption({ series: [{ label: { fontSize: isFs() ? labelFs[1] : labelFs[0] } }] }); } catch (e) {}
        try { chart.resize(); } catch (e) {}
      }
      if (onFsChange) try { onFsChange(); } catch (e) {}
    }
    function exitFs() {
      if (!isFs()) return;
      if (isNativeFs()) {
        const ex = document.exitFullscreen || document.webkitExitFullscreen;
        if (ex) { try { ex.call(document); } catch (e) {} }
      }
      /* 无论原生是否可用，一并清理伪全屏残留状态，避免两种状态叠加 */
      if (wrap.classList.contains("pan-pseudo-fs")) {
        wrap.classList.remove("pan-pseudo-fs");
        document.body.classList.remove("pan-fs-lock");
      }
      afterFsChange();
    }
    function enterPseudoFs() {
      wrap.classList.add("pan-pseudo-fs");
      document.body.classList.add("pan-fs-lock");
      afterFsChange();
    }
    fsBtn.addEventListener("click", function () {
      if (isFs()) { exitFs(); return; }
      const req = wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.msRequestFullscreen;
      if (req) {
        try {
          const p = req.call(wrap);
          if (p && p.catch) p.catch(function () { enterPseudoFs(); });
        } catch (e) { enterPseudoFs(); return; }
        setTimeout(function () { if (!isFs()) enterPseudoFs(); }, 400);
      } else {
        enterPseudoFs();
      }
    });
    function onFsChangeGlobal() {
      if (!document.body.contains(wrap)) {
        document.removeEventListener("fullscreenchange", onFsChangeGlobal);
        document.removeEventListener("webkitfullscreenchange", onFsChangeGlobal);
        document.removeEventListener("keydown", onEsc);
        return;
      }
      afterFsChange();
    }
    function onEsc(e) {
      if (e.key === "Escape" && wrap.classList.contains("pan-pseudo-fs")) exitFs();
    }
    document.addEventListener("fullscreenchange", onFsChangeGlobal);
    document.addEventListener("webkitfullscreenchange", onFsChangeGlobal);
    document.addEventListener("keydown", onEsc);
    return { exit: exitFs };
  }

  /* ============================ 旧版：分层同心轨道图 ============================
   * v20260901a 及之前的实现，已被上方「思维导图」取代（用户反馈轨道图节点一多就挤、连线缠成一团）。
   * 当前四个视图都不再调用它，保留在此便于日后若要切回径向轨道图时直接复用。
   */
  function drawOrbit(box, nodes, links, opt) {
    opt = opt || {};
    const holder = document.createElement("div");
    holder.className = "panorama-chart pan-orbit-chart";
    holder.innerHTML = '<div class="pan-loading">轨道图加载中…</div>';
    const wrap = document.createElement("div");
    wrap.className = "pan-orbit-wrap";
    wrap.innerHTML = '<div class="pan-orbit-rings"><span></span><span></span><span></span><span></span></div>';
    wrap.appendChild(holder);
    if (opt.legendHtml) {
      const fsLegend = document.createElement("div");
      fsLegend.className = "pan-fs-legend";
      fsLegend.innerHTML = opt.legendHtml;
      wrap.appendChild(fsLegend);
    }
    box.appendChild(wrap);

    let chart = null;
    const fs = attachFullscreen(wrap, function () { return chart; });

    function fail(msg) {
      holder.innerHTML = '<div class="pan-loading" style="color:#ef4444;display:flex;flex-direction:column;gap:10px;align-items:flex-start"><div>轨道图加载失败：' + esc(msg || "未知错误") + '</div><div style="font-size:12px;color:var(--text-muted)">可能原因：网络抖动 / Service Worker 缓存了损坏响应 / 代理拦截。<a href="javascript:void(0)" style="color:var(--c-primary);text-decoration:underline;margin-left:6px" onclick="(function(){try{window.U.invalidateCache(\'echarts\')}catch(_){};var v=(new URLSearchParams(location.hash.split(\'?\')[1]||\'\')).get(\'view\')||\'all\';window.App.go(\'/panorama?view=\'+v+\'&_t=\'+Date.now());})()">重试</a></div></div>';
    }
    U.loadScript("echarts", U.ECHARTS_URL).then(function () {
      if (!holder || !window.echarts) { fail("echarts 未就绪"); return; }
      try { chart = echarts.init(holder, null, { renderer: "canvas" }); }
      catch (e) { fail(e.message); return; }
      if (window.App && window.App.registerChart) window.App.registerChart(chart);
      chart.showLoading({ text: "轨道图加载中…", color: "#3b82f6", textColor: "#334155", maskColor: "rgba(255,255,255,.55)", fontSize: 13 });
      const labelColor = cssVar("--text") || "#334155";
      const edgeColor = cssVar("--border") || "#cbd5e1";
      try {
        chart.setOption({
          backgroundColor: "transparent",
          tooltip: {
            trigger: "item",
            backgroundColor: "rgba(15,23,42,.92)",
            borderWidth: 0,
            padding: [8, 12],
            textStyle: { color: "#e5e7eb", fontSize: 12 },
            formatter: function (p) {
              const d = p.data || {};
              if (d._hub) return "<b>IT 技术全景</b><br/>21 个技术体系 · " + (S.questions ? S.questions.length : "") + " 道题";
              if (d._stage) return "<b>" + esc(d.short) + "</b><br/>该时代的岗位簇";
              const nm = d.short || d.name || "";
              const c = d.count != null ? d.count : "";
              const tag = d._posId != null ? "岗位" : (d._sub ? (d.layer != null ? LAYERS[d.layer].name + " · 细分" : "细分技术") : (d.layer != null ? LAYERS[d.layer].name : "技术体系"));
              return "<b>" + esc(nm) + "</b><br/>" + esc(tag) + " · " + c + " 题";
            }
          },
          series: [{
            type: "graph",
            layout: "none",
            roam: true,
            data: nodes,
            links: links,
            edgeSymbol: ["none", "none"],
            lineStyle: { color: edgeColor, opacity: 0.32, width: 1, curveness: 0 },
            label: {
              show: true, position: "bottom", fontSize: 11, color: labelColor,
              formatter: function (p) { return p.data.short || p.data.name; }
            },
            labelLayout: { hideOverlap: true },
            emphasis: { focus: "adjacency", label: { show: true }, lineStyle: { width: 2, opacity: 0.85 } },
            itemStyle: { borderColor: "#fff", borderWidth: 1 },
            symbolSize: function (val, params) { return (params && params.data && params.data.symbolSize) || 20; }
          }]
        });
        chart.hideLoading();
      } catch (e) {
        chart.hideLoading();
        fail(e.message);
        return;
      }
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(function () { try { chart.resize(); } catch (e) {} });
        ro.observe(holder);
      } else {
        window.addEventListener("resize", function () { try { chart.resize(); } catch (e) {} });
      }
      chart.on("click", function (params) {
        const d = params.data || {};
        if (d._catId != null) { fs.exit(); window.App.go("/category?cat=" + d._catId); }
        else if (d._posId != null) { fs.exit(); window.App.go("/position/" + d._posId); }
      });
    }).catch(function (e) { fail(e && e.message); });
  }

  function legendHtml(layers, note) {
    return '<div class="pan-legend">' +
      layers.map(function (l) {
        return '<span class="pan-legend-item"><i style="background:' + l.color + '"></i><b>' + esc(l.name) + "</b><em>" + esc(l.desc) + "</em></span>";
      }).join("") +
      (note ? '<div class="pan-legend-note">' + esc(note) + "</div>" : "") +
      "</div>";
  }

  /* ============================ 数据收集 ============================ */
  function collectTops() {
    const tree = (S.categoryTree && S.categoryTree()) || [];
    return tree.map(function (t) {
      return {
        id: t.id, name: t.name, count: t.count || 0, layer: layerOf(t.name),
        children: (t.children || []).map(function (c) { return { id: c.id, name: c.name, count: c.count || 0 }; })
      };
    });
  }

  /* ============================ 视图：题库全景 / 技术分类 ============================ */
  function ringRadius(layer) { return [34, 64, 94, 124][layer]; }

  function buildTechNodes(includeSubs) {
    const tops = collectTops();
    const nodes = [], links = [];
    nodes.push({
      id: "__hub__", name: "IT 技术全景", x: 0, y: 0, symbolSize: 46,
      itemStyle: { color: "#64748b", shadowBlur: 20, shadowColor: "rgba(100,116,139,.5)" },
      label: { show: true, position: "inside", color: "#fff", fontWeight: 700, fontSize: 12 },
      _hub: true, short: "IT 技术全景"
    });
    const byLayer = [[], [], [], []];
    tops.forEach(function (t) { byLayer[t.layer].push(t); });
    byLayer.forEach(function (grp, L) {
      const n = grp.length, step = 360 / n, off = L * 16;
      grp.forEach(function (t, k) {
        const ang = (off + k * step) * Math.PI / 180;
        const r = ringRadius(L);
        const x = +(r * Math.cos(ang)).toFixed(2), y = +(r * Math.sin(ang)).toFixed(2);
        const color = LAYERS[L].color;
        nodes.push({
          id: "top" + t.id, name: t.name, x: x, y: y, symbolSize: sizeFor(t.count),
          itemStyle: { color: color, shadowBlur: 14, shadowColor: hexA(color, 0.45) },
          _catId: t.id, short: t.name, count: t.count, layer: L, label: { show: true }
        });
        links.push({ source: "__hub__", target: "top" + t.id, lineStyle: { opacity: 0.4, width: 1.2 } });
      });
    });
    if (includeSubs) {
      tops.forEach(function (t) {
        const parent = nodes.filter(function (n) { return n._catId === t.id; })[0];
        if (!parent) return;
        const subs = (t.children || []).filter(function (s) { return s.count > 0; });
        const m = subs.length;
        if (!m) return;
        const ang0 = Math.atan2(parent.y, parent.x);
        const pr = ringRadius(t.layer);
        const totalArc = 34, stepArc = m > 1 ? totalArc / (m - 1) : 0;
        subs.forEach(function (s, k) {
          const a = ang0 + (-totalArc / 2 + k * stepArc) * Math.PI / 180;
          const rr = pr + 16 + (k % 3) * 7;
          const x = +(rr * Math.cos(a)).toFixed(2), y = +(rr * Math.sin(a)).toFixed(2);
          const color = LAYERS[t.layer].color;
          nodes.push({
            id: "sub" + s.id, name: s.name, x: x, y: y,
            symbolSize: Math.max(7, Math.min(24, 8 + Math.sqrt(s.count) * 1.7)),
            itemStyle: { color: color, opacity: 0.82, shadowBlur: 6, shadowColor: hexA(color, 0.3) },
            _catId: s.id, short: s.name, count: s.count, layer: t.layer, label: { show: false }, _sub: true
          });
          links.push({ source: "top" + t.id, target: "sub" + s.id, lineStyle: { opacity: 0.16, width: 0.8 } });
        });
      });
    }
    return { nodes: nodes, links: links };
  }

  function summaryHtml() {
    const tops = collectTops();
    const total = S.questions ? S.questions.length : 0;
    const topsWithQ = tops.filter(function (t) { return t.count > 0; }).length;
    let subWithQ = 0;
    tops.forEach(function (t) { (t.children || []).forEach(function (c) { if (c.count > 0) subWithQ++; }); });
    const cards = [
      { n: total, l: "题目总数" },
      { n: topsWithQ, l: "有题技术体系" },
      { n: subWithQ, l: "有题细分技术" },
      { n: (S.positionsByStage ? S.positionsByStage().reduce(function (a, s) { return a + (s.list ? s.list.length : 0); }, 0) : 0), l: "覆盖岗位" }
    ];
    return '<div class="panorama-summary">' + cards.map(function (c) {
      return '<div class="pan-sum"><div class="pan-sum-num">' + c.n + '</div><div class="pan-sum-label">' + esc(c.l) + "</div></div>";
    }).join("") + "</div>";
  }

  function renderAll(box) {
    const lg = legendHtml(LAYERS, "由内到外 = 技术演进：基石 → 系统开发 → 架构工程 → 数据与智能/领域前沿。节点上的「N 题」即该方向全部题目数，点节点直达题单。");
    box.innerHTML = summaryHtml() + lg;
    drawMindMap(box, buildTechTree(), {
      legendHtml: lg, depth: 2, maxDepth: 4,
      note: "点技术体系节点直达该体系题单；结构节点（中心 / 演进层）点击展开下一级；滚轮缩放、拖拽平移"
    });
  }

  function renderCat(box) {
    const lg = legendHtml(LAYERS, "主干 = 4 个演进层，分支 = 21 个技术体系，再下钻 = 细分技术点（如 数据库→关系型数据库→MySQL）。节点标注「N 题」即该分类题数。");
    box.innerHTML = '<p class="muted" style="margin:0 0 12px">技术分类已细分到底：比如「数据库」下能看到「关系型数据库」「非关系型数据库」，再点开就能看到 MySQL / PostgreSQL / Redis 等具体技术，每个都标了题数。点节点直达题目列表。</p>' + lg;
    drawMindMap(box, buildTechTree(), {
      legendHtml: lg, depth: 3, maxDepth: 4,
      note: "点任一技术节点直达该分类题单（含其下所有题目）；点「展开全部」铺开结构，再点具体题目直达详情"
    });
  }

  /* ============================ 视图：覆盖岗位（按时代阶段） ============================ */
  function renderPos(box) {
    const stages = (S.positionsByStage && S.positionsByStage()) || [];
    const stageLegend = stages.map(function (st, i) {
      return { name: st.stage, color: STAGE_COLORS[i % STAGE_COLORS.length], desc: (st.list ? st.list.length : 0) + " 个岗位" };
    });
    const lg = legendHtml(stageLegend, "由内到外 = 技术时代演进：计算机基础 → 软件开发 → 互联网 → 移动互联网 → 云与大数据 → AI/大模型 → 新兴技术 → 综合管理。节点标注「N 题」即该岗位题数。");
    box.innerHTML = '<p class="muted" style="margin:0 0 12px">岗位按「时代阶段」归组，再细分成父子岗位（如「硬件工程师」→「数字电路工程师 / 嵌入式硬件工程师」）。每个岗位都标了题数，点节点直达对应岗位题库。</p>' + lg;
    drawMindMap(box, buildPosTree(), {
      legendHtml: lg, depth: 2, maxDepth: 3,
      note: "点任一岗位节点直达该岗位题单；结构节点（中心 / 时代阶段）点击展开下一级"
    });
  }

  /* ============================ 视图：AI 生成题 ============================ */
  function renderAI(box) {
    const qs = (S.questions || []).filter(function (q) { return q.status === "published" || q.status == null; });
    const ai = qs.filter(function (q) { return q.source === "ai"; });
    const topMap = buildCatTopMap();
    const aiTops = {};
    ai.forEach(function (q) { aiTops[topMap[q.categoryId] || "未分类"] = 1; });
    const aiTopCount = Object.keys(aiTops).length;
    box.innerHTML =
      '<div class="panorama-summary"><div class="pan-sum"><div class="pan-sum-num">' + ai.length + '</div><div class="pan-sum-label">AI 生成题</div></div>' +
      '<div class="pan-sum"><div class="pan-sum-num">' + aiTopCount + '</div><div class="pan-sum-label">涉及技术体系</div></div>' +
      '<div class="pan-sum"><div class="pan-sum-num">' + qs.length + '</div><div class="pan-sum-label">题库总量</div></div>' +
      '<div class="pan-sum"><div class="pan-sum-num">' + (qs.length ? Math.round(ai.length / qs.length * 100) : 0) + '%</div><div class="pan-sum-label">AI 占比</div></div></div>' +
      '<p class="muted" style="margin:0 0 12px">仅展示 <b>AI 生成</b> 的题目（已与其他来源分开），按技术体系归类成思维导图：中心是 AI 题总量，往外一层是技术体系，再点开就是具体题目。点体系直达该体系题单，点题目直达详情。</p>';
    drawMindMap(box, buildAITree(), {
      layout: "orthogonal", depth: 3, maxDepth: 3,
      note: "点技术体系节点直达该体系题单；点具体题目直达详情；结构节点（中心）点击展开/收起"
    });
  }
})();

;/* ===== << js/panorama.js ===== */

;/* ===== >> js/sharecard.js ===== */
/* 题目分享卡片：用 canvas 渲染一张精美的题目卡片 PNG
 * - 移动端优先走 navigator.share({files}) 直接分享到微信，桌面降级为下载
 * - 二维码走外部服务，加载失败（或画布被跨域污染）时自动降级为纯文字网址
 */
(function () {
  const W = 800, H = 1120;          // 逻辑尺寸（导出时按 2 倍像素，保证清晰）
  const SCALE = 2;
  const PAD = 40;                   // 卡片外边距
  const CARD_W = W - PAD * 2;       // 720
  const CARD_H = H - PAD * 2;       // 1040
  const HEAD_H = 420;               // 顶部渐变区高度
  const X0 = PAD, Y0 = PAD;

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* 去掉 Markdown 标记，取纯文本摘要 */
  function stripMd(s) {
    return String(s || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/\*\*([^*]*)\*\*/g, "$1")
      .replace(/\*([^*]*)\*/g, "$1")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* 结构化答案摘要：保留「编号 / 要点 / 分段」的层次。
     旧版把答案整体 stripMd 成一段再硬折 7 行，编号和段落全糊在一起，观感很差。
     这里按空行和行首编号/项目符号切块，每块独立折行绘制，块间留缝。 */
  function answerBlocks(src, maxBlocks) {
    const text = String(src || "").replace(/```[\s\S]*?```/g, " ").replace(/\r\n/g, "\n");
    const blocks = [];
    let cur = "";
    const flush = () => {
      const s = stripMd(cur).trim();
      if (s) blocks.push(s);
      cur = "";
    };
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line) { flush(); continue; }
      if (/^([0-9]{1,2}[.、)]|[①②③④⑤⑥⑦⑧⑨⑩]|[-*+]\s|#{1,6}\s)/.test(line)) {
        flush();
        cur = line;
      } else {
        cur = cur ? cur + " " + line : line;
      }
    }
    flush();
    return blocks.slice(0, maxBlocks);
  }

  /* 逐字符折行（中文无空格，不能按词折行） */
  function wrap(ctx, text, maxW, maxLines) {
    const lines = [];
    let cur = "";
    for (const ch of String(text || "")) {
      if (ch === "\n") { lines.push(cur); cur = ""; if (lines.length >= maxLines) break; continue; }
      const t = cur + ch;
      if (ctx.measureText(t).width > maxW && cur) {
        lines.push(cur);
        if (lines.length >= maxLines) { cur = ""; break; }
        cur = ch;
      } else cur = t;
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    if (lines.length === maxLines) {
      // 末行放不下时补省略号
      let last = lines[maxLines - 1];
      while (last && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last + "…";
    }
    return lines;
  }

  function drawPill(ctx, x, y, text, opt) {
    opt = opt || {};
    ctx.font = (opt.font || "500 21px") + ' -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    const tw = ctx.measureText(text).width;
    const h = 42, padX = 16;
    const w = tw + padX * 2;
    ctx.fillStyle = opt.bg || "#EFF6FF";
    rr(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = opt.fg || "#1D4ED8";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + padX, y + h / 2 + 1);
    return w;
  }

  /* 画卡片主体（二维码随后叠加） */
  function drawCard(ctx, q, meta) {
    ctx.clearRect(0, 0, W, H);
    // 外层底色
    ctx.fillStyle = "#F1F5F9";
    ctx.fillRect(0, 0, W, H);

    // 卡片裁剪区
    ctx.save();
    rr(ctx, X0, Y0, CARD_W, CARD_H, 36);
    ctx.clip();

    // 顶部渐变
    const g = ctx.createLinearGradient(X0, Y0, X0 + CARD_W, Y0 + HEAD_H);
    g.addColorStop(0, "#1E40AF");
    g.addColorStop(0.55, "#2563EB");
    g.addColorStop(1, "#6D28D9");
    ctx.fillStyle = g;
    ctx.fillRect(X0, Y0, CARD_W, HEAD_H);
    // 渐变区装饰圆
    ctx.fillStyle = "rgba(255,255,255,.07)";
    ctx.beginPath(); ctx.arc(X0 + CARD_W - 60, Y0 + 40, 130, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(X0 + 40, Y0 + HEAD_H - 30, 90, 0, Math.PI * 2); ctx.fill();

    // 品牌
    const bx = X0 + 40, by = Y0 + 44;
    ctx.fillStyle = "rgba(255,255,255,.20)";
    rr(ctx, bx, by, 44, 44, 12); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = '700 20px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = "middle";
    ctx.fillText("IT", bx + 10, by + 23);
    ctx.font = '700 25px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("IT 面试题库", bx + 58, by + 17);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = '15px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(location.host, bx + 58, by + 38);

    // 题目标题
    ctx.fillStyle = "#fff";
    ctx.font = '700 38px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    const titleLines = wrap(ctx, q.title, CARD_W - 80, 4);
    let ty = Y0 + 150;
    for (const ln of titleLines) { ctx.fillText(ln, X0 + 40, ty); ty += 54; }

    // 下半部白底
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(X0, Y0 + HEAD_H, CARD_W, CARD_H - HEAD_H);

    // 标签
    let px = X0 + 40;
    const py = Y0 + HEAD_H + 40;
    const tags = meta.tags.slice(0, 3);
    for (const t of tags) {
      const w = drawPill(ctx, px, py, t);
      px += w + 12;
      if (px > X0 + CARD_W - 120) break;
    }

    // 参考答案摘要（按编号/要点分块绘制，块间留缝，不再整段糊在一起）
    ctx.fillStyle = "#94A3B8";
    ctx.font = '500 19px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("参考答案", X0 + 40, Y0 + HEAD_H + 128);
    ctx.fillStyle = "#334155";
    ctx.font = '25px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    let ay = Y0 + HEAD_H + 162;
    let budget = meta.answerLines || 7;
    for (let bi = 0; bi < meta.answerBlocks.length && budget > 0; bi++) {
      const isLastBlock = bi === meta.answerBlocks.length - 1;
      const lines = wrap(ctx, meta.answerBlocks[bi], CARD_W - 80, budget);
      budget -= lines.length;
      if (budget <= 0 && !isLastBlock && !/…$/.test(lines[lines.length - 1])) {
        let last = lines[lines.length - 1];
        while (last && ctx.measureText(last + "…").width > CARD_W - 80) last = last.slice(0, -1);
        lines[lines.length - 1] = last + "…";
      }
      for (const ln of lines) { ctx.fillText(ln, X0 + 40, ay); ay += 42; }
      if (budget > 0) ay += 10;   // 块间距
    }

    // 底部分隔线
    const fy = Y0 + CARD_H - 130;
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X0 + 40, fy); ctx.lineTo(X0 + CARD_W - 40, fy); ctx.stroke();

    // 左下文案 + 网址
    ctx.fillStyle = "#64748B";
    ctx.font = '18px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(meta.hasQr ? "微信扫码查看完整答案与解析" : "复制链接到浏览器查看完整答案", X0 + 40, fy + 38);
    ctx.fillStyle = "#2563EB";
    ctx.font = '700 21px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    const urlTxt = meta.url.replace(/^https?:\/\//, "");
    ctx.fillText(urlTxt.length > 34 ? urlTxt.slice(0, 34) + "…" : urlTxt, X0 + 40, fy + 74);

    ctx.restore();
  }

  /* 二维码：失败或跨域污染时返回 null，卡片降级为纯文字 */
  function loadQr(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const done = v => resolve(v);
      const t = setTimeout(() => done(null), 6000);
      img.onload = () => { clearTimeout(t); done(img); };
      img.onerror = () => { clearTimeout(t); done(null); };
      img.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=" + encodeURIComponent(url);
    });
  }

  function drawQr(ctx, img) {
    const size = 104;
    const x = X0 + CARD_W - 40 - size;
    const y = Y0 + CARD_H - 122;
    ctx.save();
    rr(ctx, x - 6, y - 6, size + 12, size + 12, 12);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.strokeStyle = "#E2E8F0"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    try { ctx.drawImage(img, x, y, size, size); } catch (e) {}
  }

  const ShareCard = {
    /* 题目对象 → meta */
    meta(q, url) {
      const tags = [];
      if (q.catName) tags.push(q.catName);
      if (q.difficulty) tags.push(q.difficulty);
      if (q.years) tags.push(q.years);
      if (q.type && tags.length < 3) tags.push(q.type);
      return {
        url,
        tags: tags.length ? tags : ["面试题"],
        answerBlocks: answerBlocks(q.answer || q.body || "", 8),
        answerLines: 7
      };
    },

    /* 渲染卡片，返回 {canvas, meta}（二维码可用时已叠加） */
    async render(q, url) {
      const meta = ShareCard.meta(q, url);
      const cv = document.createElement("canvas");
      cv.width = W * SCALE; cv.height = H * SCALE;
      const ctx = cv.getContext("2d");
      ctx.scale(SCALE, SCALE);
      ctx.textBaseline = "alphabetic";

      // 先按无二维码排版（底部文案不同），拿到二维码后重绘并叠加
      meta.hasQr = false;
      drawCard(ctx, q, meta);
      const qr = await loadQr(url);
      if (qr) {
        // 校验是否污染画布：污染则 toDataURL 抛错，此时放弃二维码
        try { cv.toDataURL("image/png"); meta.hasQr = true; } catch (e) { meta.hasQr = false; }
      }
      if (meta.hasQr) {
        drawCard(ctx, q, meta); drawQr(ctx, qr);
        // 二次校验：二维码服务未正确返回 CORS 时画布会被污染，toDataURL 抛 SecurityError；此时降级为无二维码卡片
        try { cv.toDataURL("image/png"); }
        catch (e) { meta.hasQr = false; drawCard(ctx, q, meta); }
      }
      return { canvas: cv, meta };
    },

    /* canvas → PNG 文件 */
    toFile(canvas, filename) {
      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error("toBlob failed")); return; }
          resolve(new File([blob], filename, { type: "image/png" }));
        }, "image/png");
      });
    }
  };

  /* ============================ 学习周报分享卡 ============================ */
  function weekCardRender(st) {
    st = st || {};
    return new Promise((resolve, reject) => {
      const W = 800, H = 1120, S = 2, PAD = 40;
      const cv = document.createElement("canvas");
      cv.width = W * S; cv.height = H * S;
      const ctx = cv.getContext("2d");
      ctx.scale(S, S); ctx.textBaseline = "alphabetic";
      const F = (w, px) => w + " " + px + "px -apple-system, \"PingFang SC\", \"Microsoft YaHei\", sans-serif";
      const CX = PAD, CY = PAD, CW = W - PAD * 2, CH = H - PAD * 2;
      try {
        ctx.fillStyle = "#F1F5F9"; ctx.fillRect(0, 0, W, H);
        ctx.save();
        rr(ctx, CX, CY, CW, CH, 36); ctx.clip();
        const g = ctx.createLinearGradient(CX, CY, CX + CW, CY + 320);
        g.addColorStop(0, "#1E40AF"); g.addColorStop(0.55, "#2563EB"); g.addColorStop(1, "#6D28D9");
        ctx.fillStyle = g; ctx.fillRect(CX, CY, CW, 320);
        ctx.fillStyle = "rgba(255,255,255,.07)";
        ctx.beginPath(); ctx.arc(CX + CW - 50, CY + 30, 120, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = F("700", 24);
        ctx.fillText("IT 面试题库 · 学习周报", CX + 40, CY + 66);
        ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = F("500", 17);
        ctx.fillText(String(st.range || ""), CX + 40, CY + 98);
        ctx.font = F("700", 40);
        ctx.fillText(String(st.slogan || "坚持就是胜利").slice(0, 15), CX + 40, CY + 210);
        ctx.fillStyle = "#FFFFFF"; ctx.fillRect(CX, CY + 320, CW, CH - 320);
        const stats = [["本周刷题", st.total || 0, "#2563EB"], ["打卡天数", st.days || 0, "#D97706"], ["新增薄弱", st.weakNew || 0, "#DC2626"]];
        stats.forEach((it, i) => {
          const cx = CX + 40 + (i + 0.5) * (CW - 80) / 3;
          ctx.textAlign = "center";
          ctx.fillStyle = it[2]; ctx.font = F("800", 54);
          ctx.fillText(String(it[1]), cx, CY + 432);
          ctx.fillStyle = "#94A3B8"; ctx.font = F("500", 18);
          ctx.fillText(it[0], cx, CY + 464);
          ctx.textAlign = "left";
        });
        ctx.fillStyle = "#94A3B8"; ctx.font = F("500", 17);
        ctx.fillText("每日刷题分布", CX + 40, CY + 545);
        const bBase = CY + 705, bMax = 125;
        const maxN = Math.max(1, ...(st.daily || []).map(d => d.n || 0));
        (st.daily || []).forEach((d, i) => {
          const cx = CX + 40 + (i + 0.5) * (CW - 80) / 7;
          const h = d.n ? Math.max(8, Math.round(d.n / maxN * bMax)) : 4;
          ctx.fillStyle = d.label === "今" ? "#1D4ED8" : "#93C5FD";
          rr(ctx, cx - 22, bBase - h, 44, h, 5); ctx.fill();
          ctx.textAlign = "center";
          if (d.n) { ctx.fillStyle = "#475569"; ctx.font = F("600", 16); ctx.fillText(String(d.n), cx, bBase - h - 8); }
          ctx.fillStyle = "#94A3B8"; ctx.font = F("500", 16);
          ctx.fillText(d.label, cx, bBase + 24);
          ctx.textAlign = "left";
        });
        ctx.fillStyle = "#94A3B8"; ctx.font = F("500", 17);
        ctx.fillText(st.weakIsWeek ? "本周新增薄弱 Top" : "累计薄弱 Top", CX + 40, CY + 795);
        let px = CX + 40, py = CY + 838;
        (st.weakTop || []).slice(0, 3).forEach(w => {
          const txt = String(w.name || "").slice(0, 12) + " " + (w.n || 0);
          const pw = drawPill(ctx, px, py - 21, txt, { bg: "#FEF3C7", fg: "#B45309", font: "600 18" });
          px += pw + 12;
          if (px > CX + CW - 140) { px = CX + 40; py += 46; }
        });
        const fy = CY + CH - 128;
        ctx.strokeStyle = "#E2E8F0"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(CX + 40, fy); ctx.lineTo(CX + CW - 40, fy); ctx.stroke();
        ctx.fillStyle = "#64748B"; ctx.font = F("500", 18);
        ctx.fillText("坚持学习的人，运气都不会太差", CX + 40, fy + 36);
        ctx.fillStyle = "#2563EB"; ctx.font = F("700", 21);
        ctx.fillText(location.host, CX + 40, fy + 72);
        ctx.restore();
      } catch (e) { reject(e); return; }
      loadQr(location.origin + "/").then(img => {
        if (img) {
          const size = 104, x = CX + CW - 40 - size, y = CY + CH - 122;
          ctx.save();
          rr(ctx, x - 6, y - 6, size + 12, size + 12, 12); ctx.fillStyle = "#fff"; ctx.fill();
          ctx.strokeStyle = "#E2E8F0"; ctx.lineWidth = 2; ctx.stroke();
          ctx.restore();
          try { ctx.drawImage(img, x, y, size, size); } catch (e) {}
        }
        resolve({ canvas: cv });
      });
    });
  }
  window.WeekCard = { render: weekCardRender, toFile: ShareCard.toFile };
  window.ShareCard = ShareCard;
})();

;/* ===== << js/sharecard.js ===== */

;/* ===== >> js/guide.js ===== */
/* =========================================================================
 *  js/guide.js — 站内使用指南（#/help）：从 app.js 拆出的第一块（模块化第一步）
 *  依赖：运行时全局 U / Services / App（由 app.js 提供）；路由仍走 app.js 的 pageHelp()
 * ========================================================================= */
(function () {
  "use strict";
  const $ = U.qs;
  const $$ = U.qsa;   // 与 app.js 内部别名一致
async function pageHelp() {
  document.title = "使用指南 · IT面试题库";
  const toc = [
    ["quick", "🚀 快速上手"], ["find", "🔍 找题与浏览"], ["panorama", "🌐 题库全景图"],
    ["roadmap", "🗺️ 刷题计划"], ["docs", "📘 技术教程"],
    ["daily", "📚 日常学习"], ["review", "🔁 复习与错题"], ["mock", "🎙️ 模拟面试"],
    ["account", "👤 账号与数据"], ["share", "📤 分享"], ["submit", "📥 投稿与审核"], ["admin", "🛠️ 管理员"],
    ["faq", "❓ 常见问题"],
  ];
  const sec = (id, title, body) => `<div class="card g-sec" id="help-${id}" style="margin-top:14px"><h2 style="font-size:16px;margin-bottom:10px">${title}</h2>${body}</div>`;
  const NB = `<span style="flex:none;margin-left:6px;font-size:10px;line-height:1;padding:2px 6px;border-radius:99px;background:#fee2e2;color:#dc2626;font-weight:700;letter-spacing:.03em" title="20261005a 新增功能">NEW</span>`;
  const li = (t, d, isNew) => `<div class="g-li" style="display:flex;gap:8px;padding:5px 0;line-height:1.65"><span style="flex:none">•</span><span><b>${t}</b>${isNew ? NB : ""}${d ? `<span class="muted"> —— ${d}</span>` : ""}</span></div>`;
  /* —— 动图演示（20261005b）：纯 CSS 逐步高亮动画，零图片资源、离线可用 —— */
  const demo = (caption, steps, period) => {
    const n = steps.length, cls = n <= 3 ? "g-dstep3" : "g-dstep5";
    const pills = steps.map((s, i) =>
      `<span class="g-dstep ${cls}" style="animation-delay:${(i * period / n).toFixed(2)}s">${i + 1}. ${U.esc(s)}</span>`).join("");
    return `<div style="margin:10px 0 4px;padding:12px 12px 10px;border:1px dashed var(--border,#cbd5e1);border-radius:10px;background:var(--bg,#f8fafc)">
      <div style="font-size:11px;font-weight:600;color:var(--muted,#64748b);letter-spacing:.06em;margin-bottom:8px">▶ 动图演示 · ${U.esc(caption)}（自动循环播放）</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${pills}</div>
      <div style="height:3px;border-radius:99px;background:var(--border,#e2e8f0);margin-top:10px;overflow:hidden"><div class="g-dbar" style="--gperiod:${period}s"></div></div>
    </div>`;
  };
  /* 教程方向数与篇数从 window.DOCS 实时计算：以后增删章节不必再手改这段文案 */
  const docsCover = (() => {
    const dirs = ((window.DOCS || {}).dirs || []).filter(Boolean);
    if (!dirs.length) return "按「技术方向 × 初级 / 中级 / 高级」组织的成套教程";
    const cnt = (d) => (d.levels || []).reduce((a, l) => a + (l.chapters || []).length, 0);
    const total = dirs.reduce((a, d) => a + cnt(d), 0);
    const lvCount = (dirs[0].levels || []).length;
    const parts = dirs.map((d) => `${d.name}（${cnt(d)}）`).join("、");
    return `已上线 ${dirs.length} 个技术方向、共 ${total} 篇成套教程：${parts}；每个方向按 ${lvCount} 个级别（初级 → 中级 → 高级）组织，从第一章连续读到最后一章就是一条完整成长路线`;
  })();
  setMain(`
    <style>
      /* 指南内搜索：无匹配行隐藏，区块内全部无匹配时整块隐藏 */
      .g-li.g-hide { display: none !important; }
      .g-sec.g-hide { display: none !important; }
      /* 动图演示：步骤胶囊按周期轮流点亮。注意 @keyframes 选择器不能用 var()，
         故按步骤数预置两套静态关键帧（5 步 / 3 步），时长与错峰由内联动画属性控制 */
      .g-dstep { display:inline-flex;align-items:center;padding:4px 10px;border-radius:99px;border:1px solid var(--border,#cbd5e1);
        background:var(--bg-elevated,#fff);font-size:12px;font-weight:600;color:var(--muted,#64748b); }
      .g-dstep5 { animation: gStep5 var(--gperiod,12s) infinite; }
      .g-dstep3 { animation: gStep3 var(--gperiod,12s) infinite; }
      @keyframes gStep5 {
        0% { color:#fff; background:#2563eb; border-color:#2563eb; box-shadow:0 2px 8px rgba(37,99,235,.35); transform:translateY(-1px); }
        20% { color:var(--muted,#64748b); background:var(--bg-elevated,#fff); border-color:var(--border,#cbd5e1); box-shadow:none; transform:none; }
        100% { color:var(--muted,#64748b); background:var(--bg-elevated,#fff); border-color:var(--border,#cbd5e1); box-shadow:none; transform:none; }
      }
      @keyframes gStep3 {
        0% { color:#fff; background:#10b981; border-color:#10b981; box-shadow:0 2px 8px rgba(16,185,129,.35); transform:translateY(-1px); }
        33.3% { color:var(--muted,#64748b); background:var(--bg-elevated,#fff); border-color:var(--border,#cbd5e1); box-shadow:none; transform:none; }
        100% { color:var(--muted,#64748b); background:var(--bg-elevated,#fff); border-color:var(--border,#cbd5e1); box-shadow:none; transform:none; }
      }
      .g-dbar { width:0; background:linear-gradient(90deg,#2563eb,#10b981); animation: gBarRun var(--gperiod,12s) linear infinite; }
      @keyframes gBarRun { from { width:0 } to { width:100% } }
      @media (prefers-reduced-motion: reduce) { .g-dstep, .g-dbar { animation: none } .g-dbar { width:100% } }
      /* 指南反馈 */
      .g-fb button { cursor:pointer; border:1px solid var(--border,#cbd5e1); background:var(--bg-elevated,#fff);
        border-radius:99px; padding:4px 14px; font-size:13px; }
      .g-fb button:hover { border-color:#2563eb; color:#2563eb; }
    </style>
    <div class="hero" style="padding:28px 16px 20px">
      <h1 style="font-size:22px">📖 使用指南</h1>
      <p>5 分钟了解全部功能。数据存于本机浏览器，登录后云端同步，支持离线使用。</p>
      <div class="hot-tags">${toc.map(([id, label]) => `<span class="tag" style="cursor:pointer" data-go="help-${id}">${label}</span>`).join("")}</div>
      <div style="margin-top:12px;display:flex;gap:8px;align-items:center;max-width:420px">
        <input id="g-search" type="search" placeholder="🔍 在指南内搜索（如：复习、导出、密码）"
          style="flex:1;padding:8px 12px;border-radius:10px;border:1px solid var(--border,#cbd5e1);background:var(--bg-elevated,#fff);color:var(--text,#0f172a);font-size:13px;outline:none" />
      </div>
      <div id="g-search-hint" class="muted" style="font-size:12px;margin-top:6px;display:none"></div>
    </div>
    ${sec("quick", "🚀 快速上手", `
      ${li("打开就能用", "无需注册登录，首次打开自动加载题库，直接刷题")}
      ${li("三种开始方式", "顶部搜索框直接搜 · 「技术体系 / 岗位体系」分类浏览 · 「随机一题」随缘学习")}
      ${li("数据在哪", "学习记录默认存在本机浏览器；注册登录后自动云端同步，换设备不丢")}
      ${li("装到手机桌面", "浏览器菜单选「添加到主屏幕」，之后像 App 一样打开，断网也能刷题")}
      ${li("站点信息在哪", "「关于本站」页有站点与站长介绍、联系入口，以及<b>本机访问计数</b>（只统计你这台设备打开过多少次，不是全站流量）。这类本机统计原先挂在顶栏，现已移到关于页，顶栏更清爽；想看全站访问量请到后台「数据」页")}
      ${li("侧栏分区可折叠", "左侧栏的每个分区标题（投稿 / 导航 / 管理 / 审核 / 站点）都能点击收起或展开；管理、审核、站点默认收起，点标题即可展开，你的选择会自动记住。当前所在页面的分区会被自动展开，不会把自己藏丢")}
    `)}
    ${sec("find", "🔍 找题与浏览", `
      ${li("搜索", "顶栏 / 首页搜索框支持标题、标签、岗位、分类名；输入框聚焦会弹出最近搜索和热门词，边输入还会实时弹出最多 8 条联想建议（带所属分类，点选直达）。手机上顶栏也保留一个放大镜入口，点它直接展开搜索，不必先拉出侧栏", true)}
      ${li("技术体系", "276 个分类的树状目录，逐层展开找题；点开任一分类有「技术全景图」：顶部「架构图 / 分支树」两个按钮可来回切换视图——架构图：重点域配有人工分层架构图，节点与分支树末级均可点击直达分类，薄弱分类橙色标记；分支树：该分类及全部子分类的题量分布树，点节点直达题目列表")}
      ${li("第一性原理必读", "每个技术域的题目列表最前面有一组置顶必读题：这门技术为什么诞生、核心思想是什么、边界在哪——先懂根子再刷细节")}
      ${li("岗位体系", "142 个岗位及细分方向，每个岗位页有必考技术栈、难度分布图和热门题")}
      ${li("题目列表筛选", "按难度、题型、来源筛选，可按最新 / 最热 / AI 评分排序。手机上筛选条件默认收起成一颗「筛选」按钮，点开才展开，让题目更早出现在首屏")}
      ${li("「考到过」标记", "题目详情页有「🎯 考到过」按钮：这场面试真考到这道题就点一下，帮后来的同学判断重点；同一台设备对同一题只计一次，点完按钮变绿显示累计人次", true)}
      ${li("长尾分类", "技术体系树里题量极少（不足 3 题）的细分分类不再单独占行，题目并入父分类列表；父分类展开处会有一行「🔒 另有 N 个小分类」提示", true)}
    `)}
    ${sec("panorama", "🌐 题库全景图", `
      ${li("首页数字可点", "首页的「技术分类 / 题目总数 / 覆盖岗位 / AI 生成题」四个统计数字都能点，分别跳转到对应全景视图")}
      ${li("总览 · 旭日图", "「题目总数」视图用旭日图展示所有题目分布：内圈是 21 个一级技术体系，外圈是细分技术点，色块大小代表题目数量；点击任意色块直达该分类的题目列表")}
      ${li("技术分类 · 思维导图", "「技术分类」视图把 276 个分类按层级展开成树，支持展开/折叠/只看有题目的分类；点击节点查看该分类（含子分类）全部题目")}
      ${li("覆盖岗位 · 岗位树", "「覆盖岗位」视图按「阶段 → 岗位族 → 具体岗位」三级展开，点岗位进岗位题库，快速看清每个方向的题量")}
      ${li("AI 生成题 · 来源透视", "「AI 生成题」视图先看全库来源构成（AI / 人工 / 种子 / 原理整理 / 外部文档 / 其他），再看 AI 生成题按技术分类归组的完整清单")}
    `)}
    ${sec("roadmap", "🗺️ 刷题计划", `
      ${li("这是什么", "侧栏「刷题计划」把每个岗位的题库自动拆成一份 4～8 周的学习计划：先易后难排周次，每周给出要刷的题量、预计小时数和主攻技术点，不用自己规划「先看什么、后看什么」")}
      ${li("怎么用", "挑一个目标岗位（如「Java 后端开发工程师」）点进去，从第 1 周开始按顺序刷。每周都有「▶ 开始本周练习」按钮，直接进入该周的题目池，答完自动记进度")}
      ${li("进度怎么算", "在计划里勾选、或在题目详情页点「已掌握」、或在练习中标记掌握，三处进度实时同步；刷新页面、换设备都不会丢")}
      ${li("每周自检", "每周卡片显示「已掌握 x/y」和进度条；全部掌握后周标题会打勾。一轮走完可以「重置进度」重新开始")}
      ${li("题量不足的岗位", "题库里题量过少（< 20 题）的岗位不会生成计划，避免排不出有意义的周计划；这类岗位建议先按分类浏览")}
    `)}
    ${sec("docs", "📘 技术教程（「学」版块）", `
      ${li("这是什么", "按「技术方向 × 初级 / 中级 / 高级」组织的成套技术教程：一个方向一套教程，从初级第一章按顺序读到高级最后一章，就是一条完整的成长路线。与「刷题计划」的区别是——教程负责「系统地学」，题库和计划负责「练和面」")}
      ${li("怎么进", "侧栏「📘 技术教程」→ 选方向（如「运维 / SRE」）→ 选级别 → 点章节开始读")}
      ${li("顺序阅读", "每章底部有「上一章 / 下一章」，跨级别连续（初级最后一章的下一章就是中级第一章）；读完点「标记本章已学完」，左侧目录会打勾、方向页进度条实时更新")}
      ${li("每篇文档的结构", "开篇「官方文档基线」给出本篇对齐的官方文档（OWASP / RFC / 官方手册等）→ 原理讲解 → 实战案例与代码 → ⚠ 踩坑与经验 → ✅ 自检 / 排障清单（可勾选）→ 📚 延伸阅读。目录骨架取自官方文档，正文按官方目录逐节展开，读完即可与官方文档无缝衔接")}
      ${li("时效提示", "每篇标注「更新 / 适用」版本（如「适用 K8s 1.24+」）。技术文档会过时，请以适用版本为准并结合官方文档核对")}
      ${li("章末挂题", "文档最下方会自动列出本章知识点的练习题，点进去直接刷——学完立刻巩固，不用自己去找题")}
      ${li("进度存在哪", "学习进度记录在本机浏览器（换设备不同步），清除浏览器数据会一并清掉")}
      ${li("内容覆盖", docsCover)}
    `)}
    ${sec("daily", "📚 日常学习", `
      ${li("刷题练习", "选分类 / 岗位 / 难度开一局，支持随机与顺序两种模式")}
      ${li("手机滑动切题", "手机上看题时，右滑回上一题、左滑去下一题（题目详情页与刷题练习页都支持），不用去够底部按钮；手指落在输入框或代码块上时不响应，纵向滚动也不会误触")}
      ${li("底部快捷导航", "手机上屏幕底部固定一排「首页 / 题库 / 刷题 / 错题 / 收藏」，单手就能切换；「错题」上的红色数字角标就是今天到期待复习的题量")}
      ${li("我的批注", "题目详情页可以写下自己的批注（想法、踩过的坑、面试时打算怎么讲）。展开答案时，你自己的话会显示在标准答案上方；错题重练页的复习卡片也会带一行批注摘要。批注只存在你自己的设备上，不会上传到公共题库")}
      ${li("AI 变式训练", "题目详情页点「✨ AI 变式」，AI 把原题改写成 3 道同考点变式（换场景 / 改条件 / 加深追问），先自己答再看参考答案；「没答上」会自动把原题加进错题重练。同一道题全站只生成一次，之后再点秒开（需登录，每天 20 次）")}
      ${li("AI 改卷", "题目详情页点「✍️ AI 改卷」，不看答案写下自己的回答，AI 面试官按正确性 / 完整性 / 表达打 0–100 分，指出缺失点并给一段可背诵的改进版；改完可以再交一次看分数变化（需登录，每天 20 次，作答只存本机）")}
      ${li("键盘快捷键", "电脑上：详情页 ← → 切换上下一题，空格展开 / 收起答案，S 收藏")}
      ${li("今日 5 题", "每天固定 5 道题，做完自动打勾；打开「温故知新」还会混入 3 天前看过但没掌握的题")}
      ${li("学习打卡", "打开网站即打卡，热力图展示最近 35 天；7×5 格子自适应填满卡片宽度、圆角 5px 与卡片风格统一；连续天数看着数字涨很有成就感")}
      ${li("学习周报", "首页底部的周报统计本周刷题数、完成 5 题天数、新增薄弱，带上周环比、每日柱状图和近 8 周对比；薄弱分类可直接点击去刷；达成周目标有彩带庆祝；点「历史」可回看近 26 周的历史周报（存于本机）")}
      ${li("分享周报", "点周报卡片上的「📸 分享周报」生成精美周报图：手机长按发给朋友，电脑复制图片后到微信聊天框 Ctrl+V 粘贴")}
      ${li("首页每日一句", "首页顶部横幅每天自动换一条中文名言（实时来自 Hitokoto，配 LoremFlickr 意境图），当天稳定不跳动；横幅底色与点缀色每天按日历轮换不同配色（靛蓝 / 松石绿 / 紫罗兰 / 玫瑰红等 8 套，分享卡片图同色）；鼠标悬停名言卡片背景图自动放大、移开还原（带过渡动画，系统开启「减少动画」时自动禁用），点「🎲 换一条」随机换一句，点「🖼️ 分享图片」生成带名言的卡片图（下载 / 复制到剪贴板）；接口不可达时自动降级为兜底名言")}
    `)}
    ${sec("review", "🔁 复习与错题（艾宾浩斯记忆曲线）", `
      ${li("怎么进错题本", "刷题或模拟面试中点「不太会 / 不会」，或在题目详情页点「不太会」按钮")}
      ${li("复习节奏", "系统按记忆曲线安排：5 分钟 → 30 分钟 → 12 小时 → 1 天 → 2 天 → 4 天 → 7 天 → 15 天，到期自动提醒")}
      ${li("错题重练页", "「📌 待复习」放到期题，「🕒 已排程」看未来安排；答对点「会了」顺延间隔，答错重新来；点「⚡ AI 闯关」先答 3 道 AI 变式——全对才顺延间隔，任一没答上间隔重置 5 分钟后重来，检验是真会了还是只是眼熟")}
      ${demo("AI 闯关验证真掌握", ["原题自测", "答 AI 变式 ×3", "全对 → 间隔顺延 / 没答上 → 5 分钟后再来"], 12)}
      ${li("复习打卡", "错题重练页顶部有「今日复习进度」条（今天已完成 / 当日任务量），每答一次「会了」（含 AI 闯关成功）记 1 格；右侧 🔥 连续复习 N 天帮你保持节奏，中断一天清零", true)}
      ${li("浏览历史", "按今天 / 昨天 / 本周分组，支持单条删除、关键词搜索；「看过 N 次」多的题往往就是没吃透的题；顶部「重刷历史」一键把看过的题再刷一遍")}
      ${li("状态角标", "历史卡片上的 📅 复习中 = 已在错题本，★ = 已收藏，帮你区分看懂的和没看懂的")}
    `)}
    ${sec("mock", "🎙️ 模拟面试", `
      ${demo("模拟面试完整流程", ["选岗位 + 年限", "系统抽题提问", "自评 掌握/不熟悉/不会", "逐题推进", "生成报告 + 存云端"], 15)}
      ${li("流程", "选岗位 + 工作年限 → 系统抽题逐题提问 → 每题自评「掌握 / 不熟悉 / 不会」→ 生成报告")}
      ${li("报告内容", "掌握率、用时、技术覆盖度；登录后自动存云端，并可看历次成绩趋势对比")}
      ${li("与错题本联动", "标「不熟悉 / 不会」的题自动进错题本，按记忆曲线安排复习")}
    `)}
    ${sec("account", "👤 账号与数据", `
      ${li("注册 / 登录", "邮箱 + 密码即可，密码加密存储；登录后收藏、浏览历史、错题本、今日打卡、面试报告全部云端同步")}
      ${li("修改自己的密码", "「站点 → 账号」页有「修改密码」：填旧密码 + 新密码 + 确认即可。改完本机保持登录，只把其它设备上的登录踢下线")}
      ${li("人机验证", "注册、登录、投稿三个入口会做人机验证（Cloudflare Turnstile）用于挡批量注册与机器人刷稿。正常情况下组件是<b>隐形</b>的、不需要任何点击；只有风控认为可疑时才会浮出一个确认框。若提示「人机验证组件加载失败」，多是网络拦截了验证组件，刷新页面或换网络重试即可；表单里写好的内容不会丢")}
      ${li("换设备", "新设备登录同一账号，学习记录自动合并恢复")}
      ${li("关闭页面也不丢", "关闭标签页时自动兜底上传一次，最大程度保护学习数据")}
      ${li("加密备份", "系统设置里可开启备份密码，本机配置（Token、AI Key 等）加密后存云端，凭密码一键恢复")}
      <div style="margin-top:10px;padding-left:10px;border-left:3px solid #94a3b8;line-height:1.75">
        <div style="font-weight:600">📱 登录提示「邮箱或密码错误」？先用一分钟分清是哪一种</div>
        <div class="muted" style="margin-top:4px">
          注意：<b>「另一台设备能登进去」并不能证明密码是对的</b>。登录成功后浏览器会保存约 30 天的登录凭证，只要没退出，那台设备一直是拿着旧凭证进门、<b>根本没再核对过密码</b>；换成新设备（手机 / 平板）才第一次真正把密码发去比对，问题在这里才暴露。<br>
          ① 在<b>已经能登录的那台电脑</b>上开一个<b>无痕 / 隐私窗口</b>（不会带上已保存的凭证），用同样的邮箱和密码再登一次；<br>
          ② 若<b>无痕窗口同样报错</b> → 说明<b>数据库里存的密码和你正在敲的不是同一个</b>（常见于密码被改过、而自己记的是旧密码）。这种情况反复重打没有用：到「站点 → 账号」页用「修改密码」重设，或请管理员在「帐号管理」里重置；<br>
          ③ 若<b>无痕窗口可以登进去</b> → 那才是输入层面的问题：先删掉系统里本站保存的旧密码（iOS：设置 → 密码；安卓：设置 → 自动填充与密码），再切<b>英文键盘</b>逐字重打，并留意<b>末尾空格</b>与<b>中文全角字符</b>（全角 ａ ≠ 半角 a）；<br>
          ④ 任何情况都先刷新一次页面（右下角出现「有新版本」就点一下）再试，避免旧标签页还跑着旧代码。
        </div>
      </div>
    `)}
    ${sec("share", "📤 分享", `
      ${li("分享卡片", "题目详情页点「分享」，自动生成精美卡片图（标题 + 标签 + 分层答案摘要 + 二维码），排版清晰适合转发")}
      ${li("微信里分享", "微信内点图片放大后长按 → 「发送给朋友」；每道题都有独立分享页：扫码或点开链接直接读完整题目与答案（单步直达），读完后页面底部可一键进入刷题模式")}
        ${li("内容纠错", "发现某题答案有误？详情页点「⚠ 报错」一键反馈，我们会尽快核对修正")}
      ${li("电脑上分享", "点「复制图片」→ 到微信聊天框 Ctrl+V 粘贴发送；或「保存图片」下载卡片后发给朋友。系统分享面板不可用时会自动降级为保存，不会空手而归")}
      ${li("复制链接", "桌面端可直接复制题目链接发给同学同事")}
    `)}
    ${sec("submit", "📥 投稿与审核", `
      ${li("投稿题目", "登录后侧栏「投稿 → 投稿题目」即可向题库投稿：每帐号每天 5 条，先过 AI 质检（判断是否属于本站技术体系 + 质量打分），再由管理员 / 专家人工审核；与 IT 无关的内容累计 3 次会永久禁用投稿，质量类意见只作参考、不记违规")}
      ${li("投稿前查重", "提交时会先在本机比对题库，疑似重复的既有题会一并列给 AI 参考，重复内容不容易过审")}
      ${li("我的投稿", "侧栏「投稿 → 我的投稿」随时查看每条投稿的状态与当日剩余机会；<b>待审核</b>的投稿可以自己点「撤回」收回（一旦有审核者开始处理，状态变成「审核中」就撤不回了，撤回后当日投稿次数不退还）")}
      ${li("审核与入库（管理员 / 专家）", "侧栏「审核 → 投稿审核」处理待审投稿：可以直接改题（原文留档）、查看 AI 质检报告与五维评分；审核通过后进入「站点 → 待入库」，由管理员一键收录进题库（可仅存草稿或直接发布），收录错了还能在「已入库」里撤销")}
      ${li("不能审自己的投稿", "为了避免「自己给自己放行」，审核队列里的<span class=\"kbd\">自己的投稿</span>默认不可操作（专家账号一律如此）。<b>服务器管理员例外</b>：管理员可以审自己的投稿 —— 因为全站可能只有唯一一个管理员，否则其投稿会永久卡在待审队列里没人能处理")}
    `)}
    ${sec("admin", "🛠️ 管理员（可选）", `
      ${li("本地管理员密码", "首次进入管理页设置密码，只保存在当前浏览器，换浏览器需重设；访客完全不需要管这个")}
      ${li("题目管理", "增删改查、直接粘贴截图进题干和答案、标题查重提示")}
      ${li("AI 出题", "配置 API Key 后按分类 / 岗位 / 难度批量生成题目")}
      ${li("批量导入 / 备份", "支持 Excel / CSV / JSON / Markdown 导入；本地数据可加密备份到云端")}
      ${li("发布", "配置 GitHub Token 后，题目改动 10 秒自动发布到线上题库，所有访客同步更新")}
      ${li("帐号管理（服务器端）", "登录后侧栏「站点 → 帐号管理」可查看全部用户、启用 / 禁用，以及给他人重置密码。注意：「重置密码」会清空该用户所有登录状态（用于忘记密码的救急），因此不能对自己使用——系统会拦下并提示你改自己密码请去「账号」页")}
    `)}
    ${sec("faq", "❓ 常见问题", `
      ${li("需要注册吗？", "不需要，打开就能刷；注册只是为了多设备同步学习记录")}
      ${li("别人访问要设管理员密码吗？", "不用，管理员是本地概念，只管「你这个人」能不能编辑题库")}
      ${li("换电脑 / 浏览器数据还在吗？", "登录用户自动恢复；未登录用户的数据只在本机浏览器里，建议注册或用备份功能")}
      ${li("离线能用吗？", "能。安装到主屏幕后断网照常刷题（联网时会自动同步数据）")}
      ${li("页面显示异常 / 数据不对？", "先强制刷新（电脑 Ctrl+Shift+R，手机清一下浏览器缓存）；仍有问题联系管理员")}
      ${li("右下角弹出「有新版本，点击刷新」？", "点一下那个胶囊即可切到最新版，不需要手动清缓存。页面每隔几分钟会自动检查一次更新，看到提示点它就行")}
      ${li("点登录报「连不上服务器」？", "报错里会标注当前页面版本。先按提示刷新一次页面（Ctrl+F5）再试——长时间开着的旧标签页可能还跑着旧代码；仍不行则到「设置 → Cloudflare Worker」点「自动选择可用入口」")}
      ${li("手机端登录总提示「邮箱或密码错误」？", "先别反复重打：见上方「👤 账号与数据」末尾的一分钟判断法——另一台设备「能登」可能只是旧凭证在撑，用无痕窗口即可分清是「密码本身对不上」还是「输入被改了」")}
      ${li("提示「需要管理员权限」？", "说明当前的登录状态已失效（例如密码被重置、账号被禁用，或换了设备）。重新登录一次即可；若反复出现请联系管理员")}
      ${li("题目答案有误？", "欢迎反馈给管理员纠错，题库会持续迭代")}
      ${li("首页题目总数怎么一直在涨？", "题库由自动化流水线持续补题（每周对薄弱分类扩充并全库质检），总数增长属正常；你本地题库会在打开网站时自动同步，无需任何操作")}
      ${li("「考到过」点错了能撤销吗？", "目前不能撤销；同一台设备对同一题只计一次，误点一次对整体参考价值影响极小，可以忽略")}
    `)}
    <div class="g-fb" id="g-feedback" style="margin-top:22px;text-align:center"></div>
    <div class="muted" style="text-align:center;font-size:12px;margin-top:18px">文档最近更新：2026-10-05 · 更详细的开发文档见 GitHub 仓库 README</div>
  `);
  $$("#main .hot-tags .tag").forEach(t => t.onclick = () => {
    const el = document.getElementById(t.dataset.go);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  /* —— 指南内搜索（20261005b）：过滤条目行，区块内全部隐藏时整块收起 —— */
  const norm = s => String(s || "").toLowerCase().replace(/[\s\p{P}\p{S}_]+/gu, "");
  const gInput = $("#g-search"), gHint = $("#g-search-hint");
  if (gInput) {
    let tmr = null;
    gInput.addEventListener("input", () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => {
        const q = norm(gInput.value);
        const secs = $$("#main .g-sec");
        if (!q) {
          secs.forEach(s => { s.classList.remove("g-hide"); s.querySelectorAll(".g-li").forEach(r => r.classList.remove("g-hide")); });
          gHint.style.display = "none";
          return;
        }
        let hits = 0;
        secs.forEach(s => {
          let inSec = 0;
          s.querySelectorAll(".g-li").forEach(r => {
            const ok = norm(r.textContent).indexOf(q) >= 0;
            r.classList.toggle("g-hide", !ok);
            if (ok) inSec++;
          });
          s.classList.toggle("g-hide", inSec === 0);
          hits += inSec;
        });
        gHint.textContent = hits ? `共 ${hits} 条匹配` : "没有匹配的条目，换个词试试（支持标题和正文）";
        gHint.style.display = "block";
      }, 140);
    });
  }
  /* —— 「这篇有帮助吗」（20261005b）：localStorage 记一次，避免重复打扰 —— */
  const fbBox = $("#g-feedback");
  if (fbBox) {
    let saved = null;
    try { saved = localStorage.getItem("guide_fb"); } catch (e) {}
    if (saved === "up" || saved === "down") {
      fbBox.innerHTML = `<span class="muted" style="font-size:13px">${saved === "up" ? "🎉 谢谢反馈！祝面试顺利" : "🙏 收到，我们会持续改进指南"}</span>`;
    } else {
      fbBox.innerHTML = `<span style="font-size:13px;margin-right:10px">这篇指南有帮助吗？</span>
        <button data-fb="up" style="margin-right:8px">👍 有帮助</button><button data-fb="down">🙋 没找到想要的</button>`;
      fbBox.querySelectorAll("button").forEach(b => b.onclick = () => {
        try { localStorage.setItem("guide_fb", b.dataset.fb); } catch (e) {}
        fbBox.innerHTML = `<span class="muted" style="font-size:13px">${b.dataset.fb === "up" ? "🎉 谢谢反馈！祝面试顺利" : "🙏 收到，我们会持续改进指南"}</span>`;
      });
    }
  }
}

/* ============================ 刷题练习 ============================ */

  window.pageHelp = pageHelp;
})();

;/* ===== << js/guide.js ===== */

;/* ===== >> js/docs.js ===== */
/* =========================================================================
 *  js/docs.js — 「学」版块：技术教程（#/docs）
 *
 *  定位：按「方向 × 初级/中级/高级」组织的成套技术教程，按顺序读即可。
 *  与题库的关系：章末按关键词自动挂本知识点的题，学完就能练（学练闭环）。
 *
 *  路由：
 *    #/docs                          方向列表
 *    #/docs/<dir>                    方向页（分级目录 + 进度）
 *    #/docs/<dir>/<level>/<chapter>  阅读页（目录树 + 正文 + 上下章 + 挂题）
 *
 *  依赖：全局 U（utils） / setMain（app.js 暴露） / App.go / DB（可选，用于挂题）
 *  数据：window.DOCS（js/docs-data.js）
 * ========================================================================= */
(function () {
  "use strict";
  const $ = U.qs, $$ = U.qsa;

  /* ---------------- 样式（页面级，不动全局 style.css，避免影响其它页面） ---------------- */
  const CSS = `
.docs-wrap{display:flex;gap:22px;align-items:flex-start}
.docs-toc{flex:none;width:248px;position:sticky;top:74px;max-height:calc(100vh - 110px);overflow:auto;
  background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:12px 10px}
.docs-body{flex:1;min-width:0}
.dt-dir{font-size:14px;font-weight:700;padding:2px 8px 8px;border-bottom:1px solid var(--border);margin-bottom:6px}
.dt-level{font-size:12px;font-weight:700;color:var(--text-muted);padding:10px 8px 4px;display:flex;justify-content:space-between;align-items:center}
.dt-level .dt-cnt{font-weight:600;color:var(--text-secondary)}
.dt-item{display:block;font-size:13px;line-height:1.5;padding:6px 8px;border-radius:6px;color:var(--text-secondary);text-decoration:none;margin:1px 0}
.dt-item:hover{background:var(--bg-hover);color:var(--text)}
.dt-item.active{background:var(--c-primary-50);color:var(--c-primary);font-weight:600}
.dt-item.done{color:var(--c-success)}
.dt-item .dt-ck{flex:none;margin-right:4px}
.docs-dir-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:14px;margin-top:14px}
/* 卡片改 flex 列 + 等高（2026-09-24 评审 P2-17）：描述文字行数不同会让同排卡片高矮不齐，
   进度条位置也跟着飘。现在描述统一截断 3 行、进度条用 margin-top:auto 压到底、卡片吃满行高。 */
.docs-dir-card{background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:16px;
  text-decoration:none;color:inherit;transition:box-shadow .15s,transform .15s;display:flex;flex-direction:column;height:100%}
.docs-dir-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
.docs-dir-card h3{margin:0 0 6px;font-size:16px}
.docs-dir-card p{margin:0;font-size:13px;color:var(--text-secondary);line-height:1.6;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.docs-dir-card .docs-bar{margin-top:auto}
.docs-bar{height:6px;border-radius:999px;background:var(--bg-subtle);overflow:hidden;margin-top:10px}
.docs-bar>i{display:block;height:100%;background:var(--c-primary);border-radius:999px;transition:width .3s}
.lv-card{margin-top:14px}
.lv-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.lv-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.lv-item{display:flex;align-items:center;gap:8px;padding:11px 13px;border:1px solid var(--border);border-radius:var(--radius-sm);
  background:var(--bg-elevated);text-decoration:none;color:inherit;font-size:14px;transition:border-color .15s,background .15s}
.lv-item:hover{border-color:var(--c-primary);background:var(--c-primary-50)}
.lv-item .lv-no{flex:none;width:26px;height:26px;border-radius:50%;background:var(--bg-subtle);color:var(--text-secondary);
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.lv-item.done .lv-no{background:var(--c-success);color:#fff}
.lv-meta{margin-left:auto;font-size:12px;color:var(--text-muted);flex:none}
.doc-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--text-muted);margin:8px 0 4px}
.doc-meta .tag{cursor:default}
.doc-body{font-size:15px;line-height:1.85;color:var(--text)}
.doc-body h2{font-size:18px;margin:24px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.doc-body h3{font-size:15px;margin:18px 0 8px}
.doc-body p{margin:10px 0}
.doc-body ul,.doc-body ol{padding-left:22px;margin:10px 0}
.doc-body li{margin:5px 0}
.doc-body table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13.5px}
.doc-body th,.doc-body td{border:1px solid var(--border);padding:7px 10px;text-align:left}
.doc-body th{background:var(--bg-subtle);font-weight:600}
.doc-body blockquote{margin:12px 0;padding:8px 14px;border-left:3px solid var(--c-warning);background:var(--bg-subtle);color:var(--text-secondary)}
.doc-body code{background:var(--bg-subtle);padding:1px 5px;border-radius:4px;font-size:13px}
.doc-body pre{background:var(--bg-subtle);padding:12px;border-radius:var(--radius-sm);overflow:auto;margin:12px 0}
.doc-body pre code{background:none;padding:0}
.doc-body input[type=checkbox]{margin-right:6px}
.doc-nav{display:flex;gap:10px;justify-content:space-between;margin-top:18px;flex-wrap:wrap}
.doc-nav a{flex:1;min-width:140px;display:block;padding:11px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);
  text-decoration:none;color:inherit;background:var(--bg-elevated);font-size:14px}
.doc-nav a:hover{border-color:var(--c-primary)}
.doc-nav a.next{text-align:right}
.doc-nav .dn-t{display:block;font-size:12px;color:var(--text-muted);margin-bottom:3px}
.doc-done-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)}
.q-mini{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--border);font-size:13.5px;text-decoration:none;color:inherit}
.q-mini:hover{background:var(--bg-hover)}
.q-mini:last-child{border-bottom:none}
@media (max-width:900px){
  .docs-wrap{flex-direction:column}
  .docs-toc{width:100%;position:static;max-height:none}
  .docs-body{width:100%}
}`;

  function ensureCss() {
    if (document.getElementById("docs-style")) return;
    const s = document.createElement("style");
    s.id = "docs-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------------- 进度（本机存储，后续可并入云端同步体系） ---------------- */
  const P_KEY = "docs_progress";
  function progress() {
    try { return JSON.parse(localStorage.getItem(P_KEY) || "{}"); } catch (e) { return {}; }
  }
  function isDone(dirId, lvId, chId) { return !!progress()[dirId + "/" + lvId + "/" + chId]; }
  function toggleDone(dirId, lvId, chId) {
    const p = progress();
    const k = dirId + "/" + lvId + "/" + chId;
    if (p[k]) delete p[k]; else p[k] = Date.now();
    try { localStorage.setItem(P_KEY, JSON.stringify(p)); } catch (e) {}
    return !!p[k];
  }
  function dirStat(dir) {
    let total = 0, done = 0;
    (dir.levels || []).forEach(lv => (lv.chapters || []).forEach(ch => {
      total++; if (isDone(dir.id, lv.id, ch.id)) done++;
    }));
    return { total, done };
  }

  /* ---------------- 数据辅助 ---------------- */
  function flat(dir) {
    const out = [];
    (dir.levels || []).forEach(lv => (lv.chapters || []).forEach(ch => out.push({ lv, ch })));
    return out;
  }
  function findDir(id) { return (window.DOCS.dirs || []).find(d => d.id === id) || null; }
  function findChapter(dir, lvId, chId) {
    const lv = (dir.levels || []).find(l => l.id === lvId);
    if (!lv) return null;
    const ch = (lv.chapters || []).find(c => c.id === chId);
    return ch ? { lv, ch } : null;
  }

  /* ============================ 页面一：方向列表 ============================ */
  /* ============================ 数据就绪守卫（2026-10-06） ============================
     这 7 个数据文件（约 547KB gzip）已从 index.html 的阻塞 script 移到
     docs-loader.js 按需加载（见该文件注释）。所以进页面时window.DOCS
     很可能还没到——它由 docs-loader 在空闲时预热，或由下面的守卫现场拉取。

     无论走哪条路，用户看到的都是同一份数据；差异只是「首次点击多等一瞬」。
     加载失败（离线且无缓存）时给出可重试的提示，而不是白屏或报未找到方向。 */
  async function ensureDocs() {
    if (window.DOCS && Array.isArray(window.DOCS.dirs) && window.DOCS.dirs.filter(Boolean).length) return true;
    if (window.DocsLoader && window.DocsLoader.load) {
      try { await window.DocsLoader.load(); } catch (_) {}
    }
    return !!(window.DOCS && Array.isArray(window.DOCS.dirs) && window.DOCS.dirs.filter(Boolean).length);
  }

  function docsLoadFailHtml(retryHref) {
    return `<div class="empty" style="text-align:center;padding:48px 20px">
      <div style="font-size:15px;color:var(--text-secondary)">技术教程内容加载失败</div>
      <div class="muted" style="margin-top:8px;font-size:13px">请检查网络后重试；若已离线，请先打开一次首页让浏览器完成缓存。</div>
      <a class="btn btn-primary" style="margin-top:16px" href="${retryHref || "#/docs"}">重新加载</a>
    </div>`;
  }

  /* pageDocsDir / pageDocsChapter 会修改学习进度（写 IndexedDB），故仍要保留 async 签名 */
  async function pageDocs() {
    ensureCss();
    document.title = "技术教程 · IT面试题库";
    if (!(await ensureDocs())) { setMain(docsLoadFailHtml()); return; }
    const dirs = (window.DOCS.dirs || []).filter(Boolean);
    /* 页脚的方向数/篇数从数据实时统计，避免增删章节后文案不同步 */
    const allChapters = dirs.reduce((a, d) => a + dirStat(d).total, 0);
    const allDirs = dirs;
    setMain(`
      <div class="hero" style="padding:26px 16px 18px">
        <h1 style="font-size:22px">📘 技术教程</h1>
        <p>按「技术方向 × 初级 / 中级 / 高级」组织的成套文档，<b>目录骨架取自官方文档</b>（OWASP、RFC、Docker / K8s / Terraform 官方文档、MySQL / Redis 手册、MDN、Oracle / Spring 参考等），按官方目录逐节展开讲解。
           每篇开头的「官方文档基线」告诉你可以对照哪份权威文档；实战案例与踩坑记录来自真实现场，读完记得做章末的练习题巩固。</p>
      </div>
      <div class="docs-dir-grid">
        ${dirs.map(d => {
          const st = dirStat(d);
          const pct = st.total ? Math.round(st.done / st.total * 100) : 0;
          const chs = flat(d).filter(x => x.ch.body);
          return `
          <a class="docs-dir-card" href="#/docs/${d.id}">
            <h3>${d.icon || "📄"} ${U.esc(d.name)}${d.skeleton ? ' <span class="tag" style="font-size:11px">建设中</span>' : ""}</h3>
            <p>${U.esc(d.desc || "")}</p>
            <div class="doc-meta" style="margin-top:10px">
              <span class="tag">${d.levels.length} 个级别</span>
              <span class="tag">${st.total} 章</span>
              <!-- 「N 篇已上线」只在尚未全部上线时才有信息量（2026-09-24 评审 P2-17）：
                   全部上线时它会和「N 章」完全同值，同一张卡上写两遍同一个数字。 -->
              ${chs.length < st.total ? `<span class="tag">${chs.length} 篇已上线</span>` : ""}
            </div>
            <div class="docs-bar"><i style="width:${pct}%"></i></div>
            <div class="muted" style="font-size:12px;margin-top:6px">学习进度 ${st.done}/${st.total}${pct ? `（${pct}%）` : ""}</div>
          </a>`;
        }).join("")}
      </div>
      <div class="muted" style="text-align:center;font-size:12px;margin-top:20px">
        文档最近更新：${U.esc(window.DOCS.updated || "")} · 当前 ${allDirs.length} 个技术方向、${allChapters} 篇教程已全部上线；学习进度会随阅读自动累积
      </div>
    `);
  }

  /* ============================ 页面二：方向页（分级目录） ============================ */
  async function pageDocsDir(dirId) {
    ensureCss();
    if (!(await ensureDocs())) { setMain(docsLoadFailHtml(`#/docs/${dirId}`)); return; }
    const dir = findDir(dirId);
    if (!dir) { setMain(`<div class="empty">未找到该方向</div>`); return; }
    document.title = dir.name + " · 技术教程";
    const st = dirStat(dir);
    const pct = st.total ? Math.round(st.done / st.total * 100) : 0;

    setMain(`
      <div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><a href="#/docs">技术教程</a><span class="sep">/</span><span>${U.esc(dir.name)}</span></div>
      <div class="hero" style="padding:20px 16px 16px">
        <h1 style="font-size:20px">${dir.icon || "📄"} ${U.esc(dir.name)}</h1>
        <p>${U.esc(dir.desc || "")}</p>
        <div class="docs-bar" style="max-width:420px"><i style="width:${pct}%"></i></div>
        <div class="muted" style="font-size:12px;margin-top:6px">总进度 ${st.done}/${st.total}（${pct}%）· 建议按 初级 → 中级 → 高级 顺序阅读</div>
      </div>
      ${dir.levels.map(lv => {
        const done = lv.chapters.filter(c => isDone(dir.id, lv.id, c.id)).length;
        return `
        <div class="card lv-card">
          <div class="lv-head">
            <h2 style="font-size:16px;margin:0">${U.esc(lv.name)}</h2>
            <span class="tag">${done}/${lv.chapters.length}</span>
            <span class="muted" style="font-size:13px">${U.esc(lv.desc || "")}</span>
          </div>
          <div class="lv-list">
            ${lv.chapters.map((c, i) => {
              const d = isDone(dir.id, lv.id, c.id);
              return `
              <a class="lv-item${d ? " done" : ""}" href="#/docs/${dir.id}/${lv.id}/${c.id}">
                <span class="lv-no">${d ? "✓" : (i + 1)}</span>
                <span style="min-width:0;overflow:hidden;text-overflow:ellipsis">${U.esc(c.title)}</span>
                <span class="lv-meta">${c.body ? (c.minutes ? c.minutes + " 分钟" : "可读") : "待写"}</span>
              </a>`;
            }).join("")}
          </div>
        </div>`;
      }).join("")}
    `);
  }

  /* ============================ 页面三：阅读页 ============================ */
  async function pageDocsChapter(dirId, lvId, chId) {
    ensureCss();
    if (!(await ensureDocs())) { setMain(docsLoadFailHtml(`#/docs/${dirId}/${lvId}/${chId}`)); return; }
    const dir = findDir(dirId);
    if (!dir) { setMain(`<div class="empty">未找到该方向</div>`); return; }
    const hit = findChapter(dir, lvId, chId);
    if (!hit) { setMain(`<div class="empty">未找到该章节</div>`); return; }
    const { lv, ch } = hit;

    const list = flat(dir);
    const idx = list.findIndex(x => x.lv.id === lv.id && x.ch.id === ch.id);
    const prev = idx > 0 ? list[idx - 1] : null;
    const next = idx < list.length - 1 ? list[idx + 1] : null;
    const done = isDone(dirId, lvId, chId);
    document.title = ch.title + " · " + dir.name;

    const toc = `
      <div class="docs-toc">
        <div class="dt-dir">${dir.icon || "📄"} ${U.esc(dir.name)}</div>
        ${dir.levels.map(l => `
          <div class="dt-level"><span>${U.esc(l.name)}</span><span class="dt-cnt">${l.chapters.filter(c => isDone(dir.id, l.id, c.id)).length}/${l.chapters.length}</span></div>
          ${l.chapters.map(c => {
            const active = (l.id === lv.id && c.id === ch.id);
            const d = isDone(dir.id, l.id, c.id);
            return `<a class="dt-item${active ? " active" : ""}${d ? " done" : ""}" href="#/docs/${dir.id}/${l.id}/${c.id}">${d ? "✓ " : ""}${U.esc(c.title)}</a>`;
          }).join("")}
        `).join("")}
      </div>`;

    const bodyHtml = ch.body
      ? `<div class="doc-body">${U.md(ch.body)}</div>`
      : `<div class="empty" style="padding:40px 0"><div class="em-ic">✍️</div><h3>内容建设中</h3>
           <p>这一章的目录已规划，正文正在整理。可以先看同级的其它章节，或去「技术体系」里刷这个方向的题。</p>
           <a class="btn btn-primary" href="#/docs/${dir.id}">返回目录</a></div>`;

    setMain(`
      <div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><a href="#/docs">技术教程</a><span class="sep">/</span>
        <a href="#/docs/${dir.id}">${U.esc(dir.name)}</a><span class="sep">/</span><span>${U.esc(lv.name)}</span></div>
      <div class="docs-wrap">
        ${toc}
        <div class="docs-body">
          <div class="card">
            <h1 style="font-size:20px;margin:0">${U.esc(ch.title)}</h1>
            <div class="doc-meta">
              <span class="tag">${U.esc(lv.name)}</span>
              ${ch.minutes ? `<span class="tag">约 ${ch.minutes} 分钟</span>` : ""}
              ${ch.updated ? `<span class="tag">更新 ${U.esc(ch.updated)}</span>` : ""}
              ${ch.applies ? `<span class="tag">适用 ${U.esc(ch.applies)}</span>` : ""}
              ${(ch.tags || []).map(t => `<span class="tag">${U.esc(t)}</span>`).join("")}
            </div>
            ${ch.body ? `<div style="font-size:13px;color:var(--text-muted);margin-bottom:6px">⚠ 技术文档会过时，请以「适用版本」为准，并结合官方文档核对。</div>` : ""}
            ${bodyHtml}
            <div class="doc-done-bar">
              <button class="btn ${done ? "" : "btn-primary"}" id="doc-done">${done ? "✓ 已学完（点击取消）" : "标记本章已学完"}</button>
              ${next ? `<a class="btn" href="#/docs/${dir.id}/${next.lv.id}/${next.ch.id}">继续下一章 →</a>` : `<span class="muted" style="font-size:13px">🎉 本方向已读到最后一章</span>`}
            </div>
          </div>
          <div class="doc-nav">
            ${prev ? `<a href="#/docs/${dir.id}/${prev.lv.id}/${prev.ch.id}"><span class="dn-t">← 上一章（${U.esc(prev.lv.name)}）</span>${U.esc(prev.ch.title)}</a>`
                   : `<a style="opacity:.5;pointer-events:none"><span class="dn-t">← 上一章</span>已经是第一章</a>`}
            ${next ? `<a class="next" href="#/docs/${dir.id}/${next.lv.id}/${next.ch.id}"><span class="dn-t">下一章（${U.esc(next.lv.name)}）→</span>${U.esc(next.ch.title)}</a>`
                   : `<a class="next" style="opacity:.5;pointer-events:none"><span class="dn-t">下一章 →</span>已经是最后一章</a>`}
          </div>
          <div class="card" id="doc-qs" style="margin-top:14px${ch.body ? "" : ";display:none"}">
            <h3 style="font-size:15px;margin:0 0 8px">🎯 本章相关练习</h3>
            <div id="doc-qs-body"><div class="muted" style="font-size:13px">加载中…</div></div>
          </div>
        </div>
      </div>
    `);

    /* 标记已学完 */
    const btn = $("#doc-done");
    if (btn) btn.onclick = () => {
      const now = toggleDone(dirId, lvId, chId);
      btn.textContent = now ? "✓ 已学完（点击取消）" : "标记本章已学完";
      btn.className = "btn" + (now ? "" : " btn-primary");
      if (window.U && U.toast) U.toast(now ? "已标记学完，进度已记录" : "已取消标记", "info");
      /* 左侧目录与进度同步刷新（不整页重载，保住阅读位置） */
      const tocEl = document.querySelector(".docs-toc");
      if (tocEl) {
        tocEl.querySelectorAll(".dt-item").forEach(a => {
          const m = a.getAttribute("href").match(/^#\/docs\/[^/]+\/[^/]+\/(.+)$/);
          if (m && m[1] === chId) { a.classList.toggle("done", now); a.textContent = (now ? "✓ " : "") + ch.title; }
        });
        dir.levels.forEach(l => {
          const cnt = l.chapters.filter(c => isDone(dir.id, l.id, c.id)).length;
          const els = tocEl.querySelectorAll(".dt-level");
          for (const e of els) if (e.firstElementChild && e.firstElementChild.textContent === l.name) e.querySelector(".dt-cnt").textContent = cnt + "/" + l.chapters.length;
        });
      }
    };

    /* 章末挂题：按关键词匹配题库标题 */
    if (ch.body && (ch.terms || []).length) await renderQuestions(ch);
  }

  async function renderQuestions(ch) {
    const box = $("#doc-qs-body");
    if (!box) return;
    try {
      if (!window.DB || !DB.db || !DB.db.questions) throw new Error("no db");
      const all = await DB.db.questions.toArray();
      const terms = (ch.terms || []).filter(Boolean);
      const hits = all.filter(q => {
        const t = (q.title || "");
        return terms.some(k => t.indexOf(k) >= 0);
      }).slice(0, 6);
      if (!hits.length) {
        box.innerHTML = `<div class="muted" style="font-size:13px">题库中暂无本章相关的题，可到「技术体系」里按分类浏览。</div>`;
        return;
      }
      box.innerHTML = hits.map(q => `
        <a class="q-mini" href="#/question/${q.id}">
          <span style="flex:none">📝</span>
          <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.esc(q.title)}</span>
          <span class="tag" style="margin-left:auto;flex:none">${U.esc(q.difficulty || "—")}</span>
        </a>`).join("");
    } catch (e) {
      box.innerHTML = `<div class="muted" style="font-size:13px">练习题暂不可用（题库未加载完成）。</div>`;
    }
  }

  window.pageDocs = pageDocs;
  window.pageDocsDir = pageDocsDir;
  window.pageDocsChapter = pageDocsChapter;
})();

;/* ===== << js/docs.js ===== */

;/* ===== >> js/festival.js ===== */
/* ============================================================
 * 节日背景自动切换（js/festival.js）
 * - 按当天日期在 <html> 上设置 data-festival="key"，配合 css/festival.css 生效
 * - 纯 CSS 渐变背景，无图片资源；明暗主题各有配色
 * - 左下角显示一个可关闭的小角标（点击 = 本次关闭并记住）
 * - 重新开启：localStorage.removeItem('iti_festival') 后刷新
 * - 农历节日（春节/元宵/端午/七夕/中秋/重阳）按公历日期表映射，覆盖 2026-2028；
 *   表外年份农历节日自动跳过，公历节日不受影响
 * 依赖：无（原生 JS，幂等，可重复执行）
 * ============================================================ */
(function () {
  "use strict";
  var LS_KEY = "iti_festival";

  /* 节日表：数组顺序即优先级（中秋排在国庆前，2028 年重叠时优先中秋） */
  var FESTIVALS = [
    /* ---- 农历节日（公历映射，2026-2028）---- */
    { key: "spring",     name: "春节",       dot: "#dc2626",
      ranges: [["2026-02-16", "2026-02-23"], ["2027-02-05", "2027-02-12"], ["2028-01-25", "2028-02-01"]] },
    { key: "lantern",    name: "元宵节",     dot: "#f43f5e",
      dates: ["2026-03-03", "2027-02-20", "2028-02-09"] },
    { key: "dragonboat", name: "端午节",     dot: "#059669",
      dates: ["2026-06-19", "2027-06-09", "2028-05-28"] },
    { key: "qixi",       name: "七夕",       dot: "#ec4899",
      dates: ["2026-08-19", "2027-08-08", "2028-08-26"] },
    { key: "midautumn",  name: "中秋节",     dot: "#d97706",
      dates: ["2026-09-25", "2027-09-15", "2028-10-03"] },
    { key: "double9",    name: "重阳节",     dot: "#ca8a04",
      dates: ["2026-10-18", "2027-10-08", "2028-10-27"] },
    /* ---- 公历节日（每年固定）---- */
    { key: "newyear",     name: "元旦",      dot: "#2563eb", md: [["01-01", "01-03"]] },
    { key: "qingming",    name: "清明",      dot: "#10b981", md: [["04-04", "04-06"]] },
    { key: "labor",       name: "劳动节",    dot: "#f97316", md: [["05-01", "05-05"]] },
    { key: "children",    name: "儿童节",    dot: "#ec4899", md: [["06-01", "06-01"]] },
    { key: "teachers",    name: "教师节",    dot: "#f59e0b", md: [["09-10", "09-10"]] },
    { key: "national",    name: "国庆节",    dot: "#dc2626", md: [["10-01", "10-07"]] },
    { key: "programmers", name: "程序员节",  dot: "#16a34a", md: [["10-24", "10-24"]] },
    { key: "christmas",   name: "圣诞节",    dot: "#15803d", md: [["12-24", "12-25"]] }
  ];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  /* 本地时区的 YYYY-MM-DD */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function todayMD() { return todayISO().slice(5); }

  function inRanges(iso, ranges) {
    for (var i = 0; i < ranges.length; i++) {
      if (iso >= ranges[i][0] && iso <= ranges[i][1]) return true;
    }
    return false;
  }
  function inDates(iso, dates) { return dates.indexOf(iso) !== -1; }
  function inMD(md, mds) {
    for (var i = 0; i < mds.length; i++) {
      if (md >= mds[i][0] && md <= mds[i][1]) return true;
    }
    return false;
  }

  function matchFestival(iso) {
    var md = iso.slice(5);
    for (var i = 0; i < FESTIVALS.length; i++) {
      var f = FESTIVALS[i];
      if ((f.ranges && inRanges(iso, f.ranges)) ||
          (f.dates && inDates(iso, f.dates)) ||
          (f.md && inMD(md, f.md))) {
        return f;
      }
    }
    return null;
  }

  function removeBadge() {
    var el = document.getElementById("festival-badge");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function renderBadge(f) {
    var el = document.getElementById("festival-badge");
    if (!el) {
      el = document.createElement("button");
      el.id = "festival-badge";
      el.type = "button";
      el.title = "今天是「" + f.name + "」，已自动换上节日背景。点击关闭（可随时在设置里重新打开）";
      document.body.appendChild(el);
      el.addEventListener("click", function () {
        try { localStorage.setItem(LS_KEY, "off"); } catch (e) {}
        document.documentElement.removeAttribute("data-festival");
        removeBadge();
      });
    }
    el.innerHTML = '<span class="f-dot" style="background:' + f.dot + '"></span><span>' + f.name + '</span>';
  }

  function apply() {
    var root = document.documentElement;
    var off = false;
    try { off = localStorage.getItem(LS_KEY) === "off"; } catch (e) {}

    var f = matchFestival(todayISO());
    if (off || !f) {
      root.removeAttribute("data-festival");
      removeBadge();
      return;
    }
    if (root.getAttribute("data-festival") !== f.key) {
      root.setAttribute("data-festival", f.key);
    }
    renderBadge(f);
  }

  /* 导出（调试/设置页可用）：FestivalBG.apply() / FestivalBG.today() */
  window.FestivalBG = { apply: apply, today: function () { return matchFestival(todayISO()); } };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();

;/* ===== << js/festival.js ===== */

;/* ===== >> js/importexport.js ===== */
/* =========================================================================
 *  importexport.js  —  批量导入 / 备份导出 / 恢复
 * ========================================================================= */
(function () {
  "use strict";
  const IE = {};
  const db = DB.db;
  const DIFFS = ["初级", "中级", "高级", "专家"];
  const TYPES = ["单选题", "多选题", "判断题", "填空题", "简答题", "编程题", "场景题", "故障排查题", "系统设计题", "开放讨论题"];

  const ALIAS = {
    title: ["题目标题", "标题", "title", "name"],
    body: ["题目内容", "题目正文", "题目", "body", "content", "question"],
    answer: ["参考答案", "答案", "answer", "solution"],
    c1: ["一级技术分类", "一级分类", "技术分类1", "category1", "cat1"],
    c2: ["二级技术分类", "二级分类", "技术分类2", "category2", "cat2"],
    c3: ["三级技术分类", "三级分类", "技术分类3", "category3", "cat3"],
    difficulty: ["难度", "difficulty", "level"],
    type: ["题型", "type"],
    positions: ["适用岗位", "岗位", "positions", "jobs"],
    years: ["工作年限", "年限", "years", "experience"],
    tags: ["技术标签", "标签", "tags", "labels"],
    status: ["状态", "status"],
    remark: ["管理员备注", "备注", "remark", "note"]
  };
  function matchKey(header) {
    const h = (header || "").trim().toLowerCase();
    for (const k in ALIAS) if (ALIAS[k].some(a => a.toLowerCase() === h)) return k;
    return null;
  }

  /* 读取文件 -> {headers, rows} */
  IE.parseFile = function (file) {
    return new Promise((resolve, reject) => {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("读取文件失败"));
      reader.onload = async (e) => {
        try {
          const buf = e.target.result;
          if (ext === "json") {
            const text = typeof buf === "string" ? buf : new TextDecoder().decode(buf);
            const j = JSON.parse(text);
            resolve({ kind: "json", raw: j });
          } else if (ext === "csv") {
            const text = typeof buf === "string" ? buf : new TextDecoder().decode(buf);
            resolve({ kind: "csv", ...csvToRows(text) });
          } else if (ext === "xlsx" || ext === "xls") {
            await U.loadScript("XLSX", U.XLSX_URL); /* xlsx 库按需加载 */
            const wb = XLSX.read(buf, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
            const headers = rows.length ? Object.keys(rows[0]) : [];
            resolve({ kind: "excel", headers, rows });
          } else if (ext === "md" || ext === "txt") {
            const text = typeof buf === "string" ? buf : new TextDecoder().decode(buf);
            resolve({ kind: "md", raw: text });
          } else {
            reject(new Error("不支持的文件格式：" + ext));
          }
        } catch (err) { reject(err); }
      };
      if (ext === "json" || ext === "csv" || ext === "md" || ext === "txt") reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    });
  };

  function csvToRows(text) {
    const lines = text.split(/\r?\n/).filter(l => l.length);
    if (!lines.length) return { headers: [], rows: [] };
    const split = (line) => {
      const out = []; let cur = "", q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
        else if (ch === "," && !q) { out.push(cur); cur = ""; }
        else cur += ch;
      }
      out.push(cur); return out;
    };
    const headers = split(lines[0]).map(h => h.trim());
    const rows = lines.slice(1).map(l => { const c = split(l); const o = {}; headers.forEach((h, i) => o[h] = (c[i] || "").trim()); return o; });
    return { headers, rows };
  }

  IE.autoMap = function (headers) {
    const map = {};
    headers.forEach(h => { const k = matchKey(h); if (k && !map[k]) map[k] = h; });
    return map;
  };

  function resolveCat(c1, c2, c3) {
    const nameToCat = new Map(); Services.categories.forEach(c => nameToCat.set(c.name, c.id));
    const tryName = (n) => n && nameToCat.get(n.trim());
    return tryName(c3) || tryName(c2) || tryName(c1) || null;
  }
  function splitList(s) { return (s || "").split(/[,，、]/).map(x => x.trim()).filter(Boolean); }

  IE.buildRecord = function (row, map) {
    const get = k => (map[k] ? (row[map[k]] || "") : "");
    const diff = get("difficulty").trim();
    const type = get("type").trim();
    const status = get("status").trim() || "published";
    const c1 = get("c1"), c2 = get("c2"), c3 = get("c3");
    const categoryId = resolveCat(c1, c2, c3);
    const posNames = splitList(get("positions"));
    const tags = splitList(get("tags"));
    const errors = [];
    if (!get("title")) errors.push("题目标题为空");
    if (DIFFS.indexOf(diff) < 0 && diff) errors.push("难度非法：" + diff);
    if (TYPES.indexOf(type) < 0 && type) errors.push("题型非法：" + type);
    if (["published", "draft", "offline"].indexOf(status) < 0) errors.push("状态非法：" + status);
    return {
      ok: errors.length === 0,
      errors,
      data: {
        categoryId,
        title: get("title").trim(),
        body: get("body"),
        answer: get("answer"),
        difficulty: DIFFS.indexOf(diff) >= 0 ? diff : "中级",
        type: TYPES.indexOf(type) >= 0 ? type : "简答题",
        positionNames: posNames,
        years: get("years").trim(),
        tags: tags,
        status: ["published", "draft", "offline"].indexOf(status) >= 0 ? status : "published",
        remark: get("remark"),
        source: "import"
      }
    };
  };

  IE.importRows = async function (rows, map, opts) {
    opts = opts || {};
    let success = 0, fail = 0, skip = 0;
    const errors = [];
    const seen = new Set();
    for (let i = 0; i < rows.length; i++) {
      const r = IE.buildRecord(rows[i], map);
      if (!r.ok) { fail++; errors.push("第" + (i + 2) + "行：" + r.errors.join("；")); continue; }
      const title = r.data.title;
      const dup = await db.questions.where("title").equals(title).first();
      if (dup) {
        if (opts.dup === "skip") { skip++; continue; }
        if (opts.dup === "overwrite") { await db.questions.update(dup.id, r.data); success++; continue; }
        // new
      }
      await db.questions.add(Object.assign({ createdAt: Date.now(), updatedAt: Date.now(), views: 0, favorites: 0, aiScore: 0, positionIds: [], relatedIds: [] }, r.data));
      success++;
    }
    await Services.reload();
    return { success, fail, skip, errors: errors.slice(0, 50) };
  };

  /* 备份导出 */
  IE.exportBackup = async function () {
    const [categories, positions, positionSkills, questions, versions, favorites, histories, aiLogs, importLogs] = await Promise.all([
      db.categories.toArray(), db.positions.toArray(), db.positionSkills.toArray(), db.questions.toArray(),
      db.questionVersions.toArray(), db.favorites.toArray(), db.histories.toArray(),
      db.aiGenerateLogs.toArray(), db.importLogs.toArray()
    ]);
    const payload = {
      app: "it-interview-hub", version: 1, exportedAt: Date.now(),
      categories, positions, positionSkills, questions, questionVersions: versions,
      favorites, histories, aiGenerateLogs: aiLogs, importLogs
    };
    const d = new Date();
    const p = n => (n < 10 ? "0" + n : n);
    const name = `it-interview-bank-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.json`;
    U.download(name, JSON.stringify(payload, null, 2), "application/json");
    await db.backups.add({ name, type: "full", size: JSON.stringify(payload).length, createdAt: Date.now() });
    return name;
  };

  IE.exportExcel = async function () {
    await U.loadScript("XLSX", U.XLSX_URL); /* xlsx 库按需加载 */
    const qs = Services.questions;
    /* Excel 单元格上限 32767 字符：内嵌 base64 图片的答案会超限，截断并标注（完整数据走 JSON 备份） */
    const clip = v => typeof v === "string" && v.length > 32000 ? v.slice(0, 32000) + "\n…（内容过长已截断，图片等完整数据请用 JSON 导出）" : v;
    const rows = qs.map(q => ({
      "题目标题": clip(q.title), "题目内容": clip(q.body), "参考答案": clip(q.answer),
      "一级技术分类": (q.catPath && q.catPath[0]) || "", "二级技术分类": (q.catPath && q.catPath[1]) || "",
      "三级技术分类": (q.catPath && q.catPath[2]) || "", "难度": q.difficulty, "题型": q.type,
      "适用岗位": (q.positionNames || []).join(","), "工作年限": q.years, "技术标签": (q.tags || []).join(","),
      "状态": q.status, "管理员备注": q.remark || ""
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "题目");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    U.download("it-interview-questions.xlsx", new Blob([out]), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  };

  IE.exportMarkdown = async function () {
    const tree = Services.categoryTree();
    let md = "# IT面试题库导出\n\n";
    const walk = (nodes, level) => {
      nodes.forEach(c => {
        md += `${"#".repeat(level + 2)} ${c.name}（${c.count}）\n\n`;
        const qs = Services.questions.filter(q => q.categoryId === c.id);
        qs.forEach(q => {
          md += `## ${q.title}\n\n- 难度：${q.difficulty}　题型：${q.type}　来源：${q.source}\n- 标签：${(q.tags || []).join(", ")}\n- 岗位：${(q.positionNames || []).join(", ")}\n\n**题目**\n\n${q.body}\n\n**参考答案**\n\n${q.answer}\n\n---\n\n`;
        });
        if (c.children && c.children.length) walk(c.children, level + 1);
      });
    };
    walk(tree, 0);
    U.download("it-interview-questions.md", md, "text/markdown");
  };

  /* 恢复备份 */
  IE.parseBackup = function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("读取失败"));
      reader.onload = (e) => {
        try {
          const text = new TextDecoder().decode(e.target.result);
          const j = JSON.parse(text);
          if (!j.app && !j.categories && !j.questions) throw new Error("不是有效的备份文件");
          resolve(j);
        } catch (err) { reject(new Error("备份文件格式验证失败，无法读取：" + err.message)); }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  IE.restore = async function (payload, mode) {
    if (mode === "overwrite") {
      await Promise.all([db.categories.clear(), db.positions.clear(), db.positionSkills.clear(), db.questions.clear(), db.questionVersions.clear(), db.favorites.clear(), db.histories.clear(), db.aiGenerateLogs.clear(), db.importLogs.clear()]);
    }
    const add = async (table, arr) => { if (Array.isArray(arr)) { for (const r of arr) { delete r.id; await db[table].add(r); } } };
    await add("categories", payload.categories);
    await add("positions", payload.positions);
    await add("positionSkills", payload.positionSkills);
    await add("questions", payload.questions);
    await add("questionVersions", payload.questionVersions);
    await add("favorites", payload.favorites);
    await add("histories", payload.histories);
    await add("aiGenerateLogs", payload.aiGenerateLogs);
    await add("importLogs", payload.importLogs);
    await Services.reload();
  };

  window.IE = IE;
})();

;/* ===== << js/importexport.js ===== */
