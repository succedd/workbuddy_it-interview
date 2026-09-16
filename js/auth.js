/* =========================================================================
 *  auth.js  —  管理员密码哈希（Web Crypto PBKDF2）与登录态
 * ========================================================================= */
(function () {
  "use strict";
  const A = {};

  function bufToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  function hexToBuf(hex) {
    const a = new Uint8Array(hex.length / 2);
    for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16);
    return a.buffer;
  }
  async function derive(password, saltHex) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: hexToBuf(saltHex), iterations: 100000, hash: "SHA-256" },
      keyMaterial, 256
    );
    return bufToHex(bits);
  }

  A.hasAdmin = async function () { return !!(await DB.getSetting("adminHash")); };

  A.setup = async function (password) {
    const salt = bufToHex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await derive(password, salt);
    await DB.setSetting("adminHash", { salt, hash });
  };

  A.verify = async function (password) {
    const rec = await DB.getSetting("adminHash");
    if (!rec) return false;
    const hash = await derive(password, rec.salt);
    return hash === rec.hash;
  };

  A.changePassword = async function (newPassword) { return A.setup(newPassword); };

  /* 登录态用 sessionStorage（关闭网页失效）；提供持久标志可选 localStorage */
  const SKEY = "it_hub_admin";
  A.login = function () { try { sessionStorage.setItem(SKEY, "1"); } catch (e) {} };
  A.logout = function () { try { sessionStorage.removeItem(SKEY); } catch (e) {} };
  A.isAdmin = function () { try { return sessionStorage.getItem(SKEY) === "1"; } catch (e) { return false; } };

  window.Auth = A;
})();
