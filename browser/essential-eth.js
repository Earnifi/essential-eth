//PASTE YOUR CODE ON LINE 7102
(function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;
          if (!f && c) return c(i, !0);
          if (u) return u(i, !0);
          var a = new Error("Cannot find module '" + i + "'");
          throw ((a.code = "MODULE_NOT_FOUND"), a);
        }
        var p = (n[i] = { exports: {} });
        e[i][0].call(
          p.exports,
          function (r) {
            var n = e[i][1][r];
            return o(n || r);
          },
          p,
          p.exports,
          r,
          e,
          n,
          t
        );
      }
      return n[i].exports;
    }
    for (
      var u = "function" == typeof require && require, i = 0;
      i < t.length;
      i++
    )
      o(t[i]);
    return o;
  }
  return r;
})()(
  {
    1: [
      function (require, module, exports) {
        "use strict";
        /*! noble-secp256k1 - MIT License (c) 2019 Paul Miller (paulmillr.com) */
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.utils =
          exports.schnorr =
          exports.verify =
          exports.signSync =
          exports.sign =
          exports.getSharedSecret =
          exports.recoverPublicKey =
          exports.getPublicKey =
          exports.Signature =
          exports.Point =
          exports.CURVE =
            void 0;
        const nodeCrypto = require("crypto");
        const _0n = BigInt(0);
        const _1n = BigInt(1);
        const _2n = BigInt(2);
        const _3n = BigInt(3);
        const _8n = BigInt(8);
        const POW_2_256 = _2n ** BigInt(256);
        const CURVE = {
          a: _0n,
          b: BigInt(7),
          P: POW_2_256 - _2n ** BigInt(32) - BigInt(977),
          n: POW_2_256 - BigInt("432420386565659656852420866394968145599"),
          h: _1n,
          Gx: BigInt(
            "55066263022277343669578718895168534326250603453777594175500187360389116729240"
          ),
          Gy: BigInt(
            "32670510020758816978083085130507043184471273380659243275938904335757337482424"
          ),
          beta: BigInt(
            "0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"
          ),
        };
        exports.CURVE = CURVE;
        function weistrass(x) {
          const { a, b } = CURVE;
          const x2 = mod(x * x);
          const x3 = mod(x2 * x);
          return mod(x3 + a * x + b);
        }
        const USE_ENDOMORPHISM = CURVE.a === _0n;
        class JacobianPoint {
          constructor(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
          }
          static fromAffine(p) {
            if (!(p instanceof Point)) {
              throw new TypeError("JacobianPoint#fromAffine: expected Point");
            }
            return new JacobianPoint(p.x, p.y, _1n);
          }
          static toAffineBatch(points) {
            const toInv = invertBatch(points.map((p) => p.z));
            return points.map((p, i) => p.toAffine(toInv[i]));
          }
          static normalizeZ(points) {
            return JacobianPoint.toAffineBatch(points).map(
              JacobianPoint.fromAffine
            );
          }
          equals(other) {
            if (!(other instanceof JacobianPoint))
              throw new TypeError("JacobianPoint expected");
            const { x: X1, y: Y1, z: Z1 } = this;
            const { x: X2, y: Y2, z: Z2 } = other;
            const Z1Z1 = mod(Z1 ** _2n);
            const Z2Z2 = mod(Z2 ** _2n);
            const U1 = mod(X1 * Z2Z2);
            const U2 = mod(X2 * Z1Z1);
            const S1 = mod(mod(Y1 * Z2) * Z2Z2);
            const S2 = mod(mod(Y2 * Z1) * Z1Z1);
            return U1 === U2 && S1 === S2;
          }
          negate() {
            return new JacobianPoint(this.x, mod(-this.y), this.z);
          }
          double() {
            const { x: X1, y: Y1, z: Z1 } = this;
            const A = mod(X1 ** _2n);
            const B = mod(Y1 ** _2n);
            const C = mod(B ** _2n);
            const D = mod(_2n * (mod((X1 + B) ** _2n) - A - C));
            const E = mod(_3n * A);
            const F = mod(E ** _2n);
            const X3 = mod(F - _2n * D);
            const Y3 = mod(E * (D - X3) - _8n * C);
            const Z3 = mod(_2n * Y1 * Z1);
            return new JacobianPoint(X3, Y3, Z3);
          }
          add(other) {
            if (!(other instanceof JacobianPoint))
              throw new TypeError("JacobianPoint expected");
            const { x: X1, y: Y1, z: Z1 } = this;
            const { x: X2, y: Y2, z: Z2 } = other;
            if (X2 === _0n || Y2 === _0n) return this;
            if (X1 === _0n || Y1 === _0n) return other;
            const Z1Z1 = mod(Z1 ** _2n);
            const Z2Z2 = mod(Z2 ** _2n);
            const U1 = mod(X1 * Z2Z2);
            const U2 = mod(X2 * Z1Z1);
            const S1 = mod(mod(Y1 * Z2) * Z2Z2);
            const S2 = mod(mod(Y2 * Z1) * Z1Z1);
            const H = mod(U2 - U1);
            const r = mod(S2 - S1);
            if (H === _0n) {
              if (r === _0n) {
                return this.double();
              } else {
                return JacobianPoint.ZERO;
              }
            }
            const HH = mod(H ** _2n);
            const HHH = mod(H * HH);
            const V = mod(U1 * HH);
            const X3 = mod(r ** _2n - HHH - _2n * V);
            const Y3 = mod(r * (V - X3) - S1 * HHH);
            const Z3 = mod(Z1 * Z2 * H);
            return new JacobianPoint(X3, Y3, Z3);
          }
          subtract(other) {
            return this.add(other.negate());
          }
          multiplyUnsafe(scalar) {
            let n = normalizeScalar(scalar);
            const G = JacobianPoint.BASE;
            const P0 = JacobianPoint.ZERO;
            if (n === _0n) return P0;
            if (n === _1n) return this;
            if (!USE_ENDOMORPHISM) {
              let p = P0;
              let d = this;
              while (n > _0n) {
                if (n & _1n) p = p.add(d);
                d = d.double();
                n >>= _1n;
              }
              return p;
            }
            let { k1neg, k1, k2neg, k2 } = splitScalarEndo(n);
            let k1p = P0;
            let k2p = P0;
            let d = this;
            while (k1 > _0n || k2 > _0n) {
              if (k1 & _1n) k1p = k1p.add(d);
              if (k2 & _1n) k2p = k2p.add(d);
              d = d.double();
              k1 >>= _1n;
              k2 >>= _1n;
            }
            if (k1neg) k1p = k1p.negate();
            if (k2neg) k2p = k2p.negate();
            k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
            return k1p.add(k2p);
          }
          precomputeWindow(W) {
            const windows = USE_ENDOMORPHISM ? 128 / W + 1 : 256 / W + 1;
            const points = [];
            let p = this;
            let base = p;
            for (let window = 0; window < windows; window++) {
              base = p;
              points.push(base);
              for (let i = 1; i < 2 ** (W - 1); i++) {
                base = base.add(p);
                points.push(base);
              }
              p = base.double();
            }
            return points;
          }
          wNAF(n, affinePoint) {
            if (!affinePoint && this.equals(JacobianPoint.BASE))
              affinePoint = Point.BASE;
            const W = (affinePoint && affinePoint._WINDOW_SIZE) || 1;
            if (256 % W) {
              throw new Error(
                "Point#wNAF: Invalid precomputation window, must be power of 2"
              );
            }
            let precomputes = affinePoint && pointPrecomputes.get(affinePoint);
            if (!precomputes) {
              precomputes = this.precomputeWindow(W);
              if (affinePoint && W !== 1) {
                precomputes = JacobianPoint.normalizeZ(precomputes);
                pointPrecomputes.set(affinePoint, precomputes);
              }
            }
            let p = JacobianPoint.ZERO;
            let f = JacobianPoint.ZERO;
            const windows = 1 + (USE_ENDOMORPHISM ? 128 / W : 256 / W);
            const windowSize = 2 ** (W - 1);
            const mask = BigInt(2 ** W - 1);
            const maxNumber = 2 ** W;
            const shiftBy = BigInt(W);
            for (let window = 0; window < windows; window++) {
              const offset = window * windowSize;
              let wbits = Number(n & mask);
              n >>= shiftBy;
              if (wbits > windowSize) {
                wbits -= maxNumber;
                n += _1n;
              }
              if (wbits === 0) {
                let pr = precomputes[offset];
                if (window % 2) pr = pr.negate();
                f = f.add(pr);
              } else {
                let cached = precomputes[offset + Math.abs(wbits) - 1];
                if (wbits < 0) cached = cached.negate();
                p = p.add(cached);
              }
            }
            return { p, f };
          }
          multiply(scalar, affinePoint) {
            let n = normalizeScalar(scalar);
            let point;
            let fake;
            if (USE_ENDOMORPHISM) {
              const { k1neg, k1, k2neg, k2 } = splitScalarEndo(n);
              let { p: k1p, f: f1p } = this.wNAF(k1, affinePoint);
              let { p: k2p, f: f2p } = this.wNAF(k2, affinePoint);
              if (k1neg) k1p = k1p.negate();
              if (k2neg) k2p = k2p.negate();
              k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
              point = k1p.add(k2p);
              fake = f1p.add(f2p);
            } else {
              const { p, f } = this.wNAF(n, affinePoint);
              point = p;
              fake = f;
            }
            return JacobianPoint.normalizeZ([point, fake])[0];
          }
          toAffine(invZ = invert(this.z)) {
            const { x, y, z } = this;
            const iz1 = invZ;
            const iz2 = mod(iz1 * iz1);
            const iz3 = mod(iz2 * iz1);
            const ax = mod(x * iz2);
            const ay = mod(y * iz3);
            const zz = mod(z * iz1);
            if (zz !== _1n) throw new Error("invZ was invalid");
            return new Point(ax, ay);
          }
        }
        JacobianPoint.BASE = new JacobianPoint(CURVE.Gx, CURVE.Gy, _1n);
        JacobianPoint.ZERO = new JacobianPoint(_0n, _1n, _0n);
        const pointPrecomputes = new WeakMap();
        class Point {
          constructor(x, y) {
            this.x = x;
            this.y = y;
          }
          _setWindowSize(windowSize) {
            this._WINDOW_SIZE = windowSize;
            pointPrecomputes.delete(this);
          }
          static fromCompressedHex(bytes) {
            const isShort = bytes.length === 32;
            const x = bytesToNumber(isShort ? bytes : bytes.subarray(1));
            if (!isValidFieldElement(x))
              throw new Error("Point is not on curve");
            const y2 = weistrass(x);
            let y = sqrtMod(y2);
            const isYOdd = (y & _1n) === _1n;
            if (isShort) {
              if (isYOdd) y = mod(-y);
            } else {
              const isFirstByteOdd = (bytes[0] & 1) === 1;
              if (isFirstByteOdd !== isYOdd) y = mod(-y);
            }
            const point = new Point(x, y);
            point.assertValidity();
            return point;
          }
          static fromUncompressedHex(bytes) {
            const x = bytesToNumber(bytes.subarray(1, 33));
            const y = bytesToNumber(bytes.subarray(33, 65));
            const point = new Point(x, y);
            point.assertValidity();
            return point;
          }
          static fromHex(hex) {
            const bytes = ensureBytes(hex);
            const len = bytes.length;
            const header = bytes[0];
            if (
              len === 32 ||
              (len === 33 && (header === 0x02 || header === 0x03))
            ) {
              return this.fromCompressedHex(bytes);
            }
            if (len === 65 && header === 0x04)
              return this.fromUncompressedHex(bytes);
            throw new Error(
              `Point.fromHex: received invalid point. Expected 32-33 compressed bytes or 65 uncompressed bytes, not ${len}`
            );
          }
          static fromPrivateKey(privateKey) {
            return Point.BASE.multiply(normalizePrivateKey(privateKey));
          }
          static fromSignature(msgHash, signature, recovery) {
            msgHash = ensureBytes(msgHash);
            const h = truncateHash(msgHash);
            const { r, s } = normalizeSignature(signature);
            if (recovery !== 0 && recovery !== 1) {
              throw new Error("Cannot recover signature: invalid recovery bit");
            }
            if (h === _0n)
              throw new Error("Cannot recover signature: msgHash cannot be 0");
            const prefix = recovery & 1 ? "03" : "02";
            const R = Point.fromHex(prefix + numTo32bStr(r));
            const { n } = CURVE;
            const rinv = invert(r, n);
            const u1 = mod(-h * rinv, n);
            const u2 = mod(s * rinv, n);
            const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
            if (!Q)
              throw new Error("Cannot recover signature: point at infinify");
            Q.assertValidity();
            return Q;
          }
          toRawBytes(isCompressed = false) {
            return hexToBytes(this.toHex(isCompressed));
          }
          toHex(isCompressed = false) {
            const x = numTo32bStr(this.x);
            if (isCompressed) {
              const prefix = this.y & _1n ? "03" : "02";
              return `${prefix}${x}`;
            } else {
              return `04${x}${numTo32bStr(this.y)}`;
            }
          }
          toHexX() {
            return this.toHex(true).slice(2);
          }
          toRawX() {
            return this.toRawBytes(true).slice(1);
          }
          assertValidity() {
            const msg = "Point is not on elliptic curve";
            const { x, y } = this;
            if (!isValidFieldElement(x) || !isValidFieldElement(y))
              throw new Error(msg);
            const left = mod(y * y);
            const right = weistrass(x);
            if (mod(left - right) !== _0n) throw new Error(msg);
          }
          equals(other) {
            return this.x === other.x && this.y === other.y;
          }
          negate() {
            return new Point(this.x, mod(-this.y));
          }
          double() {
            return JacobianPoint.fromAffine(this).double().toAffine();
          }
          add(other) {
            return JacobianPoint.fromAffine(this)
              .add(JacobianPoint.fromAffine(other))
              .toAffine();
          }
          subtract(other) {
            return this.add(other.negate());
          }
          multiply(scalar) {
            return JacobianPoint.fromAffine(this)
              .multiply(scalar, this)
              .toAffine();
          }
          multiplyAndAddUnsafe(Q, a, b) {
            const P = JacobianPoint.fromAffine(this);
            const aP =
              a === _0n || a === _1n || this !== Point.BASE
                ? P.multiplyUnsafe(a)
                : P.multiply(a);
            const bQ = JacobianPoint.fromAffine(Q).multiplyUnsafe(b);
            const sum = aP.add(bQ);
            return sum.equals(JacobianPoint.ZERO) ? undefined : sum.toAffine();
          }
        }
        exports.Point = Point;
        Point.BASE = new Point(CURVE.Gx, CURVE.Gy);
        Point.ZERO = new Point(_0n, _0n);
        function sliceDER(s) {
          return Number.parseInt(s[0], 16) >= 8 ? "00" + s : s;
        }
        function parseDERInt(data) {
          if (data.length < 2 || data[0] !== 0x02) {
            throw new Error(
              `Invalid signature integer tag: ${bytesToHex(data)}`
            );
          }
          const len = data[1];
          const res = data.subarray(2, len + 2);
          if (!len || res.length !== len) {
            throw new Error(`Invalid signature integer: wrong length`);
          }
          if (res[0] === 0x00 && res[1] <= 0x7f) {
            throw new Error("Invalid signature integer: trailing length");
          }
          return { data: bytesToNumber(res), left: data.subarray(len + 2) };
        }
        function parseDERSignature(data) {
          if (data.length < 2 || data[0] != 0x30) {
            throw new Error(`Invalid signature tag: ${bytesToHex(data)}`);
          }
          if (data[1] !== data.length - 2) {
            throw new Error("Invalid signature: incorrect length");
          }
          const { data: r, left: sBytes } = parseDERInt(data.subarray(2));
          const { data: s, left: rBytesLeft } = parseDERInt(sBytes);
          if (rBytesLeft.length) {
            throw new Error(
              `Invalid signature: left bytes after parsing: ${bytesToHex(
                rBytesLeft
              )}`
            );
          }
          return { r, s };
        }
        class Signature {
          constructor(r, s) {
            this.r = r;
            this.s = s;
            this.assertValidity();
          }
          static fromCompact(hex) {
            const arr = isUint8a(hex);
            const name = "Signature.fromCompact";
            if (typeof hex !== "string" && !arr)
              throw new TypeError(`${name}: Expected string or Uint8Array`);
            const str = arr ? bytesToHex(hex) : hex;
            if (str.length !== 128)
              throw new Error(`${name}: Expected 64-byte hex`);
            return new Signature(
              hexToNumber(str.slice(0, 64)),
              hexToNumber(str.slice(64, 128))
            );
          }
          static fromDER(hex) {
            const arr = isUint8a(hex);
            if (typeof hex !== "string" && !arr)
              throw new TypeError(
                `Signature.fromDER: Expected string or Uint8Array`
              );
            const { r, s } = parseDERSignature(arr ? hex : hexToBytes(hex));
            return new Signature(r, s);
          }
          static fromHex(hex) {
            return this.fromDER(hex);
          }
          assertValidity() {
            const { r, s } = this;
            if (!isWithinCurveOrder(r))
              throw new Error("Invalid Signature: r must be 0 < r < n");
            if (!isWithinCurveOrder(s))
              throw new Error("Invalid Signature: s must be 0 < s < n");
          }
          hasHighS() {
            const HALF = CURVE.n >> _1n;
            return this.s > HALF;
          }
          normalizeS() {
            return this.hasHighS()
              ? new Signature(this.r, CURVE.n - this.s)
              : this;
          }
          toDERRawBytes(isCompressed = false) {
            return hexToBytes(this.toDERHex(isCompressed));
          }
          toDERHex(isCompressed = false) {
            const sHex = sliceDER(numberToHexUnpadded(this.s));
            if (isCompressed) return sHex;
            const rHex = sliceDER(numberToHexUnpadded(this.r));
            const rLen = numberToHexUnpadded(rHex.length / 2);
            const sLen = numberToHexUnpadded(sHex.length / 2);
            const length = numberToHexUnpadded(
              rHex.length / 2 + sHex.length / 2 + 4
            );
            return `30${length}02${rLen}${rHex}02${sLen}${sHex}`;
          }
          toRawBytes() {
            return this.toDERRawBytes();
          }
          toHex() {
            return this.toDERHex();
          }
          toCompactRawBytes() {
            return hexToBytes(this.toCompactHex());
          }
          toCompactHex() {
            return numTo32bStr(this.r) + numTo32bStr(this.s);
          }
        }
        exports.Signature = Signature;
        function concatBytes(...arrays) {
          if (!arrays.every(isUint8a))
            throw new Error("Uint8Array list expected");
          if (arrays.length === 1) return arrays[0];
          const length = arrays.reduce((a, arr) => a + arr.length, 0);
          const result = new Uint8Array(length);
          for (let i = 0, pad = 0; i < arrays.length; i++) {
            const arr = arrays[i];
            result.set(arr, pad);
            pad += arr.length;
          }
          return result;
        }
        function isUint8a(bytes) {
          return bytes instanceof Uint8Array;
        }
        const hexes = Array.from({ length: 256 }, (v, i) =>
          i.toString(16).padStart(2, "0")
        );
        function bytesToHex(uint8a) {
          if (!(uint8a instanceof Uint8Array))
            throw new Error("Expected Uint8Array");
          let hex = "";
          for (let i = 0; i < uint8a.length; i++) {
            hex += hexes[uint8a[i]];
          }
          return hex;
        }
        function numTo32bStr(num) {
          if (num > POW_2_256) throw new Error("Expected number < 2^256");
          return num.toString(16).padStart(64, "0");
        }
        function numTo32b(num) {
          return hexToBytes(numTo32bStr(num));
        }
        function numberToHexUnpadded(num) {
          const hex = num.toString(16);
          return hex.length & 1 ? `0${hex}` : hex;
        }
        function hexToNumber(hex) {
          if (typeof hex !== "string") {
            throw new TypeError(
              "hexToNumber: expected string, got " + typeof hex
            );
          }
          return BigInt(`0x${hex}`);
        }
        function hexToBytes(hex) {
          if (typeof hex !== "string") {
            throw new TypeError(
              "hexToBytes: expected string, got " + typeof hex
            );
          }
          if (hex.length % 2)
            throw new Error(
              "hexToBytes: received invalid unpadded hex" + hex.length
            );
          const array = new Uint8Array(hex.length / 2);
          for (let i = 0; i < array.length; i++) {
            const j = i * 2;
            const hexByte = hex.slice(j, j + 2);
            const byte = Number.parseInt(hexByte, 16);
            if (Number.isNaN(byte) || byte < 0)
              throw new Error("Invalid byte sequence");
            array[i] = byte;
          }
          return array;
        }
        function bytesToNumber(bytes) {
          return hexToNumber(bytesToHex(bytes));
        }
        function ensureBytes(hex) {
          return hex instanceof Uint8Array
            ? Uint8Array.from(hex)
            : hexToBytes(hex);
        }
        function normalizeScalar(num) {
          if (typeof num === "number" && Number.isSafeInteger(num) && num > 0)
            return BigInt(num);
          if (typeof num === "bigint" && isWithinCurveOrder(num)) return num;
          throw new TypeError(
            "Expected valid private scalar: 0 < scalar < curve.n"
          );
        }
        function mod(a, b = CURVE.P) {
          const result = a % b;
          return result >= _0n ? result : b + result;
        }
        function pow2(x, power) {
          const { P } = CURVE;
          let res = x;
          while (power-- > _0n) {
            res *= res;
            res %= P;
          }
          return res;
        }
        function sqrtMod(x) {
          const { P } = CURVE;
          const _6n = BigInt(6);
          const _11n = BigInt(11);
          const _22n = BigInt(22);
          const _23n = BigInt(23);
          const _44n = BigInt(44);
          const _88n = BigInt(88);
          const b2 = (x * x * x) % P;
          const b3 = (b2 * b2 * x) % P;
          const b6 = (pow2(b3, _3n) * b3) % P;
          const b9 = (pow2(b6, _3n) * b3) % P;
          const b11 = (pow2(b9, _2n) * b2) % P;
          const b22 = (pow2(b11, _11n) * b11) % P;
          const b44 = (pow2(b22, _22n) * b22) % P;
          const b88 = (pow2(b44, _44n) * b44) % P;
          const b176 = (pow2(b88, _88n) * b88) % P;
          const b220 = (pow2(b176, _44n) * b44) % P;
          const b223 = (pow2(b220, _3n) * b3) % P;
          const t1 = (pow2(b223, _23n) * b22) % P;
          const t2 = (pow2(t1, _6n) * b2) % P;
          return pow2(t2, _2n);
        }
        function invert(number, modulo = CURVE.P) {
          if (number === _0n || modulo <= _0n) {
            throw new Error(
              `invert: expected positive integers, got n=${number} mod=${modulo}`
            );
          }
          let a = mod(number, modulo);
          let b = modulo;
          let x = _0n,
            y = _1n,
            u = _1n,
            v = _0n;
          while (a !== _0n) {
            const q = b / a;
            const r = b % a;
            const m = x - u * q;
            const n = y - v * q;
            (b = a), (a = r), (x = u), (y = v), (u = m), (v = n);
          }
          const gcd = b;
          if (gcd !== _1n) throw new Error("invert: does not exist");
          return mod(x, modulo);
        }
        function invertBatch(nums, p = CURVE.P) {
          const scratch = new Array(nums.length);
          const lastMultiplied = nums.reduce((acc, num, i) => {
            if (num === _0n) return acc;
            scratch[i] = acc;
            return mod(acc * num, p);
          }, _1n);
          const inverted = invert(lastMultiplied, p);
          nums.reduceRight((acc, num, i) => {
            if (num === _0n) return acc;
            scratch[i] = mod(acc * scratch[i], p);
            return mod(acc * num, p);
          }, inverted);
          return scratch;
        }
        const divNearest = (a, b) => (a + b / _2n) / b;
        const POW_2_128 = _2n ** BigInt(128);
        function splitScalarEndo(k) {
          const { n } = CURVE;
          const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
          const b1 = -_1n * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
          const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
          const b2 = a1;
          const c1 = divNearest(b2 * k, n);
          const c2 = divNearest(-b1 * k, n);
          let k1 = mod(k - c1 * a1 - c2 * a2, n);
          let k2 = mod(-c1 * b1 - c2 * b2, n);
          const k1neg = k1 > POW_2_128;
          const k2neg = k2 > POW_2_128;
          if (k1neg) k1 = n - k1;
          if (k2neg) k2 = n - k2;
          if (k1 > POW_2_128 || k2 > POW_2_128) {
            throw new Error("splitScalarEndo: Endomorphism failed, k=" + k);
          }
          return { k1neg, k1, k2neg, k2 };
        }
        function truncateHash(hash) {
          const { n } = CURVE;
          const byteLength = hash.length;
          const delta = byteLength * 8 - 256;
          let h = bytesToNumber(hash);
          if (delta > 0) h = h >> BigInt(delta);
          if (h >= n) h -= n;
          return h;
        }
        class HmacDrbg {
          constructor() {
            this.v = new Uint8Array(32).fill(1);
            this.k = new Uint8Array(32).fill(0);
            this.counter = 0;
          }
          hmac(...values) {
            return exports.utils.hmacSha256(this.k, ...values);
          }
          hmacSync(...values) {
            if (typeof exports.utils.hmacSha256Sync !== "function")
              throw new Error(
                "utils.hmacSha256Sync is undefined, you need to set it"
              );
            const res = exports.utils.hmacSha256Sync(this.k, ...values);
            if (res instanceof Promise)
              throw new Error(
                "To use sync sign(), ensure utils.hmacSha256 is sync"
              );
            return res;
          }
          incr() {
            if (this.counter >= 1000) {
              throw new Error(
                "Tried 1,000 k values for sign(), all were invalid"
              );
            }
            this.counter += 1;
          }
          async reseed(seed = new Uint8Array()) {
            this.k = await this.hmac(this.v, Uint8Array.from([0x00]), seed);
            this.v = await this.hmac(this.v);
            if (seed.length === 0) return;
            this.k = await this.hmac(this.v, Uint8Array.from([0x01]), seed);
            this.v = await this.hmac(this.v);
          }
          reseedSync(seed = new Uint8Array()) {
            this.k = this.hmacSync(this.v, Uint8Array.from([0x00]), seed);
            this.v = this.hmacSync(this.v);
            if (seed.length === 0) return;
            this.k = this.hmacSync(this.v, Uint8Array.from([0x01]), seed);
            this.v = this.hmacSync(this.v);
          }
          async generate() {
            this.incr();
            this.v = await this.hmac(this.v);
            return this.v;
          }
          generateSync() {
            this.incr();
            this.v = this.hmacSync(this.v);
            return this.v;
          }
        }
        function isWithinCurveOrder(num) {
          return _0n < num && num < CURVE.n;
        }
        function isValidFieldElement(num) {
          return _0n < num && num < CURVE.P;
        }
        function kmdToSig(kBytes, m, d) {
          const k = bytesToNumber(kBytes);
          if (!isWithinCurveOrder(k)) return;
          const { n } = CURVE;
          const q = Point.BASE.multiply(k);
          const r = mod(q.x, n);
          if (r === _0n) return;
          const s = mod(invert(k, n) * mod(m + d * r, n), n);
          if (s === _0n) return;
          const sig = new Signature(r, s);
          const recovery = (q.x === sig.r ? 0 : 2) | Number(q.y & _1n);
          return { sig, recovery };
        }
        function normalizePrivateKey(key) {
          let num;
          if (typeof key === "bigint") {
            num = key;
          } else if (
            typeof key === "number" &&
            Number.isSafeInteger(key) &&
            key > 0
          ) {
            num = BigInt(key);
          } else if (typeof key === "string") {
            if (key.length !== 64)
              throw new Error("Expected 32 bytes of private key");
            num = hexToNumber(key);
          } else if (isUint8a(key)) {
            if (key.length !== 32)
              throw new Error("Expected 32 bytes of private key");
            num = bytesToNumber(key);
          } else {
            throw new TypeError("Expected valid private key");
          }
          if (!isWithinCurveOrder(num))
            throw new Error("Expected private key: 0 < key < n");
          return num;
        }
        function normalizePublicKey(publicKey) {
          if (publicKey instanceof Point) {
            publicKey.assertValidity();
            return publicKey;
          } else {
            return Point.fromHex(publicKey);
          }
        }
        function normalizeSignature(signature) {
          if (signature instanceof Signature) {
            signature.assertValidity();
            return signature;
          }
          try {
            return Signature.fromDER(signature);
          } catch (error) {
            return Signature.fromCompact(signature);
          }
        }
        function getPublicKey(privateKey, isCompressed = false) {
          return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
        }
        exports.getPublicKey = getPublicKey;
        function recoverPublicKey(
          msgHash,
          signature,
          recovery,
          isCompressed = false
        ) {
          return Point.fromSignature(msgHash, signature, recovery).toRawBytes(
            isCompressed
          );
        }
        exports.recoverPublicKey = recoverPublicKey;
        function isPub(item) {
          const arr = isUint8a(item);
          const str = typeof item === "string";
          const len = (arr || str) && item.length;
          if (arr) return len === 33 || len === 65;
          if (str) return len === 66 || len === 130;
          if (item instanceof Point) return true;
          return false;
        }
        function getSharedSecret(privateA, publicB, isCompressed = false) {
          if (isPub(privateA))
            throw new TypeError(
              "getSharedSecret: first arg must be private key"
            );
          if (!isPub(publicB))
            throw new TypeError(
              "getSharedSecret: second arg must be public key"
            );
          const b = normalizePublicKey(publicB);
          b.assertValidity();
          return b
            .multiply(normalizePrivateKey(privateA))
            .toRawBytes(isCompressed);
        }
        exports.getSharedSecret = getSharedSecret;
        function bits2int(bytes) {
          const slice = bytes.length > 32 ? bytes.slice(0, 32) : bytes;
          return bytesToNumber(slice);
        }
        function bits2octets(bytes) {
          const z1 = bits2int(bytes);
          const z2 = mod(z1, CURVE.n);
          return int2octets(z2 < _0n ? z1 : z2);
        }
        function int2octets(num) {
          if (typeof num !== "bigint") throw new Error("Expected bigint");
          const hex = numTo32bStr(num);
          return hexToBytes(hex);
        }
        function initSigArgs(msgHash, privateKey, extraEntropy) {
          if (msgHash == null)
            throw new Error(
              `sign: expected valid message hash, not "${msgHash}"`
            );
          const h1 = ensureBytes(msgHash);
          const d = normalizePrivateKey(privateKey);
          const seedArgs = [int2octets(d), bits2octets(h1)];
          if (extraEntropy != null) {
            if (extraEntropy === true)
              extraEntropy = exports.utils.randomBytes(32);
            const e = ensureBytes(extraEntropy);
            if (e.length !== 32)
              throw new Error("sign: Expected 32 bytes of extra data");
            seedArgs.push(e);
          }
          const seed = concatBytes(...seedArgs);
          const m = bits2int(h1);
          return { seed, m, d };
        }
        function finalizeSig(recSig, opts) {
          let { sig, recovery } = recSig;
          const { canonical, der, recovered } = Object.assign(
            { canonical: true, der: true },
            opts
          );
          if (canonical && sig.hasHighS()) {
            sig = sig.normalizeS();
            recovery ^= 1;
          }
          const hashed = der ? sig.toDERRawBytes() : sig.toCompactRawBytes();
          return recovered ? [hashed, recovery] : hashed;
        }
        async function sign(msgHash, privKey, opts = {}) {
          const { seed, m, d } = initSigArgs(
            msgHash,
            privKey,
            opts.extraEntropy
          );
          let sig;
          const drbg = new HmacDrbg();
          await drbg.reseed(seed);
          while (!(sig = kmdToSig(await drbg.generate(), m, d)))
            await drbg.reseed();
          return finalizeSig(sig, opts);
        }
        exports.sign = sign;
        function signSync(msgHash, privKey, opts = {}) {
          const { seed, m, d } = initSigArgs(
            msgHash,
            privKey,
            opts.extraEntropy
          );
          let sig;
          const drbg = new HmacDrbg();
          drbg.reseedSync(seed);
          while (!(sig = kmdToSig(drbg.generateSync(), m, d)))
            drbg.reseedSync();
          return finalizeSig(sig, opts);
        }
        exports.signSync = signSync;
        const vopts = { strict: true };
        function verify(signature, msgHash, publicKey, opts = vopts) {
          let sig;
          try {
            sig = normalizeSignature(signature);
            msgHash = ensureBytes(msgHash);
          } catch (error) {
            return false;
          }
          const { r, s } = sig;
          if (opts.strict && sig.hasHighS()) return false;
          const h = truncateHash(msgHash);
          if (h === _0n) return false;
          let P;
          try {
            P = normalizePublicKey(publicKey);
          } catch (error) {
            return false;
          }
          const { n } = CURVE;
          const sinv = invert(s, n);
          const u1 = mod(h * sinv, n);
          const u2 = mod(r * sinv, n);
          const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2);
          if (!R) return false;
          const v = mod(R.x, n);
          return v === r;
        }
        exports.verify = verify;
        function finalizeSchnorrChallenge(ch) {
          return mod(bytesToNumber(ch), CURVE.n);
        }
        function hasEvenY(point) {
          return (point.y & _1n) === _0n;
        }
        class SchnorrSignature {
          constructor(r, s) {
            this.r = r;
            this.s = s;
            this.assertValidity();
          }
          static fromHex(hex) {
            const bytes = ensureBytes(hex);
            if (bytes.length !== 64)
              throw new TypeError(
                `SchnorrSignature.fromHex: expected 64 bytes, not ${bytes.length}`
              );
            const r = bytesToNumber(bytes.subarray(0, 32));
            const s = bytesToNumber(bytes.subarray(32, 64));
            return new SchnorrSignature(r, s);
          }
          assertValidity() {
            const { r, s } = this;
            if (!isValidFieldElement(r) || !isWithinCurveOrder(s))
              throw new Error("Invalid signature");
          }
          toHex() {
            return numTo32bStr(this.r) + numTo32bStr(this.s);
          }
          toRawBytes() {
            return hexToBytes(this.toHex());
          }
        }
        function schnorrGetPublicKey(privateKey) {
          return Point.fromPrivateKey(privateKey).toRawX();
        }
        function initSchnorrSigArgs(message, privateKey, auxRand) {
          if (message == null)
            throw new TypeError(
              `sign: Expected valid message, not "${message}"`
            );
          const m = ensureBytes(message);
          const d0 = normalizePrivateKey(privateKey);
          const rand = ensureBytes(auxRand);
          if (rand.length !== 32)
            throw new TypeError("sign: Expected 32 bytes of aux randomness");
          const P = Point.fromPrivateKey(d0);
          const px = P.toRawX();
          const d = hasEvenY(P) ? d0 : CURVE.n - d0;
          return { m, P, px, d, rand };
        }
        function initSchnorrNonce(d, t0h) {
          return numTo32b(d ^ bytesToNumber(t0h));
        }
        function finalizeSchnorrNonce(k0h) {
          const k0 = mod(bytesToNumber(k0h), CURVE.n);
          if (k0 === _0n)
            throw new Error("sign: Creation of signature failed. k is zero");
          const R = Point.fromPrivateKey(k0);
          const rx = R.toRawX();
          const k = hasEvenY(R) ? k0 : CURVE.n - k0;
          return { R, rx, k };
        }
        function finalizeSchnorrSig(R, k, e, d) {
          return new SchnorrSignature(
            R.x,
            mod(k + e * d, CURVE.n)
          ).toRawBytes();
        }
        async function schnorrSign(
          message,
          privateKey,
          auxRand = exports.utils.randomBytes()
        ) {
          const { m, px, d, rand } = initSchnorrSigArgs(
            message,
            privateKey,
            auxRand
          );
          const t = initSchnorrNonce(
            d,
            await exports.utils.taggedHash(TAGS.aux, rand)
          );
          const { R, rx, k } = finalizeSchnorrNonce(
            await exports.utils.taggedHash(TAGS.nonce, t, px, m)
          );
          const e = finalizeSchnorrChallenge(
            await exports.utils.taggedHash(TAGS.challenge, rx, px, m)
          );
          const sig = finalizeSchnorrSig(R, k, e, d);
          const isValid = await schnorrVerify(sig, m, px);
          if (!isValid) throw new Error("sign: Invalid signature produced");
          return sig;
        }
        function schnorrSignSync(
          message,
          privateKey,
          auxRand = exports.utils.randomBytes()
        ) {
          const { m, px, d, rand } = initSchnorrSigArgs(
            message,
            privateKey,
            auxRand
          );
          const t = initSchnorrNonce(
            d,
            exports.utils.taggedHashSync(TAGS.aux, rand)
          );
          const { R, rx, k } = finalizeSchnorrNonce(
            exports.utils.taggedHashSync(TAGS.nonce, t, px, m)
          );
          const e = finalizeSchnorrChallenge(
            exports.utils.taggedHashSync(TAGS.challenge, rx, px, m)
          );
          const sig = finalizeSchnorrSig(R, k, e, d);
          const isValid = schnorrVerifySync(sig, m, px);
          if (!isValid) throw new Error("sign: Invalid signature produced");
          return sig;
        }
        function initSchnorrVerify(signature, message, publicKey) {
          const raw = signature instanceof SchnorrSignature;
          const sig = raw ? signature : SchnorrSignature.fromHex(signature);
          if (raw) sig.assertValidity();
          return {
            ...sig,
            m: ensureBytes(message),
            P: normalizePublicKey(publicKey),
          };
        }
        function finalizeSchnorrVerify(r, P, s, e) {
          const R = Point.BASE.multiplyAndAddUnsafe(
            P,
            normalizePrivateKey(s),
            mod(-e, CURVE.n)
          );
          if (!R || !hasEvenY(R) || R.x !== r) return false;
          return true;
        }
        async function schnorrVerify(signature, message, publicKey) {
          try {
            const { r, s, m, P } = initSchnorrVerify(
              signature,
              message,
              publicKey
            );
            const e = finalizeSchnorrChallenge(
              await exports.utils.taggedHash(
                TAGS.challenge,
                numTo32b(r),
                P.toRawX(),
                m
              )
            );
            return finalizeSchnorrVerify(r, P, s, e);
          } catch (error) {
            return false;
          }
        }
        function schnorrVerifySync(signature, message, publicKey) {
          try {
            const { r, s, m, P } = initSchnorrVerify(
              signature,
              message,
              publicKey
            );
            const e = finalizeSchnorrChallenge(
              exports.utils.taggedHashSync(
                TAGS.challenge,
                numTo32b(r),
                P.toRawX(),
                m
              )
            );
            return finalizeSchnorrVerify(r, P, s, e);
          } catch (error) {
            return false;
          }
        }
        exports.schnorr = {
          Signature: SchnorrSignature,
          getPublicKey: schnorrGetPublicKey,
          sign: schnorrSign,
          verify: schnorrVerify,
          signSync: schnorrSignSync,
          verifySync: schnorrVerifySync,
        };
        Point.BASE._setWindowSize(8);
        const crypto = {
          node: nodeCrypto,
          web:
            typeof self === "object" && "crypto" in self
              ? self.crypto
              : undefined,
        };
        const TAGS = {
          challenge: "BIP0340/challenge",
          aux: "BIP0340/aux",
          nonce: "BIP0340/nonce",
        };
        const TAGGED_HASH_PREFIXES = {};
        exports.utils = {
          isValidPrivateKey(privateKey) {
            try {
              normalizePrivateKey(privateKey);
              return true;
            } catch (error) {
              return false;
            }
          },
          privateAdd: (privateKey, tweak) => {
            const p = normalizePrivateKey(privateKey);
            const t = bytesToNumber(ensureBytes(tweak));
            return numTo32b(mod(p + t, CURVE.n));
          },
          privateNegate: (privateKey) => {
            const p = normalizePrivateKey(privateKey);
            return numTo32b(CURVE.n - p);
          },
          pointAddScalar: (p, tweak, isCompressed) => {
            const P = Point.fromHex(p);
            const t = bytesToNumber(ensureBytes(tweak));
            const Q = Point.BASE.multiplyAndAddUnsafe(P, t, _1n);
            if (!Q) throw new Error("Tweaked point at infinity");
            return Q.toRawBytes(isCompressed);
          },
          pointMultiply: (p, tweak, isCompressed) => {
            const P = Point.fromHex(p);
            const t = bytesToNumber(ensureBytes(tweak));
            return P.multiply(t).toRawBytes(isCompressed);
          },
          hashToPrivateKey: (hash) => {
            hash = ensureBytes(hash);
            if (hash.length < 40 || hash.length > 1024)
              throw new Error(
                "Expected 40-1024 bytes of private key as per FIPS 186"
              );
            const num = mod(bytesToNumber(hash), CURVE.n - _1n) + _1n;
            return numTo32b(num);
          },
          randomBytes: (bytesLength = 32) => {
            if (crypto.web) {
              return crypto.web.getRandomValues(new Uint8Array(bytesLength));
            } else if (crypto.node) {
              const { randomBytes } = crypto.node;
              return Uint8Array.from(randomBytes(bytesLength));
            } else {
              throw new Error(
                "The environment doesn't have randomBytes function"
              );
            }
          },
          randomPrivateKey: () => {
            return exports.utils.hashToPrivateKey(
              exports.utils.randomBytes(40)
            );
          },
          bytesToHex,
          hexToBytes,
          concatBytes,
          mod,
          invert,
          sha256: async (...messages) => {
            if (crypto.web) {
              const buffer = await crypto.web.subtle.digest(
                "SHA-256",
                concatBytes(...messages)
              );
              return new Uint8Array(buffer);
            } else if (crypto.node) {
              const { createHash } = crypto.node;
              const hash = createHash("sha256");
              messages.forEach((m) => hash.update(m));
              return Uint8Array.from(hash.digest());
            } else {
              throw new Error("The environment doesn't have sha256 function");
            }
          },
          hmacSha256: async (key, ...messages) => {
            if (crypto.web) {
              const ckey = await crypto.web.subtle.importKey(
                "raw",
                key,
                { name: "HMAC", hash: { name: "SHA-256" } },
                false,
                ["sign"]
              );
              const message = concatBytes(...messages);
              const buffer = await crypto.web.subtle.sign(
                "HMAC",
                ckey,
                message
              );
              return new Uint8Array(buffer);
            } else if (crypto.node) {
              const { createHmac } = crypto.node;
              const hash = createHmac("sha256", key);
              messages.forEach((m) => hash.update(m));
              return Uint8Array.from(hash.digest());
            } else {
              throw new Error(
                "The environment doesn't have hmac-sha256 function"
              );
            }
          },
          sha256Sync: undefined,
          hmacSha256Sync: undefined,
          taggedHash: async (tag, ...messages) => {
            let tagP = TAGGED_HASH_PREFIXES[tag];
            if (tagP === undefined) {
              const tagH = await exports.utils.sha256(
                Uint8Array.from(tag, (c) => c.charCodeAt(0))
              );
              tagP = concatBytes(tagH, tagH);
              TAGGED_HASH_PREFIXES[tag] = tagP;
            }
            return exports.utils.sha256(tagP, ...messages);
          },
          taggedHashSync: (tag, ...messages) => {
            if (typeof exports.utils.sha256Sync !== "function")
              throw new Error(
                "utils.sha256Sync is undefined, you need to set it"
              );
            let tagP = TAGGED_HASH_PREFIXES[tag];
            if (tagP === undefined) {
              const tagH = exports.utils.sha256Sync(
                Uint8Array.from(tag, (c) => c.charCodeAt(0))
              );
              tagP = concatBytes(tagH, tagH);
              TAGGED_HASH_PREFIXES[tag] = tagP;
            }
            return exports.utils.sha256Sync(tagP, ...messages);
          },
          precompute(windowSize = 8, point = Point.BASE) {
            const cached =
              point === Point.BASE ? point : new Point(point.x, point.y);
            cached._setWindowSize(windowSize);
            cached.multiply(_3n);
            return cached;
          },
        };
      },
      { crypto: 51 },
    ],
    2: [
      function (require, module, exports) {
        /*
         *  big.js v6.2.0
         *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
         *  Copyright (c) 2022 Michael Mclaughlin
         *  https://github.com/MikeMcl/big.js/LICENCE.md
         */
        (function (GLOBAL) {
          "use strict";
          var Big,
            /************************************** EDITABLE DEFAULTS *****************************************/

            // The default values below must be integers within the stated ranges.

            /*
             * The maximum number of decimal places (DP) of the results of operations involving division:
             * div and sqrt, and pow with negative exponents.
             */
            DP = 20, // 0 to MAX_DP
            /*
             * The rounding mode (RM) used when rounding to the above decimal places.
             *
             *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
             *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
             *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
             *  3  Away from zero.                                  (ROUND_UP)
             */
            RM = 1, // 0, 1, 2 or 3
            // The maximum value of DP and Big.DP.
            MAX_DP = 1e6, // 0 to 1000000
            // The maximum magnitude of the exponent argument to the pow method.
            MAX_POWER = 1e6, // 1 to 1000000
            /*
             * The negative exponent (NE) at and beneath which toString returns exponential notation.
             * (JavaScript numbers: -7)
             * -1000000 is the minimum recommended exponent value of a Big.
             */
            NE = -7, // 0 to -1000000
            /*
             * The positive exponent (PE) at and above which toString returns exponential notation.
             * (JavaScript numbers: 21)
             * 1000000 is the maximum recommended exponent value of a Big, but this limit is not enforced.
             */
            PE = 21, // 0 to 1000000
            /*
             * When true, an error will be thrown if a primitive number is passed to the Big constructor,
             * or if valueOf is called, or if toNumber is called on a Big which cannot be converted to a
             * primitive number without a loss of precision.
             */
            STRICT = false, // true or false
            /**************************************************************************************************/

            // Error messages.
            NAME = "[big.js] ",
            INVALID = NAME + "Invalid ",
            INVALID_DP = INVALID + "decimal places",
            INVALID_RM = INVALID + "rounding mode",
            DIV_BY_ZERO = NAME + "Division by zero",
            // The shared prototype object.
            P = {},
            UNDEFINED = void 0,
            NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;

          /*
           * Create and return a Big constructor.
           */
          function _Big_() {
            /*
             * The Big constructor and exported function.
             * Create and return a new instance of a Big number object.
             *
             * n {number|string|Big} A numeric value.
             */
            function Big(n) {
              var x = this;

              // Enable constructor usage without new.
              if (!(x instanceof Big))
                return n === UNDEFINED ? _Big_() : new Big(n);

              // Duplicate.
              if (n instanceof Big) {
                x.s = n.s;
                x.e = n.e;
                x.c = n.c.slice();
              } else {
                if (typeof n !== "string") {
                  if (Big.strict === true && typeof n !== "bigint") {
                    throw TypeError(INVALID + "value");
                  }

                  // Minus zero?
                  n = n === 0 && 1 / n < 0 ? "-0" : String(n);
                }

                parse(x, n);
              }

              // Retain a reference to this Big constructor.
              // Shadow Big.prototype.constructor which points to Object.
              x.constructor = Big;
            }

            Big.prototype = P;
            Big.DP = DP;
            Big.RM = RM;
            Big.NE = NE;
            Big.PE = PE;
            Big.strict = STRICT;
            Big.roundDown = 0;
            Big.roundHalfUp = 1;
            Big.roundHalfEven = 2;
            Big.roundUp = 3;

            return Big;
          }

          /*
           * Parse the number or string value passed to a Big constructor.
           *
           * x {Big} A Big number instance.
           * n {number|string} A numeric value.
           */
          function parse(x, n) {
            var e, i, nl;

            if (!NUMERIC.test(n)) {
              throw Error(INVALID + "number");
            }

            // Determine sign.
            x.s = n.charAt(0) == "-" ? ((n = n.slice(1)), -1) : 1;

            // Decimal point?
            if ((e = n.indexOf(".")) > -1) n = n.replace(".", "");

            // Exponential form?
            if ((i = n.search(/e/i)) > 0) {
              // Determine exponent.
              if (e < 0) e = i;
              e += +n.slice(i + 1);
              n = n.substring(0, i);
            } else if (e < 0) {
              // Integer.
              e = n.length;
            }

            nl = n.length;

            // Determine leading zeros.
            for (i = 0; i < nl && n.charAt(i) == "0"; ) ++i;

            if (i == nl) {
              // Zero.
              x.c = [(x.e = 0)];
            } else {
              // Determine trailing zeros.
              for (; nl > 0 && n.charAt(--nl) == "0"; );
              x.e = e - i - 1;
              x.c = [];

              // Convert string to array of digits without leading/trailing zeros.
              for (e = 0; i <= nl; ) x.c[e++] = +n.charAt(i++);
            }

            return x;
          }

          /*
           * Round Big x to a maximum of sd significant digits using rounding mode rm.
           *
           * x {Big} The Big to round.
           * sd {number} Significant digits: integer, 0 to MAX_DP inclusive.
           * rm {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
           * [more] {boolean} Whether the result of division was truncated.
           */
          function round(x, sd, rm, more) {
            var xc = x.c;

            if (rm === UNDEFINED) rm = x.constructor.RM;
            if (rm !== 0 && rm !== 1 && rm !== 2 && rm !== 3) {
              throw Error(INVALID_RM);
            }

            if (sd < 1) {
              more =
                (rm === 3 && (more || !!xc[0])) ||
                (sd === 0 &&
                  ((rm === 1 && xc[0] >= 5) ||
                    (rm === 2 &&
                      (xc[0] > 5 ||
                        (xc[0] === 5 && (more || xc[1] !== UNDEFINED))))));

              xc.length = 1;

              if (more) {
                // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                x.e = x.e - sd + 1;
                xc[0] = 1;
              } else {
                // Zero.
                xc[0] = x.e = 0;
              }
            } else if (sd < xc.length) {
              // xc[sd] is the digit after the digit that may be rounded up.
              more =
                (rm === 1 && xc[sd] >= 5) ||
                (rm === 2 &&
                  (xc[sd] > 5 ||
                    (xc[sd] === 5 &&
                      (more || xc[sd + 1] !== UNDEFINED || xc[sd - 1] & 1)))) ||
                (rm === 3 && (more || !!xc[0]));

              // Remove any digits after the required precision.
              xc.length = sd--;

              // Round up?
              if (more) {
                // Rounding up may mean the previous digit has to be rounded up.
                for (; ++xc[sd] > 9; ) {
                  xc[sd] = 0;
                  if (!sd--) {
                    ++x.e;
                    xc.unshift(1);
                  }
                }
              }

              // Remove trailing zeros.
              for (sd = xc.length; !xc[--sd]; ) xc.pop();
            }

            return x;
          }

          /*
           * Return a string representing the value of Big x in normal or exponential notation.
           * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
           */
          function stringify(x, doExponential, isNonzero) {
            var e = x.e,
              s = x.c.join(""),
              n = s.length;

            // Exponential notation?
            if (doExponential) {
              s =
                s.charAt(0) +
                (n > 1 ? "." + s.slice(1) : "") +
                (e < 0 ? "e" : "e+") +
                e;

              // Normal notation.
            } else if (e < 0) {
              for (; ++e; ) s = "0" + s;
              s = "0." + s;
            } else if (e > 0) {
              if (++e > n) {
                for (e -= n; e--; ) s += "0";
              } else if (e < n) {
                s = s.slice(0, e) + "." + s.slice(e);
              }
            } else if (n > 1) {
              s = s.charAt(0) + "." + s.slice(1);
            }

            return x.s < 0 && isNonzero ? "-" + s : s;
          }

          // Prototype/instance methods

          /*
           * Return a new Big whose value is the absolute value of this Big.
           */
          P.abs = function () {
            var x = new this.constructor(this);
            x.s = 1;
            return x;
          };

          /*
           * Return 1 if the value of this Big is greater than the value of Big y,
           *       -1 if the value of this Big is less than the value of Big y, or
           *        0 if they have the same value.
           */
          P.cmp = function (y) {
            var isneg,
              x = this,
              xc = x.c,
              yc = (y = new x.constructor(y)).c,
              i = x.s,
              j = y.s,
              k = x.e,
              l = y.e;

            // Either zero?
            if (!xc[0] || !yc[0]) return !xc[0] ? (!yc[0] ? 0 : -j) : i;

            // Signs differ?
            if (i != j) return i;

            isneg = i < 0;

            // Compare exponents.
            if (k != l) return (k > l) ^ isneg ? 1 : -1;

            j = (k = xc.length) < (l = yc.length) ? k : l;

            // Compare digit by digit.
            for (i = -1; ++i < j; ) {
              if (xc[i] != yc[i]) return (xc[i] > yc[i]) ^ isneg ? 1 : -1;
            }

            // Compare lengths.
            return k == l ? 0 : (k > l) ^ isneg ? 1 : -1;
          };

          /*
           * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
           * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
           */
          P.div = function (y) {
            var x = this,
              Big = x.constructor,
              a = x.c, // dividend
              b = (y = new Big(y)).c, // divisor
              k = x.s == y.s ? 1 : -1,
              dp = Big.DP;

            if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
              throw Error(INVALID_DP);
            }

            // Divisor is zero?
            if (!b[0]) {
              throw Error(DIV_BY_ZERO);
            }

            // Dividend is 0? Return +-0.
            if (!a[0]) {
              y.s = k;
              y.c = [(y.e = 0)];
              return y;
            }

            var bl,
              bt,
              n,
              cmp,
              ri,
              bz = b.slice(),
              ai = (bl = b.length),
              al = a.length,
              r = a.slice(0, bl), // remainder
              rl = r.length,
              q = y, // quotient
              qc = (q.c = []),
              qi = 0,
              p = dp + (q.e = x.e - y.e) + 1; // precision of the result

            q.s = k;
            k = p < 0 ? 0 : p;

            // Create version of divisor with leading zero.
            bz.unshift(0);

            // Add zeros to make remainder as long as divisor.
            for (; rl++ < bl; ) r.push(0);

            do {
              // n is how many times the divisor goes into current remainder.
              for (n = 0; n < 10; n++) {
                // Compare divisor and remainder.
                if (bl != (rl = r.length)) {
                  cmp = bl > rl ? 1 : -1;
                } else {
                  for (ri = -1, cmp = 0; ++ri < bl; ) {
                    if (b[ri] != r[ri]) {
                      cmp = b[ri] > r[ri] ? 1 : -1;
                      break;
                    }
                  }
                }

                // If divisor < remainder, subtract divisor from remainder.
                if (cmp < 0) {
                  // Remainder can't be more than 1 digit longer than divisor.
                  // Equalise lengths using divisor with extra leading zero?
                  for (bt = rl == bl ? b : bz; rl; ) {
                    if (r[--rl] < bt[rl]) {
                      ri = rl;
                      for (; ri && !r[--ri]; ) r[ri] = 9;
                      --r[ri];
                      r[rl] += 10;
                    }
                    r[rl] -= bt[rl];
                  }

                  for (; !r[0]; ) r.shift();
                } else {
                  break;
                }
              }

              // Add the digit n to the result array.
              qc[qi++] = cmp ? n : ++n;

              // Update the remainder.
              if (r[0] && cmp) r[rl] = a[ai] || 0;
              else r = [a[ai]];
            } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

            // Leading zero? Do not remove if result is simply zero (qi == 1).
            if (!qc[0] && qi != 1) {
              // There can't be more than one zero.
              qc.shift();
              q.e--;
              p--;
            }

            // Round?
            if (qi > p) round(q, p, Big.RM, r[0] !== UNDEFINED);

            return q;
          };

          /*
           * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
           */
          P.eq = function (y) {
            return this.cmp(y) === 0;
          };

          /*
           * Return true if the value of this Big is greater than the value of Big y, otherwise return
           * false.
           */
          P.gt = function (y) {
            return this.cmp(y) > 0;
          };

          /*
           * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
           * return false.
           */
          P.gte = function (y) {
            return this.cmp(y) > -1;
          };

          /*
           * Return true if the value of this Big is less than the value of Big y, otherwise return false.
           */
          P.lt = function (y) {
            return this.cmp(y) < 0;
          };

          /*
           * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
           * return false.
           */
          P.lte = function (y) {
            return this.cmp(y) < 1;
          };

          /*
           * Return a new Big whose value is the value of this Big minus the value of Big y.
           */
          P.minus = P.sub = function (y) {
            var i,
              j,
              t,
              xlty,
              x = this,
              Big = x.constructor,
              a = x.s,
              b = (y = new Big(y)).s;

            // Signs differ?
            if (a != b) {
              y.s = -b;
              return x.plus(y);
            }

            var xc = x.c.slice(),
              xe = x.e,
              yc = y.c,
              ye = y.e;

            // Either zero?
            if (!xc[0] || !yc[0]) {
              if (yc[0]) {
                y.s = -b;
              } else if (xc[0]) {
                y = new Big(x);
              } else {
                y.s = 1;
              }
              return y;
            }

            // Determine which is the bigger number. Prepend zeros to equalise exponents.
            if ((a = xe - ye)) {
              if ((xlty = a < 0)) {
                a = -a;
                t = xc;
              } else {
                ye = xe;
                t = yc;
              }

              t.reverse();
              for (b = a; b--; ) t.push(0);
              t.reverse();
            } else {
              // Exponents equal. Check digit by digit.
              j = ((xlty = xc.length < yc.length) ? xc : yc).length;

              for (a = b = 0; b < j; b++) {
                if (xc[b] != yc[b]) {
                  xlty = xc[b] < yc[b];
                  break;
                }
              }
            }

            // x < y? Point xc to the array of the bigger number.
            if (xlty) {
              t = xc;
              xc = yc;
              yc = t;
              y.s = -y.s;
            }

            /*
             * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
             * needs to start at yc.length.
             */
            if ((b = (j = yc.length) - (i = xc.length)) > 0)
              for (; b--; ) xc[i++] = 0;

            // Subtract yc from xc.
            for (b = i; j > a; ) {
              if (xc[--j] < yc[j]) {
                for (i = j; i && !xc[--i]; ) xc[i] = 9;
                --xc[i];
                xc[j] += 10;
              }

              xc[j] -= yc[j];
            }

            // Remove trailing zeros.
            for (; xc[--b] === 0; ) xc.pop();

            // Remove leading zeros and adjust exponent accordingly.
            for (; xc[0] === 0; ) {
              xc.shift();
              --ye;
            }

            if (!xc[0]) {
              // n - n = +0
              y.s = 1;

              // Result must be zero.
              xc = [(ye = 0)];
            }

            y.c = xc;
            y.e = ye;

            return y;
          };

          /*
           * Return a new Big whose value is the value of this Big modulo the value of Big y.
           */
          P.mod = function (y) {
            var ygtx,
              x = this,
              Big = x.constructor,
              a = x.s,
              b = (y = new Big(y)).s;

            if (!y.c[0]) {
              throw Error(DIV_BY_ZERO);
            }

            x.s = y.s = 1;
            ygtx = y.cmp(x) == 1;
            x.s = a;
            y.s = b;

            if (ygtx) return new Big(x);

            a = Big.DP;
            b = Big.RM;
            Big.DP = Big.RM = 0;
            x = x.div(y);
            Big.DP = a;
            Big.RM = b;

            return this.minus(x.times(y));
          };

          /*
           * Return a new Big whose value is the value of this Big negated.
           */
          P.neg = function () {
            var x = new this.constructor(this);
            x.s = -x.s;
            return x;
          };

          /*
           * Return a new Big whose value is the value of this Big plus the value of Big y.
           */
          P.plus = P.add = function (y) {
            var e,
              k,
              t,
              x = this,
              Big = x.constructor;

            y = new Big(y);

            // Signs differ?
            if (x.s != y.s) {
              y.s = -y.s;
              return x.minus(y);
            }

            var xe = x.e,
              xc = x.c,
              ye = y.e,
              yc = y.c;

            // Either zero?
            if (!xc[0] || !yc[0]) {
              if (!yc[0]) {
                if (xc[0]) {
                  y = new Big(x);
                } else {
                  y.s = x.s;
                }
              }
              return y;
            }

            xc = xc.slice();

            // Prepend zeros to equalise exponents.
            // Note: reverse faster than unshifts.
            if ((e = xe - ye)) {
              if (e > 0) {
                ye = xe;
                t = yc;
              } else {
                e = -e;
                t = xc;
              }

              t.reverse();
              for (; e--; ) t.push(0);
              t.reverse();
            }

            // Point xc to the longer array.
            if (xc.length - yc.length < 0) {
              t = yc;
              yc = xc;
              xc = t;
            }

            e = yc.length;

            // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
            for (k = 0; e; xc[e] %= 10)
              k = ((xc[--e] = xc[e] + yc[e] + k) / 10) | 0;

            // No need to check for zero, as +x + +y != 0 && -x + -y != 0

            if (k) {
              xc.unshift(k);
              ++ye;
            }

            // Remove trailing zeros.
            for (e = xc.length; xc[--e] === 0; ) xc.pop();

            y.c = xc;
            y.e = ye;

            return y;
          };

          /*
           * Return a Big whose value is the value of this Big raised to the power n.
           * If n is negative, round to a maximum of Big.DP decimal places using rounding
           * mode Big.RM.
           *
           * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
           */
          P.pow = function (n) {
            var x = this,
              one = new x.constructor("1"),
              y = one,
              isneg = n < 0;

            if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
              throw Error(INVALID + "exponent");
            }

            if (isneg) n = -n;

            for (;;) {
              if (n & 1) y = y.times(x);
              n >>= 1;
              if (!n) break;
              x = x.times(x);
            }

            return isneg ? one.div(y) : y;
          };

          /*
           * Return a new Big whose value is the value of this Big rounded to a maximum precision of sd
           * significant digits using rounding mode rm, or Big.RM if rm is not specified.
           *
           * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
           * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
           */
          P.prec = function (sd, rm) {
            if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
              throw Error(INVALID + "precision");
            }
            return round(new this.constructor(this), sd, rm);
          };

          /*
           * Return a new Big whose value is the value of this Big rounded to a maximum of dp decimal places
           * using rounding mode rm, or Big.RM if rm is not specified.
           * If dp is negative, round to an integer which is a multiple of 10**-dp.
           * If dp is not specified, round to 0 decimal places.
           *
           * dp? {number} Integer, -MAX_DP to MAX_DP inclusive.
           * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
           */
          P.round = function (dp, rm) {
            if (dp === UNDEFINED) dp = 0;
            else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) {
              throw Error(INVALID_DP);
            }
            return round(new this.constructor(this), dp + this.e + 1, rm);
          };

          /*
           * Return a new Big whose value is the square root of the value of this Big, rounded, if
           * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
           */
          P.sqrt = function () {
            var r,
              c,
              t,
              x = this,
              Big = x.constructor,
              s = x.s,
              e = x.e,
              half = new Big("0.5");

            // Zero?
            if (!x.c[0]) return new Big(x);

            // Negative?
            if (s < 0) {
              throw Error(NAME + "No square root");
            }

            // Estimate.
            s = Math.sqrt(x + "");

            // Math.sqrt underflow/overflow?
            // Re-estimate: pass x coefficient to Math.sqrt as integer, then adjust the result exponent.
            if (s === 0 || s === 1 / 0) {
              c = x.c.join("");
              if (!((c.length + e) & 1)) c += "0";
              s = Math.sqrt(c);
              e = (((e + 1) / 2) | 0) - (e < 0 || e & 1);
              r = new Big(
                (s == 1 / 0
                  ? "5e"
                  : (s = s.toExponential()).slice(0, s.indexOf("e") + 1)) + e
              );
            } else {
              r = new Big(s + "");
            }

            e = r.e + (Big.DP += 4);

            // Newton-Raphson iteration.
            do {
              t = r;
              r = half.times(t.plus(x.div(t)));
            } while (t.c.slice(0, e).join("") !== r.c.slice(0, e).join(""));

            return round(r, (Big.DP -= 4) + r.e + 1, Big.RM);
          };

          /*
           * Return a new Big whose value is the value of this Big times the value of Big y.
           */
          P.times = P.mul = function (y) {
            var c,
              x = this,
              Big = x.constructor,
              xc = x.c,
              yc = (y = new Big(y)).c,
              a = xc.length,
              b = yc.length,
              i = x.e,
              j = y.e;

            // Determine sign of result.
            y.s = x.s == y.s ? 1 : -1;

            // Return signed 0 if either 0.
            if (!xc[0] || !yc[0]) {
              y.c = [(y.e = 0)];
              return y;
            }

            // Initialise exponent of result as x.e + y.e.
            y.e = i + j;

            // If array xc has fewer digits than yc, swap xc and yc, and lengths.
            if (a < b) {
              c = xc;
              xc = yc;
              yc = c;
              j = a;
              a = b;
              b = j;
            }

            // Initialise coefficient array of result with zeros.
            for (c = new Array((j = a + b)); j--; ) c[j] = 0;

            // Multiply.

            // i is initially xc.length.
            for (i = b; i--; ) {
              b = 0;

              // a is yc.length.
              for (j = a + i; j > i; ) {
                // Current sum of products at this digit position, plus carry.
                b = c[j] + yc[i] * xc[j - i - 1] + b;
                c[j--] = b % 10;

                // carry
                b = (b / 10) | 0;
              }

              c[j] = b;
            }

            // Increment result exponent if there is a final carry, otherwise remove leading zero.
            if (b) ++y.e;
            else c.shift();

            // Remove trailing zeros.
            for (i = c.length; !c[--i]; ) c.pop();
            y.c = c;

            return y;
          };

          /*
           * Return a string representing the value of this Big in exponential notation rounded to dp fixed
           * decimal places using rounding mode rm, or Big.RM if rm is not specified.
           *
           * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
           * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
           */
          P.toExponential = function (dp, rm) {
            var x = this,
              n = x.c[0];

            if (dp !== UNDEFINED) {
              if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
                throw Error(INVALID_DP);
              }
              x = round(new x.constructor(x), ++dp, rm);
              for (; x.c.length < dp; ) x.c.push(0);
            }

            return stringify(x, true, !!n);
          };

          /*
           * Return a string representing the value of this Big in normal notation rounded to dp fixed
           * decimal places using rounding mode rm, or Big.RM if rm is not specified.
           *
           * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
           * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
           *
           * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
           * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
           */
          P.toFixed = function (dp, rm) {
            var x = this,
              n = x.c[0];

            if (dp !== UNDEFINED) {
              if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
                throw Error(INVALID_DP);
              }
              x = round(new x.constructor(x), dp + x.e + 1, rm);

              // x.e may have changed if the value is rounded up.
              for (dp = dp + x.e + 1; x.c.length < dp; ) x.c.push(0);
            }

            return stringify(x, false, !!n);
          };

          /*
           * Return a string representing the value of this Big.
           * Return exponential notation if this Big has a positive exponent equal to or greater than
           * Big.PE, or a negative exponent equal to or less than Big.NE.
           * Omit the sign for negative zero.
           */
          P.toJSON = P.toString = function () {
            var x = this,
              Big = x.constructor;
            return stringify(x, x.e <= Big.NE || x.e >= Big.PE, !!x.c[0]);
          };

          /*
           * Return the value of this Big as a primitve number.
           */
          P.toNumber = function () {
            var n = Number(stringify(this, true, true));
            if (this.constructor.strict === true && !this.eq(n.toString())) {
              throw Error(NAME + "Imprecise conversion");
            }
            return n;
          };

          /*
           * Return a string representing the value of this Big rounded to sd significant digits using
           * rounding mode rm, or Big.RM if rm is not specified.
           * Use exponential notation if sd is less than the number of digits necessary to represent
           * the integer part of the value in normal notation.
           *
           * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
           * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
           */
          P.toPrecision = function (sd, rm) {
            var x = this,
              Big = x.constructor,
              n = x.c[0];

            if (sd !== UNDEFINED) {
              if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
                throw Error(INVALID + "precision");
              }
              x = round(new Big(x), sd, rm);
              for (; x.c.length < sd; ) x.c.push(0);
            }

            return stringify(
              x,
              sd <= x.e || x.e <= Big.NE || x.e >= Big.PE,
              !!n
            );
          };

          /*
           * Return a string representing the value of this Big.
           * Return exponential notation if this Big has a positive exponent equal to or greater than
           * Big.PE, or a negative exponent equal to or less than Big.NE.
           * Include the sign for negative zero.
           */
          P.valueOf = function () {
            var x = this,
              Big = x.constructor;
            if (Big.strict === true) {
              throw Error(NAME + "valueOf disallowed");
            }
            return stringify(x, x.e <= Big.NE || x.e >= Big.PE, true);
          };

          // Export

          Big = _Big_();

          Big["default"] = Big.Big = Big;

          //AMD.
          if (typeof define === "function" && define.amd) {
            define(function () {
              return Big;
            });

            // Node and other CommonJS-like environments that support module.exports.
          } else if (typeof module !== "undefined" && module.exports) {
            module.exports = Big;

            //Browser.
          } else {
            GLOBAL.Big = Big;
          }
        })(this);
      },
      {},
    ],
    3: [
      function (require, module, exports) {
        "use strict";
        var __awaiter =
          (this && this.__awaiter) ||
          function (thisArg, _arguments, P, generator) {
            function adopt(value) {
              return value instanceof P
                ? value
                : new P(function (resolve) {
                    resolve(value);
                  });
            }
            return new (P || (P = Promise))(function (resolve, reject) {
              function fulfilled(value) {
                try {
                  step(generator.next(value));
                } catch (e) {
                  reject(e);
                }
              }
              function rejected(value) {
                try {
                  step(generator["throw"](value));
                } catch (e) {
                  reject(e);
                }
              }
              function step(result) {
                result.done
                  ? resolve(result.value)
                  : adopt(result.value).then(fulfilled, rejected);
              }
              step(
                (generator = generator.apply(thisArg, _arguments || [])).next()
              );
            });
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Contract =
          exports.defineReadOnly =
          exports.BaseContract =
            void 0;
        const encode_decode_transaction_1 = require("./utils/encode-decode-transaction");
        const fetchers_1 = require("./utils/fetchers");
        /**
         *
         * @param txnData
         * @example
         */
        function estimateGas(txnData) {
          // https://ethereum.stackexchange.com/questions/1570/what-does-intrinsic-gas-too-low-mean/1694
          txnData.split("").reduce((previousValue, currentValue) => {
            // 0 characters are 4 gwei, all others are 48 gwei
            const characterCost = currentValue === "0" ? 4 : 68;
            return previousValue + characterCost;
          }, 0);
        }
        class BaseContract {
          /**
           * @param addressOrName The ethereum address of the smart-contract
           * @param contractInterface The JSON ABI of the smart-contract (like http://api.etherscan.io/api?module=contract&action=getabi&address=0x090d4613473dee047c3f2706764f49e0821d256e&format=raw)
           * @param signerOrProvider An instantiated essential-eth provider
           * @example
           */
          constructor(addressOrName, contractInterface, signerOrProvider) {
            this._address = addressOrName;
            this._provider = signerOrProvider;
            contractInterface
              .filter((jsonABIArgument) => jsonABIArgument.type === "function")
              .forEach((jsonABIArgument) => {
                if (
                  "name" in jsonABIArgument &&
                  typeof jsonABIArgument.name === "string"
                ) {
                  defineReadOnly(this, jsonABIArgument.name, (..._args) =>
                    __awaiter(this, void 0, void 0, function* () {
                      let functionArguments = _args;
                      let options = {};
                      // remove options from encoding
                      const lastArg = _args[_args.length - 1];
                      if (
                        !Array.isArray(lastArg) &&
                        typeof lastArg === "object"
                      ) {
                        options = lastArg;
                        functionArguments = _args.slice(0, _args.length - 1);
                      }
                      const data = (0, encode_decode_transaction_1.encodeData)(
                        jsonABIArgument,
                        functionArguments
                      );
                      const decimalGas =
                        typeof options.gasLimit === "number"
                          ? options.gasLimit /* user passed in "gasLimit" directly */
                          : typeof (jsonABIArgument === null ||
                            jsonABIArgument === void 0
                              ? void 0
                              : jsonABIArgument.gas) ===
                            "number" /* ABI specified "gas". */
                          ? estimateGas(data)
                          : null;
                      const req = () =>
                        __awaiter(this, void 0, void 0, function* () {
                          return yield (0,
                          fetchers_1.post)(this._provider.selectRpcUrl(), (0, fetchers_1.buildRPCPostBody)("eth_call", [Object.assign({ to: this._address.toLowerCase(), data }, decimalGas ? { gas: `0x${decimalGas.toString(16)}` } : {}), "latest"]));
                        });
                      const nodeResponse = yield req();
                      return (0,
                      encode_decode_transaction_1.decodeRPCResponse)(jsonABIArgument, nodeResponse);
                    })
                  );
                }
              });
          }
        }
        exports.BaseContract = BaseContract;
        /**
         * Applies the unique contract's methods to the instantiated Contract in the constructor based-upon the provided ABI
         *
         * @param object
         * @param name
         * @param value
         * @example
         */
        function defineReadOnly(object, name, value) {
          Object.defineProperty(object, name, {
            enumerable: true,
            value: value,
            writable: false,
          });
        }
        exports.defineReadOnly = defineReadOnly;
        /**
         * @alpha
         * Only accepts ABIS in JSON format. This allows for stronger typing and assurances of data-types
         * Only read-only function calls currently supported.
         * @example
         * ```typescript
         * import { Contract, JsonRpcProvider } from 'essential-eth';
         * // UNI airdrop contract
         * const contractAddress = '0x090D4613473dEE047c3f2706764f49E0821D256e';
         * const provider = new JsonRpcProvider();
         *
         * const JSONABI = [
         *   {
         *     inputs: [
         *       {
         *         internalType: 'uint256',
         *         name: 'index',
         *         type: 'uint256',
         *       },
         *     ],
         *     name: 'isClaimed',
         *     outputs: [
         *       {
         *         internalType: 'bool',
         *         name: '',
         *         type: 'bool',
         *       },
         *     ],
         *     stateMutability: 'view',
         *     type: 'function',
         *   },
         * ]
         *
         * const contract = new Contract(
         *   contractAddress,
         *   JSONABI,
         *   provider,
         * );
         *
         * (async () => {
         *   // prints boolean as to whether index 0 has claimed airdrop or not
         *   console.log(await contract.isClaimed(0));
         * })()
         *
         *
         * ```
         */
        class Contract extends BaseContract {}
        exports.Contract = Contract;
      },
      { "./utils/encode-decode-transaction": 8, "./utils/fetchers": 9 },
    ],
    4: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.cleanBlock = void 0;
        const __1 = require("../..");
        const tiny_big_1 = require("../../shared/tiny-big/tiny-big");
        const clean_transaction_1 = require("./clean-transaction");
        const hex_to_decimal_1 = require("./hex-to-decimal");
        /**
         * Converts RPC block response to more JS-friendly format
         *
         * @param block the RPCBlock to clean
         * @param returnTransactionObjects whether or not to return the transactions specified in this block
         * @returns a cleaned block
         * @example
         * ```js
         * const rpcBlock = {
         *   number: '0x40f9de',
         *   hash: '0x4cbaa942e48a91108f38e2a250f6dbaff7fffe3027f5ebf76701929eed2b2970',
         *   parentHash: '0xc8de1e513f74cbc5cc77e2a39e4cada6504469a5d0e87200b708319c1e9ef154',
         *   sha3Uncles: '0x04d250716296c9662314b37c112e5ce8b1c9ad7fd7820a39482a3688a2078f2b',
         *   logsBloom: '0x0000400004000000040010100200000000000000000000000000000000000000001000000001000000000000000000000004010000000000000a800000000000040000000001000400000000000000000000000000000000000002000000000000000000000004000040000000800000000001000000000000000000000000000000000000000001000000000004200000000000000000000000000124400000000000000200100020000000000000000080000000000080001000000000000000000081000000000000000000008000000020000100000000200020100800000000000000000008002000000080001000020c00000000000000200000000000',
         *   transactionsRoot: '0xfc79f4f620cb69861ac67ceee5e1ddf3e45da95be230d4064be234f1ee491aa5',
         *   stateRoot: '0xfa5ef7e368997d70670b0ea3172aabefc2dee285786ce69c7165d8d854f8b292',
         *   receiptsRoot: '0x7fa0679e88fef8a8f7f5865dc4e6000ddcc267b14d2904948e3b1576a18a3bbd',
         *   miner: '0x1b7a75ef070ff49e6b9491a26403d799f2099ebd',
         *   difficulty: '0x47ede14fcbe635706e',
         *   totalDifficulty: '0x139e1de9b8404dedc5d30959',
         *   extraData: '0xce018c495249532d62613031656132',
         *   size: '0xb4f',
         *   gasLimit: '0x67c280',
         *   gasUsed: '0x56e2d',
         *   timestamp: '0x62648dc2',
         *   transactions: [
         *     '0xd53800afc69e55cc7a64b927803b46a5b4c5ddccbaafb6b32fe0ec883739b825',
         *     '0x4b8b07f35a1f911a80a0ffeebe3d3c41cd393b4d5e1ce0a408026705913d6760',
         *     '0xa50eac0ea8005cb1e4b95be4e64c24035d9c41adb164c49477c3169870f02fb1',
         *     '0x413e5293786f8b63e73adf0b74ab56067da4b564d01936b88b138d48cc414a42',
         *     '0xd4e4969365d144b0b987632dca36ba9e272254bdc687245987a57666d6afa148'
         *   ],
         *   uncles: [
         *     '0x36cd3869fd17a285b984dea8b705d34096e1fbdfe48df69ae530fbe921ba83fa'
         *   ],
         *   minimumGasPrice: '0x387ee40',
         *   bitcoinMergedMiningHeader: '0x0040502d717ae205da048b0ffb8e110603564d8677ca8bd3a54601000000000000000000e722e86bfebcae00bffb46c663fa0241b63a27f0c98fa710e421d5cc1afa2448d08d6462d9f809172f5e30aa',
         *   bitcoinMergedMiningCoinbaseTransaction: '0x00000000000001003f8757a906f0159f882f0968788a2e396b7bf8090e1b926fb2bb46789ac32d55082aca4e0800000000000000002b6a2952534b424c4f434b3a831a30935da1bd1e8631942fc7fa78f7a7b11d51ca39a1684d91a81f0040f9de00000000',
         *   bitcoinMergedMiningMerkleProof: '0xb53111a4e11bc19bf90268485d1b957d908ebc6a4cd9862aca3fc6ed3dcf3240b14c316de8521369d55dbfeb2b0116bcc10f40e999c4885e1bd2a08691bdea1c43862d590390a227a379d5677b958f1a23eecc16ac590ad675b8a4cea0c10da3ef597acb9ca1fe0a21fc408f09e0c7169d83aca8ddd636d8cc155f922e1d36c74b7cc11e9ee98dd1bf2100a55d59630c65da3db1575d58f165c5753c1779df90efcff9017b73cc32f4c87178bd0eae6a6dd0357047be70d6c4af17fcef097e80a9f1751447f4eee3831fc79f2d894934694149bcb99840a525f5128215eca6b54642af452ee7568a9281f40560afffd35725df31b98155d7813dea12e42f2a8052c7d98bcf62c9cdc66c40fb12b729b685a31aec4970ea5316640691ae5eb616808656a2bde4e9f5920ff178bf9d1f84e96a0d0bd048a3a8ca0d60970d02aacf7ecfb6e7feaec5c4a764873531cfd630e9430840cfe8b88154da25d6b94b706fe678d0efc1ecafed5a1f539e34552bea65622513b663e17e121f3c4548942584',
         *   hashForMergedMining: '0x831a30935da1bd1e8631942fc7fa78f7a7b11d51ca39a1684d91a81f0040f9de',
         *   paidFees: '0x1fb451615b58',
         *   cumulativeDifficulty: '0x8fdbe015f7248cf993'
         * };
         * const returnTransactionObjects = false;
         *
         * await cleanBlock(rpcBlock, returnTransactionObjects);
         * // {
         * //   number: 4258270,
         * //   hash: '0x4cbaa942e48a91108f38e2a250f6dbaff7fffe3027f5ebf76701929eed2b2970',
         * //   parentHash: '0xc8de1e513f74cbc5cc77e2a39e4cada6504469a5d0e87200b708319c1e9ef154',
         * //   sha3Uncles: '0x04d250716296c9662314b37c112e5ce8b1c9ad7fd7820a39482a3688a2078f2b',
         * //   logsBloom: '0x0000400004000000040010100200000000000000000000000000000000000000001000000001000000000000000000000004010000000000000a800000000000040000000001000400000000000000000000000000000000000002000000000000000000000004000040000000800000000001000000000000000000000000000000000000000001000000000004200000000000000000000000000124400000000000000200100020000000000000000080000000000080001000000000000000000081000000000000000000008000000020000100000000200020100800000000000000000008002000000080001000020c00000000000000200000000000',
         * //   transactionsRoot: '0xfc79f4f620cb69861ac67ceee5e1ddf3e45da95be230d4064be234f1ee491aa5',
         * //   stateRoot: '0xfa5ef7e368997d70670b0ea3172aabefc2dee285786ce69c7165d8d854f8b292',
         * //   receiptsRoot: '0x7fa0679e88fef8a8f7f5865dc4e6000ddcc267b14d2904948e3b1576a18a3bbd',
         * //   miner: '0x1b7A75Ef070Ff49E6B9491a26403D799f2099EbD',
         * //   difficulty: Big {
         * //     s: 1,
         * //     e: 21,
         * //     c: [Array],
         * //     constructor: [Function],
         * //     padAndChop: [Function (anonymous)]
         * //   },
         * //   totalDifficulty: Big {
         * //     s: 1,
         * //     e: 27,
         * //     c: [Array],
         * //     constructor: [Function],
         * //     padAndChop: [Function (anonymous)]
         * //   },
         * //   extraData: '0xce018c495249532d62613031656132',
         * //   size: Big {
         * //     s: 1,
         * //     e: 3,
         * //     c: [Array],
         * //     constructor: [Function],
         * //     padAndChop: [Function (anonymous)]
         * //   },
         * //   gasLimit: Big {
         * //     s: 1,
         * //     e: 6,
         * //     c: [Array],
         * //     constructor: [Function],
         * //     padAndChop: [Function (anonymous)]
         * //   },
         * //   gasUsed: Big {
         * //     s: 1,
         * //     e: 5,
         * //     c: [Array],
         * //     constructor: [Function],
         * //     padAndChop: [Function (anonymous)]
         * //   },
         * //   timestamp: Big {
         * //     s: 1,
         * //     e: 9,
         * //     c: [Array],
         * //     constructor: [Function],
         * //     padAndChop: [Function (anonymous)]
         * //   },
         * //   transactions: [
         * //     '0xd53800afc69e55cc7a64b927803b46a5b4c5ddccbaafb6b32fe0ec883739b825',
         * //     '0x4b8b07f35a1f911a80a0ffeebe3d3c41cd393b4d5e1ce0a408026705913d6760',
         * //     '0xa50eac0ea8005cb1e4b95be4e64c24035d9c41adb164c49477c3169870f02fb1',
         * //     '0x413e5293786f8b63e73adf0b74ab56067da4b564d01936b88b138d48cc414a42',
         * //     '0xd4e4969365d144b0b987632dca36ba9e272254bdc687245987a57666d6afa148'
         * //   ],
         * //   uncles: [
         * //     '0x36cd3869fd17a285b984dea8b705d34096e1fbdfe48df69ae530fbe921ba83fa'
         * //   ],
         * //   minimumGasPrice: '0x387ee40',
         * //   bitcoinMergedMiningHeader: '0x0040502d717ae205da048b0ffb8e110603564d8677ca8bd3a54601000000000000000000e722e86bfebcae00bffb46c663fa0241b63a27f0c98fa710e421d5cc1afa2448d08d6462d9f809172f5e30aa',
         * //   bitcoinMergedMiningCoinbaseTransaction: '0x00000000000001003f8757a906f0159f882f0968788a2e396b7bf8090e1b926fb2bb46789ac32d55082aca4e0800000000000000002b6a2952534b424c4f434b3a831a30935da1bd1e8631942fc7fa78f7a7b11d51ca39a1684d91a81f0040f9de00000000',
         * //   bitcoinMergedMiningMerkleProof: '0xb53111a4e11bc19bf90268485d1b957d908ebc6a4cd9862aca3fc6ed3dcf3240b14c316de8521369d55dbfeb2b0116bcc10f40e999c4885e1bd2a08691bdea1c43862d590390a227a379d5677b958f1a23eecc16ac590ad675b8a4cea0c10da3ef597acb9ca1fe0a21fc408f09e0c7169d83aca8ddd636d8cc155f922e1d36c74b7cc11e9ee98dd1bf2100a55d59630c65da3db1575d58f165c5753c1779df90efcff9017b73cc32f4c87178bd0eae6a6dd0357047be70d6c4af17fcef097e80a9f1751447f4eee3831fc79f2d894934694149bcb99840a525f5128215eca6b54642af452ee7568a9281f40560afffd35725df31b98155d7813dea12e42f2a8052c7d98bcf62c9cdc66c40fb12b729b685a31aec4970ea5316640691ae5eb616808656a2bde4e9f5920ff178bf9d1f84e96a0d0bd048a3a8ca0d60970d02aacf7ecfb6e7feaec5c4a764873531cfd630e9430840cfe8b88154da25d6b94b706fe678d0efc1ecafed5a1f539e34552bea65622513b663e17e121f3c4548942584',
         * //   hashForMergedMining: '0x831a30935da1bd1e8631942fc7fa78f7a7b11d51ca39a1684d91a81f0040f9de',
         * //   paidFees: '0x1fb451615b58',
         * //   cumulativeDifficulty: '0x8fdbe015f7248cf993'
         * // }
         */
        function cleanBlock(block, returnTransactionObjects) {
          const cleanedBlock = Object.assign({}, block);
          Object.keys(block).forEach((key) => {
            // pending blocks have null instead of a difficulty
            // pending blocks have null instead of a miner address
            if (!block[key]) return;
            switch (key) {
              case "difficulty":
              case "totalDifficulty":
              case "gasLimit":
              case "gasUsed":
              case "size":
              case "timestamp":
              case "baseFeePerGas":
                cleanedBlock[key] = (0, tiny_big_1.tinyBig)(
                  (0, hex_to_decimal_1.hexToDecimal)(block[key])
                );
                break;
              case "number":
                cleanedBlock[key] = Number(
                  (0, hex_to_decimal_1.hexToDecimal)(block[key])
                );
                break;
              case "miner":
                cleanedBlock[key] = (0, __1.toChecksumAddress)(block[key]);
                break;
            }
          });
          // for all full transactions
          if (returnTransactionObjects) {
            const txns = block.transactions;
            txns.forEach((transaction, index) => {
              cleanedBlock.transactions[index] = (0,
              clean_transaction_1.cleanTransaction)(transaction);
            });
          }
          return cleanedBlock;
        }
        exports.cleanBlock = cleanBlock;
      },
      {
        "../..": 12,
        "../../shared/tiny-big/tiny-big": 20,
        "./clean-transaction": 7,
        "./hex-to-decimal": 10,
      },
    ],
    5: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.cleanLog = void 0;
        const to_checksum_address_1 = require("../../utils/to-checksum-address");
        const hex_to_decimal_1 = require("./hex-to-decimal");
        /**
         * Converts RPC log receipt response to more JS-friendly format
         *
         * @param log the log to clean
         * @param receiptLog if the log is part of a transaction receipt. Used to remove certain keys from log
         * @example
         */
        function cleanLog(log, receiptLog) {
          const cleanedLog = Object.assign({}, log);
          Object.keys(log).forEach((key) => {
            switch (key) {
              case "address":
                cleanedLog[key] = (0, to_checksum_address_1.toChecksumAddress)(
                  log[key]
                );
                break;
              case "blockNumber":
              case "logIndex":
              case "transactionIndex":
                cleanedLog[key] = Number(
                  (0, hex_to_decimal_1.hexToDecimal)(log[key])
                );
                break;
              case "removed":
                if (receiptLog) {
                  delete cleanedLog[key];
                } else if (log[key] == null) {
                  cleanedLog[key] === false;
                }
                break;
            }
          });
          return cleanedLog;
        }
        exports.cleanLog = cleanLog;
      },
      { "../../utils/to-checksum-address": 33, "./hex-to-decimal": 10 },
    ],
    6: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.cleanTransactionReceipt = void 0;
        const __1 = require("../..");
        const clean_log_1 = require("./clean-log");
        const clean_transaction_1 = require("./clean-transaction");
        const hex_to_decimal_1 = require("./hex-to-decimal");
        /**
         * Converts RPC transaction receipt response to more JS-friendly format
         *
         * @param transactionReceipt the transaction receipt to clean
         * @returns a cleaned transaction receipt
         * @example
         * ```javascript
         * const RPCTransactionReceipt = { blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: '0xe28f62', contractAddress: null, cumulativeGasUsed: '0x37a2b9', effectiveGasPrice: '0x62df1c62c', from: '0x642824fab1d0141073ed74326332950bec4701e3', gasUsed: '0x1a325', logs: [ { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 84, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x000000000000000000000000000000000000000000000000000000000000074d' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 85, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x000000000000000000000000000000000000000000000000000000000000074e' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 86, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x000000000000000000000000000000000000000000000000000000000000074f' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 87, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000750' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 88, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000751' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 89, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000752' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 90, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000753' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 91, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000754' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 92, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000755' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 93, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000756' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 } ], logsBloom: '0x20000080004000000000000400000000000001000000000400000000000000000000000000000000000000000008000000000000000000000000000000004000000000000008000000000008000000010080000014000004000000000000000000100000020800000000000000001800000080000000002000000010000000000000000000000200000200000000002000000000000400000000000000000000000000000000000000000040000000000000000100000000000000000000040002100002000000000000080000000000000100000002000000040000001220000000000000000000000000000000000000000000000000000000000000004000', status: '0x1', to: '0x84f80ea01e26b7c11bdd241970982c7eeab6ddcc', transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: '0x29', type: '0x2' }
         * cleanTransactionReceipt(RPCTransactionReceipt);
         * // { blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, contractAddress: null, cumulativeGasUsed: Big { s: 1, e: 6, c: [ 3, 6, 4, 6, 1, 3, 7 ], constructor: { [λ: Big] DP: 20, RM: 1, NE: -7, PE: 21, strict: false, roundDown: 0, roundHalfUp: 1, roundHalfEven: 2, roundUp: 3, Big: [Circular], default: [Circular] }, padAndChop: [λ] }, effectiveGasPrice: Big { s: 1, e: 10, c: [ 2, 6, 5, 4, 0, 6, 2, 3, 4, 0, 4 ], constructor: { [λ: Big] DP: 20, RM: 1, NE: -7, PE: 21, strict: false, roundDown: 0, roundHalfUp: 1, roundHalfEven: 2, roundUp: 3, Big: [Circular], default: [Circular] }, padAndChop: [λ] }, from: '0x642824FaB1D0141073ed74326332950bEc4701e3', gasUsed: Big { s: 1, e: 5, c: [ 1, 0, 7, 3, 0, 1 ], constructor: { [λ: Big] DP: 20, RM: 1, NE: -7, PE: 21, strict: false, roundDown: 0, roundHalfUp: 1, roundHalfEven: 2, roundUp: 3, Big: [Circular], default: [Circular] }, padAndChop: [λ] }, logs: [ { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 84, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x000000000000000000000000000000000000000000000000000000000000074d' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 85, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x000000000000000000000000000000000000000000000000000000000000074e' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 86, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x000000000000000000000000000000000000000000000000000000000000074f' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 87, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000750' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 88, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000751' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 89, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000752' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 90, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000753' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 91, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000754' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 92, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000755' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 }, { address: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, data: '0x', logIndex: 93, topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000642824fab1d0141073ed74326332950bec4701e3', '0x0000000000000000000000000000000000000000000000000000000000000756' ], transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41 } ], logsBloom: '0x20000080004000000000000400000000000001000000000400000000000000000000000000000000000000000008000000000000000000000000000000004000000000000008000000000008000000010080000014000004000000000000000000100000020800000000000000001800000080000000002000000010000000000000000000000200000200000000002000000000000400000000000000000000000000000000000000000040000000000000000100000000000000000000040002100002000000000000080000000000000100000002000000040000001220000000000000000000000000000000000000000000000000000000000000004000', status: 1, to: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', transactionHash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', transactionIndex: 41, type: 2, byzantium: true, confirmations: 40 }
         * ```
         */
        function cleanTransactionReceipt(transactionReceipt) {
          const cleanedTransaction = (0, clean_transaction_1.cleanTransaction)(
            transactionReceipt
          );
          const cleanedTransactionReceipt = Object.assign(
            {},
            cleanedTransaction
          );
          Object.keys(transactionReceipt).forEach((key) => {
            if (!transactionReceipt[key]) return;
            switch (key) {
              case "status":
                cleanedTransactionReceipt[key] = Number(
                  (0, hex_to_decimal_1.hexToDecimal)(transactionReceipt[key])
                );
                break;
              case "contractAddress":
                if (transactionReceipt[key]) {
                  cleanedTransactionReceipt[key] = (0, __1.toChecksumAddress)(
                    transactionReceipt[key]
                  );
                }
                break;
              case "cumulativeGasUsed":
              case "effectiveGasPrice":
              case "gasUsed":
                cleanedTransactionReceipt[key] = (0, __1.tinyBig)(
                  (0, hex_to_decimal_1.hexToDecimal)(transactionReceipt[key])
                );
                break;
              case "logs":
                transactionReceipt[key].forEach((log, index) => {
                  cleanedTransactionReceipt[key][index] = (0,
                  clean_log_1.cleanLog)(log, true);
                });
            }
          });
          cleanedTransactionReceipt.byzantium =
            cleanedTransactionReceipt.blockNumber >= 4370000;
          return cleanedTransactionReceipt;
        }
        exports.cleanTransactionReceipt = cleanTransactionReceipt;
      },
      {
        "../..": 12,
        "./clean-log": 5,
        "./clean-transaction": 7,
        "./hex-to-decimal": 10,
      },
    ],
    7: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.cleanTransaction = void 0;
        const __1 = require("../..");
        const hex_to_decimal_1 = require("./hex-to-decimal");
        /**
         * Converts RPC transaction response to more JS-friendly format
         *
         * @param transaction the transaction to clean
         * @returns a cleaned transaction
         * @example
         * ```javascript
         * const RPCTransaction = { accessList: [], blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: '0xe28f62', chainId: '0x1', from: '0x642824fab1d0141073ed74326332950bec4701e3', gas: '0x274b7', gasPrice: '0x62df1c62c', hash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', input: '0xa0712d68000000000000000000000000000000000000000000000000000000000000000a', maxFeePerGas: '0x98808e3f0', maxPriorityFeePerGas: '0x3b9aca00', nonce: '0x42', r: '0x304682f8b22006dd1347c3722f6e43a5ad8e3a1ae51939cc0d6f07981602f5c0', s: '0x207ad110eb5c014cb628814b92396785fabfbe74542293300eeadf156f50f105', to: '0x84f80ea01e26b7c11bdd241970982c7eeab6ddcc', transactionIndex: '0x29', type: '0x2', v: '0x1', value: '0x470de4df820000' }
         * cleanTransaction(RPCTransaction);
         * // { accessList: [], blockHash: '0x03ddc6a835462f750fcaf5ab511d8c48121b0813e3e80de84d7adc3ef192b7bf', blockNumber: 14847842, chainId: 1, from: '0x642824FaB1D0141073ed74326332950bEc4701e3', gas: Big { s: 1, e: 5, c: [ 1, 6, 0, 9, 5, 1 ], constructor: { [λ: Big] DP: 20, RM: 1, NE: -7, PE: 21, strict: false, roundDown: 0, roundHalfUp: 1, roundHalfEven: 2, roundUp: 3, Big: [Circular], default: [Circular] }, padAndChop: [λ] }, gasPrice: Big { s: 1, e: 10, c: [ 2, 6, 5, 4, 0, 6, 2, 3, 4, 0, 4 ], constructor: { [λ: Big] DP: 20, RM: 1, NE: -7, PE: 21, strict: false, roundDown: 0, roundHalfUp: 1, roundHalfEven: 2, roundUp: 3, Big: [Circular], default: [Circular] }, padAndChop: [λ] }, hash: '0xd0befcb9d10a89aba2d488534811bf5c62a889e2499d23cdd83c2a2200cde873', input: '0xa0712d68000000000000000000000000000000000000000000000000000000000000000a', maxFeePerGas: Big { s: 1, e: 10, c: [ 4, 0, 9, 3, 6, 9, 8, 9, 6, 8 ], constructor: { [λ: Big] DP: 20, RM: 1, NE: -7, PE: 21, strict: false, roundDown: 0, roundHalfUp: 1, roundHalfEven: 2, roundUp: 3, Big: [Circular], default: [Circular] }, padAndChop: [λ] }, maxPriorityFeePerGas: Big { s: 1, e: 9, c: [ 1 ], constructor: { [λ: Big] DP: 20, RM: 1, NE: -7, PE: 21, strict: false, roundDown: 0, roundHalfUp: 1, roundHalfEven: 2, roundUp: 3, Big: [Circular], default: [Circular] }, padAndChop: [λ] }, nonce: 66, r: '0x304682f8b22006dd1347c3722f6e43a5ad8e3a1ae51939cc0d6f07981602f5c0', s: '0x207ad110eb5c014cb628814b92396785fabfbe74542293300eeadf156f50f105', to: '0x84F80EA01e26B7C11bdd241970982C7EEAb6DdcC', transactionIndex: 41, type: 2, v: 1, value: Big { s: 1, e: 16, c: [ 2 ], constructor: { [λ: Big] DP: 20, RM: 1, NE: -7, PE: 21, strict: false, roundDown: 0, roundHalfUp: 1, roundHalfEven: 2, roundUp: 3, Big: [Circular], default: [Circular] }, padAndChop: [λ] }, confirmations: 53 }
         * ```
         */
        function cleanTransaction(transaction) {
          const cleanedTransaction = Object.assign({}, transaction);
          Object.keys(transaction).forEach((key) => {
            // pending blocks have null instead of a difficulty
            // pending blocks have null instead of a miner address
            if (!transaction[key]) return;
            switch (key) {
              case "blockNumber":
              case "chainId":
              case "transactionIndex":
              case "type":
              case "v":
                cleanedTransaction[key] = Number(
                  (0, hex_to_decimal_1.hexToDecimal)(transaction[key])
                );
                break;
              case "from":
              case "to":
                if (transaction[key]) {
                  cleanedTransaction[key] = (0, __1.toChecksumAddress)(
                    transaction[key]
                  );
                }
                break;
              case "value":
              case "gas":
              case "gasPrice":
              case "maxFeePerGas":
              case "maxPriorityFeePerGas":
              case "nonce":
                cleanedTransaction[key] = (0, __1.tinyBig)(
                  (0, hex_to_decimal_1.hexToDecimal)(transaction[key])
                );
                break;
            }
          });
          return cleanedTransaction;
        }
        exports.cleanTransaction = cleanTransaction;
      },
      { "../..": 12, "./hex-to-decimal": 10 },
    ],
    8: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.decodeRPCResponse =
          exports.encodeData =
          exports.hexFalse =
            void 0;
        const sha3_1 = require("sha3");
        const __1 = require("../..");
        const hex_to_decimal_1 = require("./hex-to-decimal");
        exports.hexFalse = "0".repeat(64);
        const hexTrue = "0".repeat(63) + "1";
        /**
         * Expands an integer type to use a default of 256 bits. Used for consistency; not required in Solidity
         *
         * @see https://ethereum.stackexchange.com/questions/43241/why-write-uint256-instead-of-uint-if-theyre-the-same-thing
         * @param type the type to explicitly define as 256 bits
         * @returns the integer type expanded to explicitly be 256 bits when possible
         * @example
         * ```javascript
         * expandType('uint[]');
         * // 'uint256[]'
         * ```
         */
        function expandType(type) {
          // https://docs.soliditylang.org/en/v0.8.7/types.html#integers
          if (type === "uint[]") {
            return "uint256[]";
          } else if (type === "int[]") {
            return "int256[]";
          }
          return type;
        }
        /**
         *
         * @param jsonABIArgument
         * @param args
         * @example
         */
        function encodeData(jsonABIArgument, args) {
          const hash = new sha3_1.Keccak(256);
          /* first 4 bytes will create the data parameter */
          const functionString = `${
            jsonABIArgument.name
          }(${jsonABIArgument.inputs.map((input) => expandType(input.type))})`;
          // encoding learnt from https://ethereum.stackexchange.com/questions/3514/how-to-call-a-contract-method-using-the-eth-call-json-rpc-api
          const functionHash = hash.update(functionString).digest("hex");
          // no arrays
          const jsonABIInputsLength = jsonABIArgument.inputs.length;
          let shouldValidateInputLength = true;
          // inputs contains 1 or more arrays
          if (
            jsonABIArgument.inputs.find((input) => input.type.includes("["))
          ) {
            shouldValidateInputLength = false;
          }
          if (
            shouldValidateInputLength &&
            args.length !== jsonABIInputsLength
          ) {
            throw new Error(
              `args inputs  of "${args.length}" does not match expected length of "${jsonABIArgument.inputs.length}"`
            );
          }
          const argsWithTypes = (jsonABIArgument.inputs || []).reduce(
            (acc, input, i) => {
              var _a;
              if (input.type.includes("[")) {
                // strip array and length like "[2]" from type
                const basicType =
                  (_a = /([^[]*)\[.*$/g.exec(input.type)) === null ||
                  _a === void 0
                    ? void 0
                    : _a[1];
                args.forEach((arg) => {
                  acc = acc.concat([[arg, basicType]]);
                });
                return acc;
              } else {
                return acc.concat([[args[i], input.type]]);
              }
            },
            []
          );
          const encodedArgs = argsWithTypes.map(([arg, inputType]) => {
            let rawArg = arg;
            switch (inputType) {
              case "bool":
                return arg ? hexTrue : exports.hexFalse;
              case "address":
                // remove leading "0x"
                rawArg = arg.replace(/^0x/g, "").toLowerCase();
                break;
              default:
                if (inputType.startsWith("bytes")) {
                  // encode each character to hex
                  const argEncoded = rawArg
                    .split("")
                    .map((character) => character.charCodeAt(0).toString(16))
                    .join("");
                  const paddedEncodedArg = argEncoded.padEnd(64, "0");
                  return paddedEncodedArg;
                } else if (inputType === "uint256") {
                  const argEncoded = BigInt(arg).toString(16);
                  const paddedEncodedArg = argEncoded.padStart(64, "0");
                  return paddedEncodedArg;
                } else if (inputType.startsWith("uint")) {
                  break;
                } else {
                  throw new Error(
                    `essential-eth does not yet support "${inputType}" inputs. Make a PR today!"`
                  );
                }
            }
            const argEncoded = rawArg.toString(16);
            const paddedEncodedArg = argEncoded.padStart(64, "0");
            return paddedEncodedArg;
          });
          const functionEncoded = functionHash.slice(0, 8);
          const data = `0x${functionEncoded}${encodedArgs.join("")}`;
          return data;
        }
        exports.encodeData = encodeData;
        /**
         *
         * @param jsonABIArgument
         * @param nodeResponse
         * @example
         */
        function decodeRPCResponse(jsonABIArgument, nodeResponse) {
          const rawOutputs = jsonABIArgument.outputs;
          // chunk response every 64 characters
          const encodedOutputs = nodeResponse.slice(2).match(/.{1,64}/g);
          const outputs = (encodedOutputs || []).map((output, i) => {
            const outputType = (rawOutputs || [])[i].type;
            switch (outputType) {
              case "bool":
                return output === hexTrue;
              case "address":
                /* address types have 26 leading zeroes to remove */
                return (0, __1.toChecksumAddress)(`0x${output.slice(24)}`);
              case "uint256":
                return (0, __1.tinyBig)(
                  (0, hex_to_decimal_1.hexToDecimal)(`0x${output}`)
                );
              case "bytes32":
                return `0x${output}`;
              case "uint8":
                return Number(
                  (0, hex_to_decimal_1.hexToDecimal)(`0x${output}`)
                );
              default:
                throw new Error(
                  `essential-eth does not yet support "${outputType}" outputs. Make a PR today!"`
                );
            }
          });
          return outputs.length === 1 ? outputs[0] : outputs;
        }
        exports.decodeRPCResponse = decodeRPCResponse;
      },
      { "../..": 12, "./hex-to-decimal": 10, sha3: 37 },
    ],
    9: [
      function (require, module, exports) {
        "use strict";
        var __awaiter =
          (this && this.__awaiter) ||
          function (thisArg, _arguments, P, generator) {
            function adopt(value) {
              return value instanceof P
                ? value
                : new P(function (resolve) {
                    resolve(value);
                  });
            }
            return new (P || (P = Promise))(function (resolve, reject) {
              function fulfilled(value) {
                try {
                  step(generator.next(value));
                } catch (e) {
                  reject(e);
                }
              }
              function rejected(value) {
                try {
                  step(generator["throw"](value));
                } catch (e) {
                  reject(e);
                }
              }
              function step(result) {
                result.done
                  ? resolve(result.value)
                  : adopt(result.value).then(fulfilled, rejected);
              }
              step(
                (generator = generator.apply(thisArg, _arguments || [])).next()
              );
            });
          };
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.buildRPCPostBody = exports.post = void 0;
        const isomorphic_unfetch_1 = __importDefault(
          require("isomorphic-unfetch")
        );
        /**
         * Makes a post request with the specified JSON data, normally to the a Ethereum JSON RPC API endpoint
         *
         * @param url the URL to send the request to
         * @param body the body data (JSON) to send with the request
         * @returns the JSON response from the server
         * @example
         * ```javascript
         * post('https://free-eth-node.com/api/eth', { jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] });
         * // '0x66fa8dbfd'
         *
         * post('https://free-eth-node.com/api/eth', { jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [ '0x4a986a6dCA6dbf99bC3d17F8D71aFb0d60e740f8', 'latest' ] });
         * // '0x312faeb995df61d4'
         * ```
         */
        function post(url, body) {
          return (0, isomorphic_unfetch_1.default)(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          })
            .then((r) =>
              __awaiter(this, void 0, void 0, function* () {
                const t = yield r.text();
                try {
                  return JSON.parse(t);
                } catch (_a) {
                  throw new Error(`Invalid JSON RPC response: "${t}"`);
                }
              })
            )
            .then((response) => {
              const result =
                response === null || response === void 0
                  ? void 0
                  : response.result;
              if (!result) {
                throw new Error(
                  `Invalid JSON RPC response: ${JSON.stringify(response)}`
                );
              }
              return response.result;
            });
        }
        exports.post = post;
        /**
         * Prepares data to be sent using the {@link post} function. Data is prepared per the {@link https://en.wikipedia.org/wiki/JSON-RPC#Examples JSON RPC v2 spec}
         *
         * @param method the RPC method to be invoked
         * @param params the parameters to be passed to the defined method
         * @returns a POST method body matching the {@link https://en.wikipedia.org/wiki/JSON-RPC#Examples JSON RPC v2 spec}
         * @example
         * ```javascript
         * buildRPCPostBody('eth_gasPrice', []);
         * // { jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] }
         *
         * buildRPCPostBody('eth_getBalance', ['0x407d73d8a49eeb85d32cf465507dd71d507100c1', 'latest']);
         * // { jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [ '0x4a986a6dCA6dbf99bC3d17F8D71aFb0d60e740f8', 'latest' ] }
         * ```
         */
        function buildRPCPostBody(method, params) {
          return {
            jsonrpc: "2.0",
            id: 1,
            method,
            params,
          };
        }
        exports.buildRPCPostBody = buildRPCPostBody;
      },
      { "isomorphic-unfetch": 36 },
    ],
    10: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.hexToDecimal = void 0;
        /**
         * Converts a hexadecimal string it's decimal equivalent.
         * This is needed instead of parseInt because parseInt loses precision.
         *
         * @param hex the hex string to be converted to decimal
         * @returns a decimal value equivalent to the hex string given
         * @example
         * ```javascript
         * hexToDecimal('0x34');
         * // 52
         * ```
         * @example
         * ```javascript
         * hexToDecimal('0x628608');
         * // 6456840
         * ```
         */
        function hexToDecimal(hex) {
          return BigInt(hex).toString();
        }
        exports.hexToDecimal = hexToDecimal;
      },
      {},
    ],
    11: [
      function (require, module, exports) {
        "use strict";
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.prepareTransaction = void 0;
        const big_js_1 = __importDefault(require("big.js"));
        const tiny_big_1 = require("../../shared/tiny-big/tiny-big");
        const bytes_1 = require("../../utils/bytes");
        /**
         * @param transaction
         * @example
         */
        function prepareTransaction(transaction) {
          const preparedTransaction = Object.assign({}, transaction);
          Object.keys(transaction).forEach((key) => {
            switch (key) {
              case "gas":
              case "gasPrice":
              case "nonce":
              case "maxFeePerGas":
              case "maxPriorityFeePerGas":
              case "value": {
                const value = transaction[key];
                if (value instanceof tiny_big_1.TinyBig) {
                  preparedTransaction[key] = value.toHexString();
                } else if (value instanceof big_js_1.default) {
                  preparedTransaction[key] = `0x${BigInt(
                    value.toString()
                  ).toString(16)}`;
                } else if (typeof transaction[key] === "number")
                  preparedTransaction[key] =
                    "0x" + transaction[key].toString(16);
                else preparedTransaction[key] = transaction[key].toString();
                break;
              }
              case "data":
                preparedTransaction[key] = (0, bytes_1.hexlify)(
                  transaction[key]
                );
                break;
            }
          });
          return preparedTransaction;
        }
        exports.prepareTransaction = prepareTransaction;
      },
      {
        "../../shared/tiny-big/tiny-big": 20,
        "../../utils/bytes": 22,
        "big.js": 2,
      },
    ],
    12: [
      function (require, module, exports) {
        "use strict";
        var __createBinding =
          (this && this.__createBinding) ||
          (Object.create
            ? function (o, m, k, k2) {
                if (k2 === undefined) k2 = k;
                var desc = Object.getOwnPropertyDescriptor(m, k);
                if (
                  !desc ||
                  ("get" in desc
                    ? !m.__esModule
                    : desc.writable || desc.configurable)
                ) {
                  desc = {
                    enumerable: true,
                    get: function () {
                      return m[k];
                    },
                  };
                }
                Object.defineProperty(o, k2, desc);
              }
            : function (o, m, k, k2) {
                if (k2 === undefined) k2 = k;
                o[k2] = m[k];
              });
        var __exportStar =
          (this && this.__exportStar) ||
          function (m, exports) {
            for (var p in m)
              if (
                p !== "default" &&
                !Object.prototype.hasOwnProperty.call(exports, p)
              )
                __createBinding(exports, m, p);
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.BaseContract =
          exports.TinyBig =
          exports.Contract =
          exports.computePublicKey =
          exports.computeAddress =
          exports.toUtf8Bytes =
          exports.splitSignature =
          exports.hashMessage =
          exports.gweiToEther =
          exports.weiToEther =
          exports.toChecksumAddress =
          exports.tinyBig =
          exports.FallthroughProvider =
          exports.JsonRpcProvider =
          exports.jsonRpcProvider =
          exports.isAddress =
          exports.etherToGwei =
          exports.etherToWei =
            void 0;
        const Contract_1 = require("./classes/Contract");
        Object.defineProperty(exports, "BaseContract", {
          enumerable: true,
          get: function () {
            return Contract_1.BaseContract;
          },
        });
        Object.defineProperty(exports, "Contract", {
          enumerable: true,
          get: function () {
            return Contract_1.Contract;
          },
        });
        const FallthroughProvider_1 = require("./providers/FallthroughProvider");
        Object.defineProperty(exports, "FallthroughProvider", {
          enumerable: true,
          get: function () {
            return FallthroughProvider_1.FallthroughProvider;
          },
        });
        const JsonRpcProvider_1 = require("./providers/JsonRpcProvider");
        Object.defineProperty(exports, "JsonRpcProvider", {
          enumerable: true,
          get: function () {
            return JsonRpcProvider_1.JsonRpcProvider;
          },
        });
        Object.defineProperty(exports, "jsonRpcProvider", {
          enumerable: true,
          get: function () {
            return JsonRpcProvider_1.jsonRpcProvider;
          },
        });
        const tiny_big_1 = require("./shared/tiny-big/tiny-big");
        Object.defineProperty(exports, "tinyBig", {
          enumerable: true,
          get: function () {
            return tiny_big_1.tinyBig;
          },
        });
        Object.defineProperty(exports, "TinyBig", {
          enumerable: true,
          get: function () {
            return tiny_big_1.TinyBig;
          },
        });
        const compute_address_1 = require("./utils/compute-address");
        Object.defineProperty(exports, "computeAddress", {
          enumerable: true,
          get: function () {
            return compute_address_1.computeAddress;
          },
        });
        const compute_public_key_1 = require("./utils/compute-public-key");
        Object.defineProperty(exports, "computePublicKey", {
          enumerable: true,
          get: function () {
            return compute_public_key_1.computePublicKey;
          },
        });
        const ether_to_gwei_1 = require("./utils/ether-to-gwei");
        Object.defineProperty(exports, "etherToGwei", {
          enumerable: true,
          get: function () {
            return ether_to_gwei_1.etherToGwei;
          },
        });
        const ether_to_wei_1 = require("./utils/ether-to-wei");
        Object.defineProperty(exports, "etherToWei", {
          enumerable: true,
          get: function () {
            return ether_to_wei_1.etherToWei;
          },
        });
        const gwei_to_ether_1 = require("./utils/gwei-to-ether");
        Object.defineProperty(exports, "gweiToEther", {
          enumerable: true,
          get: function () {
            return gwei_to_ether_1.gweiToEther;
          },
        });
        const hash_message_1 = require("./utils/hash-message");
        Object.defineProperty(exports, "hashMessage", {
          enumerable: true,
          get: function () {
            return hash_message_1.hashMessage;
          },
        });
        const is_address_1 = require("./utils/is-address");
        Object.defineProperty(exports, "isAddress", {
          enumerable: true,
          get: function () {
            return is_address_1.isAddress;
          },
        });
        const split_signature_1 = require("./utils/split-signature");
        Object.defineProperty(exports, "splitSignature", {
          enumerable: true,
          get: function () {
            return split_signature_1.splitSignature;
          },
        });
        const to_checksum_address_1 = require("./utils/to-checksum-address");
        Object.defineProperty(exports, "toChecksumAddress", {
          enumerable: true,
          get: function () {
            return to_checksum_address_1.toChecksumAddress;
          },
        });
        const to_utf8_bytes_1 = require("./utils/to-utf8-bytes");
        Object.defineProperty(exports, "toUtf8Bytes", {
          enumerable: true,
          get: function () {
            return to_utf8_bytes_1.toUtf8Bytes;
          },
        });
        const wei_to_ether_1 = require("./utils/wei-to-ether");
        Object.defineProperty(exports, "weiToEther", {
          enumerable: true,
          get: function () {
            return wei_to_ether_1.weiToEther;
          },
        });
        __exportStar(require("./utils/bytes"), exports);
        __exportStar(require("./utils/hash-message"), exports);
        __exportStar(require("./utils/keccak256"), exports);
        __exportStar(require("./utils/solidity-keccak256"), exports);
      },
      {
        "./classes/Contract": 3,
        "./providers/FallthroughProvider": 16,
        "./providers/JsonRpcProvider": 17,
        "./shared/tiny-big/tiny-big": 20,
        "./utils/bytes": 22,
        "./utils/compute-address": 23,
        "./utils/compute-public-key": 24,
        "./utils/ether-to-gwei": 25,
        "./utils/ether-to-wei": 26,
        "./utils/gwei-to-ether": 27,
        "./utils/hash-message": 28,
        "./utils/is-address": 29,
        "./utils/keccak256": 30,
        "./utils/solidity-keccak256": 31,
        "./utils/split-signature": 32,
        "./utils/to-checksum-address": 33,
        "./utils/to-utf8-bytes": 34,
        "./utils/wei-to-ether": 35,
      },
    ],
    13: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.logger = void 0;
        const package_version_1 = require("./package-version");
        class Logger {
          constructor() {
            this.packageVersion = package_version_1.version;
          }
          throwError(message, args) {
            const argsLength = Object.keys(args).length;
            throw new Error(
              `${message} (${Object.entries(args).map(
                ([key, value], index) =>
                  `${key}=${value}${index < argsLength - 1 && ", "}`
              )}, version=essential-eth@${this.packageVersion})`
            );
          }
          throwArgumentError(message, arg, value) {
            throw new Error(
              `${message} (argument="${arg}" value=${value}, version=essential-eth@${this.packageVersion})`
            );
          }
          checkSafeUint53(value, message = "value not safe") {
            if (typeof value !== "number") {
              return;
            }
            if (value < 0 || value >= 0x1fffffffffffff) {
              this.throwError(message, {
                operation: "checkSafeInteger",
                fault: "out-of-safe-range",
                value: value,
              });
            }
            if (value % 1) {
              this.throwError(message, {
                operation: "checkSafeInteger",
                fault: "non-integer",
                value: value,
              });
            }
          }
        }
        exports.logger = new Logger();
      },
      { "./package-version": 14 },
    ],
    14: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.version = void 0;
        // Generated by genversion.
        exports.version = "0.5.9";
      },
      {},
    ],
    15: [
      function (require, module, exports) {
        "use strict";
        var __awaiter =
          (this && this.__awaiter) ||
          function (thisArg, _arguments, P, generator) {
            function adopt(value) {
              return value instanceof P
                ? value
                : new P(function (resolve) {
                    resolve(value);
                  });
            }
            return new (P || (P = Promise))(function (resolve, reject) {
              function fulfilled(value) {
                try {
                  step(generator.next(value));
                } catch (e) {
                  reject(e);
                }
              }
              function rejected(value) {
                try {
                  step(generator["throw"](value));
                } catch (e) {
                  reject(e);
                }
              }
              function step(result) {
                result.done
                  ? resolve(result.value)
                  : adopt(result.value).then(fulfilled, rejected);
              }
              step(
                (generator = generator.apply(thisArg, _arguments || [])).next()
              );
            });
          };
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.BaseProvider = void 0;
        const clean_block_1 = require("../classes/utils/clean-block");
        const clean_log_1 = require("../classes/utils/clean-log");
        const clean_transaction_1 = require("../classes/utils/clean-transaction");
        const clean_transaction_receipt_1 = require("../classes/utils/clean-transaction-receipt");
        const fetchers_1 = require("../classes/utils/fetchers");
        const hex_to_decimal_1 = require("../classes/utils/hex-to-decimal");
        const prepare_transaction_1 = require("../classes/utils/prepare-transaction");
        const logger_1 = require("../logger/logger");
        const tiny_big_1 = require("../shared/tiny-big/tiny-big");
        const chains_info_1 = __importDefault(require("./utils/chains-info"));
        /**
         * Converts a block tag into the right format when needed.
         *
         * * No equivalent in ethers.js
         * * No equivalent in web3.js
         *
         * @internal
         * @param blockTag the block tag to convert/return as a hex string
         * @returns the specified block tag formatted as a hex string
         * @example
         * ```javascript
         * prepBlockTag(14848183);
         * // '0xe290b7'
         * ```
         * @example
         * ```javascript
         * prepBlockTag('0xe290b7');
         * // '0xe290b7'
         * ```
         */
        function prepBlockTag(blockTag) {
          return typeof blockTag === "number"
            ? (0, tiny_big_1.tinyBig)(blockTag).toHexString()
            : blockTag;
        }
        class BaseProvider {
          /**
           * @param rpcUrls The URL(s) to your Eth node(s). Consider POKT or Infura
           * @example
           * `https://free-eth-node.com/api/eth`
           * @example
           * `https://mainnet.infura.io/v3/YOUR-PROJECT-ID`
           */
          constructor(rpcUrls) {
            /**
             * @ignore
             */
            this._rpcUrls = [];
            /**
             * @ignore
             */
            this._post = (body) =>
              (0, fetchers_1.post)(this.selectRpcUrl(), body);
            this._rpcUrls = rpcUrls;
          }
          /**
           * Gets information (name, chainId, and ensAddress when applicable) about the network the provider is connected to.
           *
           * * [Identical](/docs/api#isd) to [`ethers.provider.getNetwork`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getNetwork) in ethers.js
           * * [Similar](/docs/api#isd) to [`web3.eth.getChainId`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getchainid) in web3.js, returns more than just the `chainId`
           *
           * @returns information about the network this provider is currently connected to
           * @example
           * ```javascript
           * jsonRpcProvider('https://free-eth-node.com/api/eth').getNetwork();
           * // { chainId: 1, name: 'eth', ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' }
           * ```
           * @example
           * ```javascript
           * jsonRpcProvider('https://free-eth-node.com/api/MATIC').getNetwork();
           * // { chainId: 137, name: 'MATIC', ensAddress: null }
           * ```
           */
          getNetwork() {
            return __awaiter(this, void 0, void 0, function* () {
              const hexChainId = yield this.post(
                (0, fetchers_1.buildRPCPostBody)("eth_chainId", [])
              );
              const chainId = (0, hex_to_decimal_1.hexToDecimal)(hexChainId);
              const info = chains_info_1.default[chainId];
              return {
                chainId: Number(chainId),
                name: info[0] || "unknown",
                ensAddress: info[1] || null, // only send ensAddress if it exists
              };
            });
          }
          /**
           * Gets the number of the most recently mined block on the network the provider is connected to.
           *
           * * [Identical](/docs/api#isd) to [`ethers.provider.getBlockNumber`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getBlockNumber) in ethers.js
           * * [Identical](/docs/api#isd) to [`web3.eth.getBlockNumber`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getblocknumber) in web3.js
           *
           * @returns the number of the most recently mined block
           * @example
           * ```javascript
           * await provider.getBlockNumber();
           * // 1053312
           * ```
           */
          getBlockNumber() {
            return __awaiter(this, void 0, void 0, function* () {
              const currentBlockNumber = yield this.post(
                (0, fetchers_1.buildRPCPostBody)("eth_blockNumber", [])
              );
              return Number(
                (0, hex_to_decimal_1.hexToDecimal)(currentBlockNumber)
              );
            });
          }
          /**
           * Gets information about a specified transaction, even if it hasn't been mined yet.
           *
           * * [Similar](/docs/api#isd) to [`ethers.provider.getTransaction`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getTransaction) in ethers.js, does not have `wait` method that waits until the transaction has been mined
           * * [Similar](/docs/api#isd) to [`web3.eth.getTransaction`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#gettransaction) in web3.js, some information returned using different types
           *
           * @param transactionHash the hash of the transaction to get information about
           * @returns information about the specified transaction
           * @example
           * ```javascript
           * await provider.getTransaction('0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789');
           * // {
           * //   accessList: [],
           * //   blockHash: "0x876810a013dbcd140f6fd6048c1dc33abbb901f1f96b394c2fa63aef3cb40b5d",
           * //   blockNumber: 14578286,
           * //   chainId: 1,
           * //   from: "0xdfD9dE5f6FA60BD70636c0900752E93a6144AEd4",
           * //   gas: { TinyBig: 112163 },
           * //   gasPrice: { TinyBig: 48592426858 },
           * //   hash: "0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789",
           * //   input: "0x83259f17000000000000000000000000000000000000000000...",
           * //   maxFeePerGas: { TinyBig: 67681261618 },
           * //   maxPriorityFeePerGas: { TinyBig: 1500000000 },
           * //   nonce: { TinyBig: 129 },
           * //   r: "0x59a7c15b12c18cd68d6c440963d959bff3e73831ffc938e75ecad07f7ee43fbc",
           * //   s: "0x1ebaf05f0d9273b16c2a7748b150a79d22533a8cd74552611cbe620fee3dcf1c",
           * //   to: "0x39B72d136ba3e4ceF35F48CD09587ffaB754DD8B",
           * //   transactionIndex: 29,
           * //   type: 2,
           * //   v: 0,
           * //   value: { TinyBig: 0 },
           * //   confirmations: 298140,
           * // }
           * ```
           */
          getTransaction(transactionHash) {
            return __awaiter(this, void 0, void 0, function* () {
              const [rpcTransaction, blockNumber] = yield Promise.all([
                this.post(
                  (0, fetchers_1.buildRPCPostBody)("eth_getTransactionByHash", [
                    transactionHash,
                  ])
                ),
                this.getBlock("latest"),
              ]);
              const cleanedTransaction = (0,
              clean_transaction_1.cleanTransaction)(rpcTransaction);
              // https://ethereum.stackexchange.com/questions/2881/how-to-get-the-transaction-confirmations-using-the-json-rpc
              cleanedTransaction.confirmations =
                blockNumber.number - cleanedTransaction.blockNumber + 1;
              return cleanedTransaction;
            });
          }
          /**
           * Gives information about a transaction that has already been mined. Includes additional information beyond what's provided by [`getTransaction`](/docs/api/modules#gettransaction).
           *
           * * [Identical](/docs/api#isd) to [`ethers.provider.getTransactionReceipt`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getTransactionReceipt) in ethers.js
           * * [Similar](/docs/api#isd) to [`web3.eth.getTransactionReceipt`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#gettransactionreceipt) in web3.js, some information returned using different types
           *
           * @param transactionHash the hash of the transaction to get information about
           * @returns information about the specified transaction that has already been mined
           * @example
           * ```javascript
           * await provider.getTransactionReceipt('0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789');
           * // {
           * //   blockHash: "0x876810a013dbcd140f6fd6048c1dc33abbb901f1f96b394c2fa63aef3cb40b5d",
           * //   blockNumber: 14578286,
           * //   contractAddress: null,
           * //   cumulativeGasUsed: { TinyBig: 3067973 },
           * //   effectiveGasPrice: { TinyBig: 48592426858 },
           * //   from: "0xdfD9dE5f6FA60BD70636c0900752E93a6144AEd4",
           * //   gasUsed: { TinyBig: 112163 },
           * //   logs: [
           * //     {
           * //       address: "0x0eDF9bc41Bbc1354c70e2107F80C42caE7FBBcA8",
           * //       blockHash: "0x876810a013dbcd140f6fd6048c1dc33abbb901f1f96b394c2fa63aef3cb40b5d",
           * //       blockNumber: 14578286,
           * //       data: "0x0000000000000000000000000000000000000000000003a12ec797b5484968c1",
           * //       logIndex: 42,
           * //       topics: [
           * //         "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
           * //         "0x00000000000000000000000039b72d136ba3e4cef35f48cd09587ffab754dd8b",
           * //         "0x000000000000000000000000dfd9de5f6fa60bd70636c0900752e93a6144aed4",
           * //       ],
           * //       transactionHash: "0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789",
           * //       transactionIndex: 29,
           * //     },
           * //     {
           * //       address: "0x39B72d136ba3e4ceF35F48CD09587ffaB754DD8B",
           * //       blockHash: "0x876810a013dbcd140f6fd6048c1dc33abbb901f1f96b394c2fa63aef3cb40b5d",
           * //       blockNumber: 14578286,
           * //       data: "0x0000000000000000000000000000000000000000000003a12ec797b5484968c1",
           * //       logIndex: 43,
           * //       topics: [
           * //         "0x34fcbac0073d7c3d388e51312faf357774904998eeb8fca628b9e6f65ee1cbf7",
           * //         "0x000000000000000000000000dfd9de5f6fa60bd70636c0900752e93a6144aed4",
           * //         "0x0000000000000000000000000000000000000000000000000000000000000003",
           * //       ],
           * //       transactionHash: "0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789",
           * //       transactionIndex: 29,
           * //     },
           * //   ],
           * //   logsBloom: "0x00000000000000000000000000000...",
           * //   status: 1,
           * //   to: "0x39B72d136ba3e4ceF35F48CD09587ffaB754DD8B",
           * //   transactionHash: "0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789",
           * //   transactionIndex: 29,
           * //   type: 2,
           * //   byzantium: true,
           * //   confirmations: 298171,
           * // }
           * ```
           */
          getTransactionReceipt(transactionHash) {
            return __awaiter(this, void 0, void 0, function* () {
              const [rpcTransaction, blockNumber] = yield Promise.all([
                this.post(
                  (0, fetchers_1.buildRPCPostBody)(
                    "eth_getTransactionReceipt",
                    [transactionHash]
                  )
                ),
                this.getBlock("latest"),
              ]);
              const cleanedTransactionReceipt = (0,
              clean_transaction_receipt_1.cleanTransactionReceipt)(
                rpcTransaction
              );
              cleanedTransactionReceipt.confirmations =
                blockNumber.number - cleanedTransactionReceipt.blockNumber + 1;
              return cleanedTransactionReceipt;
            });
          }
          /**
           * Returns the number of sent transactions by an address, from genesis (or as far back as a provider looks) up to specified block.
           *
           * * [Identical](/docs/api#isd) to [`ethers.provider.getTransactionCount`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getTransactionCount) in ethers.js
           * * [Identical](/docs/api#isd) to [`web3.eth.getTransactionCount`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#gettransactioncount) in web3.js
           *
           * @param address the address to count number of sent transactions
           * @param blockTag the block to count transactions up to, inclusive
           * @returns the number of transactions sent by the specified address
           * @example
           * ```javascript
           * await provider.getTransactionCount('0x71660c4005ba85c37ccec55d0c4493e66fe775d3');
           * // 1060000
           * ```
           * @example
           * ```javascript
           * await provider.getTransactionCount('0x71660c4005ba85c37ccec55d0c4493e66fe775d3', 'latest');
           * // 1060000
           * ```
           * @example
           * ```javascript
           * await provider.getTransactionCount('0x71660c4005ba85c37ccec55d0c4493e66fe775d3', 14649390);
           * // 1053312
           * ```
           */
          getTransactionCount(address, blockTag = "latest") {
            return __awaiter(this, void 0, void 0, function* () {
              blockTag = prepBlockTag(blockTag);
              const transactionCount = yield this.post(
                (0, fetchers_1.buildRPCPostBody)("eth_getTransactionCount", [
                  address,
                  blockTag,
                ])
              );
              return Number(
                (0, hex_to_decimal_1.hexToDecimal)(transactionCount)
              );
            });
          }
          /**
           * Gets information about a certain block, optionally with full transaction objects.
           *
           * * [Similar](/docs/api#isd) to [`ethers.provider.getBlock`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getLogs) in ethers.js, includes some additional information. Can also return block with full transaction objects, similar to [`ethers.providers.getBlockWithTransactions`]
           * * [Identical](/docs/api#isd) to [`web3.eth.getBlock`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getpastlogs) in web3.js
           *
           * @param timeFrame The number, hash, or text-based description ('latest', 'earliest', or 'pending') of the block to collect information on.
           * @param returnTransactionObjects Whether to also return data about the transactions on the block.
           * @returns A BlockResponse object with information about the specified block
           * @example
           * ```javascript
           * await provider.getBlock(14879862);
           * // {
           * //   baseFeePerGas: { TinyBig: 39095728776 },
           * //   difficulty: { TinyBig: 14321294455359973 },
           * //   extraData: "0x486976656f6e2073672d6865617679",
           * //   gasLimit: { TinyBig: 29970620 },
           * //   gasUsed: { TinyBig: 20951384 },
           * //   hash: "0x563b458ec3c4f87393b53f70bdddc0058497109b784d8cacd9247ddf267049ab",
           * //   logsBloom:
           * //     "0x9f38794fe80b521794df6efad8b0d2e9582f9ec3959a3f9384bda0fa371cfa5fac5af9d515c6bdf1ec325f5b5f7ebdd6a3a9fae17b38a86d4dc4b0971afc68d8086640550f4c156e6f923f4a1bb94fb0bed6cdcc474c5c64bfeff7a4a906f72b9a7b94004ee58efc53d63ac66961acd3a431b2d896cc9fd75f6072960bced45f770587caf130f57504decfcb63c6ca8fbc5bdbd749edd5a99a7375d2b81872289adb775fb3c928259f4be39c6d3f4d5b6217822979bb88c1f1fb62429b1b6d41cf4e3f77f9e1db3f5723108f1e5b1255dd734ad8cdb11e7ea22487c788e67c83777b6f395e504ca59c64f52245ee6de3804cf809e5caa4f0ea6a9aa9eb6ed801",
           * //   miner: "0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836",
           * //   mixHash: "0x73cc9419bfb89c9d41c3a8c34ce56b5ebe468bdcf870258d2e77262275d580ec",
           * //   nonce: "0x976f3f5d596ffb08",
           * //   number: 14879862,
           * //   parentHash: "0x95986ae14a71face8d9a6a379edd875b2e8bc73e4de0d9d460e7752bddb0f579",
           * //   receiptsRoot: "0x8e6ba2fd9bee602b653dae6e3132f16538c2c5df24f1df8c000392053f73defa",
           * //   sha3Uncles: "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
           * //   size: { TinyBig: 134483 },
           * //   stateRoot: "0xbf2bb67bd1c741f3d00904b8451d7c2cf4e3a2726f5a5884792ede2074747b85",
           * //   timestamp: { TinyBig: 1654016186 },
           * //   totalDifficulty: { TinyBig: 50478104614257705213748 },
           * //   transactions: [
           * //     "0xb3326a9149809603a2c28545e50e4f7d16e194bf5ee9764e0544603854c4a8d2",
           * //     "0x8b42095f8d335404a4896b2817b8e5e3d86a5a87cb434a8eec295d5280a7f48e",
           * //     "0x882f78fcb73f0f7ad0700bb0424a8b4beb366aaa93b88a3562c49a8d0ce4dcff",
           * //     ...
           * //   ],
           * //   transactionsRoot: "0x5934902f3dcc263ec34f24318179bf6301f53f4834685792066026f3a4849d72",
           * //   uncles: [],
           * // }
           * ```
           */
          getBlock(timeFrame = "latest", returnTransactionObjects = false) {
            return __awaiter(this, void 0, void 0, function* () {
              let type = "Number";
              if (typeof timeFrame === "string" && timeFrame.length === 66) {
                // use endpoint that accepts string
                type = "Hash";
              } else {
                timeFrame = prepBlockTag(timeFrame);
              }
              const rpcBlock = yield this.post(
                (0, fetchers_1.buildRPCPostBody)(`eth_getBlockBy${type}`, [
                  timeFrame,
                  returnTransactionObjects,
                ])
              );
              return (0,
              clean_block_1.cleanBlock)(rpcBlock, returnTransactionObjects);
            });
          }
          /**
           * Gives an estimate of the current gas price in wei.
           *
           * * [Similar](/docs/api#isd) to [`ethers.provider.getGasPrice`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getGasPrice) in ethers.js, does not have a parameter specifying what unit you'd like to return. See also [`weiToEther`](/docs/api/modules#weitoether) and [`etherToGwei`](/docs/api/modules#ethertogwei)
           * * [Identical](/docs/api#isd) to [`web3.eth.getGasPrice`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getgasprice) in web3.js, returns a number (TinyBig) instead of a string
           *
           * @returns an estimate of the current gas price in wei
           * @example
           * ```javascript
           * await provider.getGasPrice();
           * // 52493941856
           * ```
           */
          getGasPrice() {
            return __awaiter(this, void 0, void 0, function* () {
              const hexGasPrice = yield this.post(
                (0, fetchers_1.buildRPCPostBody)("eth_gasPrice", [])
              );
              return (0,
              tiny_big_1.tinyBig)((0, hex_to_decimal_1.hexToDecimal)(hexGasPrice));
            });
          }
          /**
           * Returns the balance of the account in wei.
           *
           * * [Identical](/docs/api#isd) to [`ethers.provider.getBalance`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getBalance) in ethers.js
           * * [Identical](/docs/api#isd) to [`web3.eth.getBalance`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getbalance) in web3.js, returns a number (TinyBig) instead of a string
           *
           * @param address the address to check the balance of
           * @param blockTag the block to check the specified address' balance on
           * @returns the balance of the network's native token for the specified address on the specified block
           * @example
           * ```javascript
           *  await provider.getBalance('0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8');
           * // 28798127851528138
           * ```
           */
          getBalance(address, blockTag = "latest") {
            return __awaiter(this, void 0, void 0, function* () {
              blockTag = prepBlockTag(blockTag);
              const hexBalance = yield this.post(
                (0, fetchers_1.buildRPCPostBody)("eth_getBalance", [
                  address,
                  blockTag,
                ])
              );
              return (0,
              tiny_big_1.tinyBig)((0, hex_to_decimal_1.hexToDecimal)(hexBalance));
            });
          }
          /**
           * Gets the code of a contract on a specified block.
           *
           * * [Identical](/docs/api#isd) to [`ethers.provider.getCode`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getCode) in ethers.js
           * * [Identical](/docs/api#isd) to [`web3.eth.getCode`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getcode) in web3.js
           *
           * @param address the contract address to get the contract code from
           * @param blockTag the block height to search for the contract code from. Contract code can change, so this allows for checking a specific block
           * @returns the contract creation code for the specified address at the specified block height
           * @example
           * ```javascript
           * await jsonRpcProvider().getCode('0xaC6095720221C79C6E7C638d260A2eFBC5D8d880', 'latest');
           * // '0x608060405234801561001057600080fd5b506004361061...'
           * ```
           */
          getCode(address, blockTag = "latest") {
            return __awaiter(this, void 0, void 0, function* () {
              blockTag = prepBlockTag(blockTag);
              const contractCode = yield this.post(
                (0, fetchers_1.buildRPCPostBody)("eth_getCode", [
                  address,
                  blockTag,
                ])
              );
              return contractCode;
            });
          }
          /**
           * Returns an estimate of the amount of gas that would be required to submit transaction to the network.
           * An estimate may not be accurate since there could be another transaction on the network that was not accounted for.
           *
           * * [Identical](/docs/api#isd) to [`ethers.provider.estimateGas`](https://docs.ethers.io/v5/api/providers/provider/#Provider-estimateGas) in ethers.js
           * * [Identical](/docs/api#isd) to [`web3.eth.estimateGas`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#estimateGas) in web3.js
           *
           * @param transaction the transaction to check the estimated gas cost for
           * @returns the estimated amount of gas charged for submitting the specified transaction to the blockchain
           * @example
           * ```javascript
           * await provider.estimateGas({
           *   // Wrapped ETH address
           *   to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
           *   data: "0xd0e30db0",
           *   value: etherToWei('1.0').toHexString(),
           * });
           * // { TinyBig: "27938" }
           * ```
           */
          estimateGas(transaction) {
            return __awaiter(this, void 0, void 0, function* () {
              const rpcTransaction = (0,
              prepare_transaction_1.prepareTransaction)(transaction);
              const gasUsed = yield this.post(
                (0, fetchers_1.buildRPCPostBody)("eth_estimateGas", [
                  rpcTransaction,
                ])
              );
              return (0,
              tiny_big_1.tinyBig)((0, hex_to_decimal_1.hexToDecimal)(gasUsed));
            });
          }
          /**
           * Returns transaction receipt event logs that match a specified filter.
           * May return `[]` if parameters are too broad, even if logs exist.
           *
           * * [Identical](/docs/api#isd) to [`ethers.provider.getLogs`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getLogs) in ethers.js
           * * [Identical](/docs/api#isd) to [`web3.eth.getPastLogs`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getpastlogs) in web3.js
           *
           * @param filter parameters to filter the logs by
           * @returns an array of logs matching the specified filter
           * @example
           * ```javascript
           * provider.getLogs({
           *   address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
           *   topics: [
           *     "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
           *     "0x00000000000000000000000021b8065d10f73ee2e260e5b47d3344d3ced7596e",
           *   ],
           *   fromBlock: 14825027,
           *   toBlock: 14825039,
           * });
           *
           * [
           *   {
           *     address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
           *     blockHash: '0x8e0dfac2f704851960f866c8708b3bef2f66c0fee0329cf25ff0261b264ca6bc',
           *     blockNumber: 14825029,
           *     data: '0x000000000000000000000000000000000000000000000000005f862ee352a38a',
           *     logIndex: 384,
           *     removed: false,
           *     topics: [
           *       '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
           *       '0x00000000000000000000000021b8065d10f73ee2e260e5b47d3344d3ced7596e',
           *       '0x00000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45'
           *     ],
           *     transactionHash: '0xbd49031be16f8fd1775f4e0fe79b408ffd8ae9c65b2827ee47e3238e3f51f4c0',
           *     transactionIndex: 226
           *   }
           * ]
           * ```
           */
          getLogs(filter) {
            return __awaiter(this, void 0, void 0, function* () {
              const filterByRange = filter;
              if (filterByRange.fromBlock)
                filterByRange.fromBlock = prepBlockTag(filterByRange.fromBlock);
              if (filterByRange.toBlock)
                filterByRange.toBlock = prepBlockTag(filterByRange.toBlock);
              const rpcLogs = yield this.post(
                (0, fetchers_1.buildRPCPostBody)("eth_getLogs", [filter])
              );
              const logs = rpcLogs.map((log) =>
                (0, clean_log_1.cleanLog)(log, false)
              );
              return logs;
            });
          }
          /**
           * Returns the result of adding a transaction to the blockchain without actually adding that transaction to the blockchain.
           * Does not require any ether as gas.
           *
           * * [Identical](/docs/api#isd) to [`ethers.provider.call`](https://docs.ethers.io/v5/api/providers/provider/#Provider-call) in ethers.js
           * * [Identical](/docs/api#isd) to [`web3.eth.call`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#call) in web3.js
           *
           * @param transaction the transaction object to, in theory, execute. Doesn't actually get added to the blockchain.
           * @param blockTag the block to execute this transaction on
           * @returns the result of executing the transaction on the specified block
           * @example
           * ```javascript
           * await provider.call({ to: "0x6b175474e89094c44da98b954eedeac495271d0f", data: "0x70a082310000000000000000000000006E0d01A76C3Cf4288372a29124A26D4353EE51BE" });
           * // '0x0000000000000000000000000000000000000000000000000858898f93629000'
           * ```
           */
          call(transaction, blockTag = "latest") {
            return __awaiter(this, void 0, void 0, function* () {
              if (
                transaction.gasPrice &&
                (transaction.maxPriorityFeePerGas || transaction.maxFeePerGas)
              ) {
                logger_1.logger.throwError(
                  'Cannot specify both "gasPrice" and ("maxPriorityFeePerGas" or "maxFeePerGas")',
                  {
                    gasPrice: transaction.gasPrice,
                    maxFeePerGas: transaction.maxFeePerGas,
                    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
                  }
                );
              }
              if (
                transaction.maxFeePerGas &&
                transaction.maxPriorityFeePerGas
              ) {
                logger_1.logger.throwError(
                  'Cannot specify both "maxFeePerGas" and "maxPriorityFeePerGas"',
                  {
                    maxFeePerGas: transaction.maxFeePerGas,
                    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
                  }
                );
              }
              blockTag = prepBlockTag(blockTag);
              const rpcTransaction = (0,
              prepare_transaction_1.prepareTransaction)(transaction);
              const transactionRes = yield this.post(
                (0, fetchers_1.buildRPCPostBody)("eth_call", [
                  rpcTransaction,
                  blockTag,
                ])
              );
              return transactionRes;
            });
          }
        }
        exports.BaseProvider = BaseProvider;
      },
      {
        "../classes/utils/clean-block": 4,
        "../classes/utils/clean-log": 5,
        "../classes/utils/clean-transaction": 7,
        "../classes/utils/clean-transaction-receipt": 6,
        "../classes/utils/fetchers": 9,
        "../classes/utils/hex-to-decimal": 10,
        "../classes/utils/prepare-transaction": 11,
        "../logger/logger": 13,
        "../shared/tiny-big/tiny-big": 20,
        "./utils/chains-info": 18,
      },
    ],
    16: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.FallthroughProvider = void 0;
        const logger_1 = require("../logger/logger");
        const BaseProvider_1 = require("./BaseProvider");
        // https://advancedweb.hu/how-to-add-timeout-to-a-promise-in-javascript/
        const promiseTimeout = (prom, time) =>
          Promise.race([
            prom,
            new Promise((_r, reject) =>
              setTimeout(() => reject("Promise timed out"), time)
            ),
          ]);
        const DEFAULT_TIMEOUT_DURATION = 8000;
        /**
         * @beta
         * A JSON RPC Provider which moves to the next URL when one fails.
         */
        class FallthroughProvider extends BaseProvider_1.BaseProvider {
          constructor(rpcUrls, options = {}) {
            if (!Array.isArray(rpcUrls)) {
              logger_1.logger.throwError("Array required", { rpcUrls });
            }
            if (rpcUrls.length <= 1) {
              logger_1.logger.throwError("More than one rpcUrl is required", {
                rpcUrls,
              });
            }
            super(rpcUrls);
            // index of current trusted rpc url
            /**
             * @ignore
             */
            this.rpcUrlCounter = 0;
            /**
             * @ignore
             */
            this.post = (body) => {
              // while failing post, add to rpcUrlCounter and post again
              const genesisCount = this.rpcUrlCounter;
              const recursivePostRetry = () => {
                // Times out request
                const genesisRpcUrl = this.selectRpcUrl();
                const res = promiseTimeout(
                  this._post(body),
                  this.timeoutDuration
                ).catch((e) => {
                  // A mutex: Only add if no other instance has discovered this url as failing yet
                  if (genesisRpcUrl === this.selectRpcUrl()) {
                    // add one and handle array overflow
                    this.rpcUrlCounter =
                      (this.rpcUrlCounter + 1) % this._rpcUrls.length;
                  }
                  // we've already tried this rpc, throw for good
                  if (this.rpcUrlCounter === genesisCount) {
                    throw e;
                  }
                  return recursivePostRetry();
                });
                return res;
              };
              return recursivePostRetry();
            };
            this.timeoutDuration =
              options.timeoutDuration || DEFAULT_TIMEOUT_DURATION;
          }
          /**
           * @ignore
           */
          selectRpcUrl() {
            return this._rpcUrls[this.rpcUrlCounter];
          }
        }
        exports.FallthroughProvider = FallthroughProvider;
      },
      { "../logger/logger": 13, "./BaseProvider": 15 },
    ],
    17: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.jsonRpcProvider = exports.JsonRpcProvider = void 0;
        const BaseProvider_1 = require("./BaseProvider");
        class JsonRpcProvider extends BaseProvider_1.BaseProvider {
          /**
           * @ignore
           */
          selectRpcUrl() {
            return this._rpcUrls[0];
          }
          /**
           * @ignore
           */
          post(body) {
            return this._post(body);
          }
          /**
           * @param rpcUrl The URL to your Eth node. Consider POKT or Infura
           * @example
           * `https://free-eth-node.com/api/eth`
           * @example
           * `https://mainnet.infura.io/v3/YOUR-PROJECT-ID`
           */
          constructor(rpcUrl = "https://free-eth-node.com/api/eth") {
            super([rpcUrl]);
          }
        }
        exports.JsonRpcProvider = JsonRpcProvider;
        /**
         * Helper function to avoid "new"
         *
         * @param rpcUrl the RPC URL to post requests to
         * @returns an initiated {@link JsonRpcProvider}
         * @example
         * ```javascript
         * jsonRpcProvider().getBlock('latest').then(block => {
         *   console.log(block.number);
         * })
         * // 14530496
         * ```
         */
        function jsonRpcProvider(rpcUrl) {
          return new JsonRpcProvider(rpcUrl);
        }
        exports.jsonRpcProvider = jsonRpcProvider;
      },
      { "./BaseProvider": 15 },
    ],
    18: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        // autogenerated in "fetch-chains-info.ts"
        // Do not edit directly
        exports.default = {
          1: ["eth", "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"],
          2: ["exp"],
          3: ["rop", "0x112234455c3a32fd11230c42e7bccd4a84e02010"],
          4: ["rin", "0xe7410170f87102df0055eb195163a03b7f2bff4a"],
          5: ["gor", "0x112234455c3a32fd11230c42e7bccd4a84e02010"],
          6: ["kot"],
          7: ["tch"],
          8: ["ubq"],
          9: ["tubq"],
          10: ["oeth"],
          11: ["meta"],
          12: ["kal"],
          13: ["dstg"],
          14: ["flr"],
          15: ["diode"],
          16: ["cflr"],
          17: ["tfi"],
          18: ["TST"],
          19: ["sgb"],
          20: ["elaeth"],
          21: ["elaetht"],
          22: ["eladid"],
          23: ["eladidt"],
          24: ["dthmainnet"],
          25: ["cro"],
          26: ["L1test"],
          27: ["shib"],
          28: ["Boba Rinkeby"],
          29: ["L1"],
          30: ["rsk"],
          31: ["trsk"],
          32: ["GooDT"],
          33: ["GooD"],
          34: ["dth"],
          35: ["tbwg"],
          38: ["val"],
          40: ["Telos EVM"],
          41: ["Telos EVM Testnet"],
          42: ["kov"],
          43: ["pangolin"],
          44: ["crab"],
          45: ["pangoro"],
          50: ["xdc"],
          51: ["TXDC"],
          52: ["cet"],
          53: ["tcet"],
          54: ["OP"],
          55: ["ZYX"],
          56: ["bnb"],
          57: ["sys"],
          58: ["Ontology Mainnet"],
          59: ["EOS Mainnet"],
          60: ["go"],
          61: ["etc"],
          62: ["tetc"],
          63: ["metc"],
          64: ["ella"],
          65: ["tokt"],
          66: ["okt"],
          67: ["dbm"],
          68: ["SO1"],
          69: ["okov"],
          70: ["hsc"],
          71: ["cfxtest"],
          74: ["idchain"],
          76: ["mix"],
          77: ["spoa"],
          78: ["primuschain"],
          79: ["zenith"],
          80: ["GeneChain"],
          81: ["VIL"],
          82: ["Meter"],
          83: ["MeterTest"],
          85: ["gttest"],
          86: ["gt"],
          87: ["nnw"],
          88: ["tomo"],
          89: ["tomot"],
          90: ["gar-s0"],
          91: ["gar-s1"],
          92: ["gar-s2"],
          93: ["gar-s3"],
          95: ["Kylin Testnet"],
          96: ["nsc"],
          97: ["bnbt"],
          99: ["poa"],
          100: ["gno"],
          101: ["eti"],
          102: ["tw3g"],
          105: ["dw3g"],
          106: ["vlx"],
          107: ["ntn"],
          108: ["TT"],
          110: ["xpr"],
          111: ["ETL"],
          122: ["fuse"],
          123: ["spark"],
          124: ["dwu"],
          125: ["oychain testnet"],
          126: ["oychain mainnet"],
          127: ["feth"],
          128: ["heco"],
          137: ["MATIC"],
          141: ["OPtest"],
          142: ["dax"],
          162: ["tpht"],
          163: ["pht"],
          168: ["aioz"],
          170: ["hoosmartchain"],
          172: ["resil"],
          186: ["Seele"],
          188: ["BMC"],
          189: ["BMCT"],
          199: ["BTT"],
          200: ["aox"],
          211: ["EDI"],
          218: ["SO1-old"],
          222: ["ASK"],
          225: ["LA"],
          226: ["TLA"],
          239: ["AITD"],
          246: ["ewt"],
          250: ["ftm"],
          256: ["hecot"],
          258: ["setm"],
          262: ["SUR"],
          269: ["hpb"],
          288: ["Boba"],
          300: ["ogc"],
          321: ["kcs"],
          322: ["kcst"],
          333: ["w3q"],
          335: ["DFKTEST"],
          336: ["sdn"],
          338: ["tcro"],
          361: ["theta-mainnet"],
          363: ["theta-sapphire"],
          364: ["theta-amber"],
          365: ["theta-testnet"],
          369: ["pls"],
          385: ["lisinski"],
          420: ["ogor"],
          499: ["rupx"],
          512: ["aac"],
          513: ["aact"],
          534: ["CNDL"],
          555: ["CLASS"],
          558: ["tao"],
          588: ["metis-stardust"],
          592: ["astr"],
          595: ["maca"],
          596: ["tkar"],
          597: ["taca"],
          600: ["mesh-chain-testnet"],
          666: ["pixie-chain-testnet"],
          686: ["kar"],
          700: ["SNS"],
          707: ["bcs"],
          708: ["tbcs"],
          721: ["tfeth"],
          776: ["opc"],
          777: ["cth"],
          787: ["aca"],
          788: ["taero"],
          803: ["haic"],
          820: ["clo"],
          821: ["tclo"],
          880: ["ambros"],
          888: ["wan"],
          900: ["gar-test-s0"],
          901: ["gar-test-s1"],
          902: ["gar-test-s2"],
          903: ["gar-test-s3"],
          940: ["tpls"],
          941: ["t2bpls"],
          942: ["t3pls"],
          977: ["yeti"],
          998: ["ln"],
          999: ["twan"],
          1001: ["Baobab"],
          1007: ["tnew"],
          1008: ["eun"],
          1010: ["EVC"],
          1012: ["new"],
          1022: ["sku"],
          1023: ["tclv"],
          1024: ["clv"],
          1028: ["tbtt"],
          1030: ["cfx"],
          1088: ["metis-andromeda"],
          1139: ["MATH"],
          1140: ["tMATH"],
          1197: ["iora"],
          1201: ["avis"],
          1202: ["wtt"],
          1213: ["popcat"],
          1214: ["enter"],
          1280: ["HO"],
          1284: ["mbeam"],
          1285: ["mriver"],
          1286: ["mrock-old"],
          1287: ["mbase"],
          1288: ["mrock"],
          1337: ["cennz-old"],
          1506: ["Sherpax"],
          1507: ["Sherpax Testnet"],
          1618: ["cate"],
          1620: ["ath"],
          1657: ["bta"],
          1688: ["LUDAN"],
          1819: ["cubet"],
          1856: ["tsf"],
          1898: ["boya"],
          1984: ["euntest"],
          1987: ["egem"],
          2001: ["milkAda"],
          2008: ["cloudwalk_testnet"],
          2009: ["cloudwalk_mainnet"],
          2020: ["420"],
          2021: ["edg"],
          2022: ["edgt"],
          2023: ["taycan-testnet"],
          2025: ["rpg"],
          2100: ["eco"],
          2101: ["esp"],
          2152: ["fra"],
          2153: ["findora-testnet"],
          2213: ["evanesco"],
          2221: ["kava"],
          2223: ["VChain"],
          2559: ["ktoc"],
          2569: ["tpc"],
          2612: ["EZChain"],
          2613: ["Fuji-EZChain"],
          3000: ["cennz-r"],
          3001: ["cennz-n"],
          3331: ["zcrbeach"],
          3333: ["w3q-t"],
          3334: ["w3q-g"],
          3400: ["prb"],
          3500: ["prbtestnet"],
          3690: ["btx"],
          3966: ["dyno"],
          3967: ["tdyno"],
          4002: ["tftm"],
          4102: ["aioz-testnet"],
          4181: ["PHI"],
          4689: ["iotex-mainnet"],
          4690: ["iotex-testnet"],
          4918: ["xvm"],
          5197: ["es"],
          5315: ["UZMI"],
          5551: ["Nahmii"],
          5553: ["Nahmii testnet"],
          5700: ["tsys"],
          5777: ["dgcc"],
          5851: ["Ontology Testnet"],
          5869: ["rbd"],
          6626: ["pixie-chain"],
          7341: ["shyft"],
          7878: ["tscas"],
          8000: ["teleport"],
          8001: ["teleport-testnet"],
          8029: ["mdgl"],
          8080: ["GeneChainAdn"],
          8217: ["Cypress"],
          8285: ["Kortho"],
          8723: ["olo"],
          8724: ["tolo"],
          8888: ["ambrostestnet"],
          8898: ["mmt"],
          8995: ["berg"],
          9000: ["evmos-testnet"],
          9001: ["evmos"],
          9100: ["GENEC"],
          9527: ["trpg"],
          9999: ["myn"],
          10000: ["smartbch"],
          10001: ["smartbchtest"],
          10101: ["GEN"],
          10823: ["CCP"],
          10946: ["quadrans"],
          10947: ["quadranstestnet"],
          11111: ["WAGMI"],
          11437: ["shyftt"],
          12051: ["tZERO"],
          12052: ["ZERO"],
          13381: ["Phoenix"],
          16000: ["mtt"],
          16001: ["mtttest"],
          19845: ["btcix"],
          21337: ["cennz-a"],
          21816: ["omc"],
          22023: ["SFL"],
          24484: ["web"],
          24734: ["mintme"],
          26863: ["OAC"],
          30067: ["Piece"],
          31102: ["esn"],
          31337: ["got"],
          32520: ["Brise"],
          32659: ["fsn"],
          39797: ["nrg"],
          42069: ["PC"],
          42161: ["arb1"],
          42220: ["CELO"],
          42261: ["emerald"],
          42262: ["oasis"],
          43110: ["avaeth"],
          43113: ["Fuji"],
          43114: ["Avalanche"],
          44787: ["ALFA"],
          45000: ["Autobahn Network"],
          47805: ["REI"],
          49797: ["tnrg"],
          53935: ["DFK"],
          55555: ["rei"],
          55556: ["trei"],
          60000: ["TKM-test0"],
          60001: ["TKM-test1"],
          60002: ["TKM-test2"],
          60103: ["TKM-test103"],
          62320: ["BKLV"],
          62621: ["mtv"],
          63000: ["ecs"],
          63001: ["ecs-testnet"],
          69420: ["cndr"],
          70000: ["TKM0"],
          70001: ["TKM1"],
          70002: ["TKM2"],
          70103: ["TKM103"],
          71393: ["ckb"],
          71401: ["gw-testnet-v1"],
          71402: ["gw-mainnet-v1"],
          73799: ["vt"],
          78110: ["firenze"],
          80001: ["maticmum"],
          99998: ["usctest"],
          99999: ["usc"],
          100000: ["qkc-r"],
          100001: ["qkc-s0"],
          100002: ["qkc-s1"],
          100003: ["qkc-s2"],
          100004: ["qkc-s3"],
          100005: ["qkc-s4"],
          100006: ["qkc-s5"],
          100007: ["qkc-s6"],
          100008: ["qkc-s7"],
          108801: ["bro"],
          110000: ["qkc-d-r"],
          110001: ["qkc-d-s0"],
          110002: ["qkc-d-s1"],
          110003: ["qkc-d-s2"],
          110004: ["qkc-d-s3"],
          110005: ["qkc-d-s4"],
          110006: ["qkc-d-s5"],
          110007: ["qkc-d-s6"],
          110008: ["qkc-d-s7"],
          200101: ["milkTAda"],
          200625: ["aka"],
          201018: ["alaya"],
          201030: ["alayadev"],
          210425: ["platon"],
          234666: ["hym"],
          246529: ["ats"],
          246785: ["atstau"],
          281121: ["SoChain"],
          333888: ["sparta"],
          333999: ["olympus"],
          421611: ["arb-rinkeby"],
          432201: ["Dexalot"],
          444900: ["wlkt"],
          474142: ["oc"],
          512512: ["cmp"],
          666666: ["vpioneer"],
          888888: ["vision"],
          955305: ["elv"],
          1313114: ["etho"],
          1313500: ["xero"],
          1337702: ["kintsugi"],
          1337802: ["kiln"],
          2203181: ["platondev"],
          7762959: ["music"],
          11155111: ["sep"],
          13371337: ["tpep"],
          18289463: ["ilt"],
          20180430: ["spectrum"],
          20181205: ["qki"],
          28945486: ["auxi"],
          35855456: ["JOYS"],
          61717561: ["aqua"],
          99415706: ["TOYS"],
          192837465: ["GTH"],
          245022926: ["neonevm-devnet"],
          245022934: ["neonevm-mainnet"],
          245022940: ["neonevm-testnet"],
          311752642: ["oneledger"],
          356256156: ["tGTH"],
          486217935: ["dGTH"],
          1122334455: ["ipos"],
          1313161554: ["aurora"],
          1313161555: ["aurora-testnet"],
          1313161556: ["aurora-betanet"],
          1666600000: ["hmy-s0"],
          1666600001: ["hmy-s1"],
          1666600002: ["hmy-s2"],
          1666600003: ["hmy-s3"],
          1666700000: ["hmy-b-s0"],
          1666700001: ["hmy-b-s1"],
          1666700002: ["hmy-b-s2"],
          1666700003: ["hmy-b-s3"],
          2021121117: ["hop"],
          3125659152: ["pirl"],
          4216137055: ["frankenstein"],
          11297108099: ["tpalm"],
          11297108109: ["palm"],
          197710212030: ["ntt"],
          197710212031: ["ntt-haradev"],
          6022140761023: ["mole"],
          868455272153094: ["gw-testnet-v1-deprecated"],
        };
      },
      {},
    ],
    19: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.scientificStrToDecimalStr = void 0;
        /**
         * Strips both leading and trailing zeroes from a number string
         *
         * @param numberString the string of numbers to strip zeros from
         * @returns a string of numbers without leading or trailing zeros
         * @example
         * ```javascript
         * stripTrailingZeros('0005280');
         * // '5280'
         * ```
         */
        function stripTrailingZeroes(numberString) {
          const isNegative = numberString.startsWith("-");
          numberString = numberString.replace("-", "");
          numberString = numberString.replace(
            /\.0*$/g,
            "" /* for numbers like "1.0" -> "1" */
          );
          numberString = numberString.replace(/^0+/, "");
          // for numbers like "1.10" -> "1.1"
          if (numberString.includes(".")) {
            numberString = numberString.replace(/0+$/, "");
          }
          if (numberString.startsWith(".")) {
            // so that ".1" returns as "0.1"
            numberString = `0${numberString}`;
          }
          return `${isNegative ? "-" : ""}${numberString}`;
        }
        /**
         * Converts a string in scientific notation formatting to string in decimal format
         *
         * @param scientificString a string in scientific format to convert to decimal
         * @returns a string of a decimal number equivalent to the specified scientificString
         * @example
         * ```javascript
         * scientificStrToDecimalStr('2.3e-5');
         * // '0.000023'
         * ```
         * @example
         * ```javascript
         * scientificStrToDecimalStr('2.3e+5');
         * // '230000'
         * ```
         */
        function scientificStrToDecimalStr(scientificString) {
          // Does not contain "e" nor "E"
          if (!scientificString.match(/e/i /* lowercase and uppercase E */)) {
            return stripTrailingZeroes(scientificString);
          }
          // eslint-disable-next-line prefer-const
          let [base, power] = scientificString.split(
            /e/i /* lowercase and uppercase E */
          );
          // remove the leading "-" if negative
          const isNegative = Number(base) < 0;
          base = base.replace("-", "");
          base = stripTrailingZeroes(base);
          const [
            wholeNumber,
            fraction /* move decimal this many places */ = "",
          ] = base.split(".");
          if (Number(power) === 0) {
            return `${isNegative ? "-" : ""}${stripTrailingZeroes(base)}`;
          } else {
            const includesDecimal = base.includes(".");
            if (!includesDecimal) {
              base = `${base}.`;
            }
            base = base.replace(".", "");
            const baseLength = base.length;
            let splitPaddedNumber;
            if (Number(power) < 0) {
              // move decimal left
              if (wholeNumber.length < Math.abs(Number(power))) {
                base = base.padStart(
                  baseLength + Math.abs(Number(power)) - wholeNumber.length,
                  "0"
                );
              }
              splitPaddedNumber = base.split("");
              if (wholeNumber.length < Math.abs(Number(power))) {
                // starts with zeroes
                splitPaddedNumber = [".", ...splitPaddedNumber];
              } else {
                splitPaddedNumber.splice(
                  splitPaddedNumber.length - Math.abs(Number(power)),
                  0,
                  "."
                );
              }
            } else {
              // move decimal right
              if (fraction.length < Math.abs(Number(power))) {
                base = base.padEnd(
                  baseLength + Math.abs(Number(power)) - fraction.length,
                  "0"
                );
              }
              splitPaddedNumber = base.split("");
              if (fraction.length > Math.abs(Number(power))) {
                splitPaddedNumber.splice(
                  splitPaddedNumber.length - Math.abs(Number(power)),
                  0,
                  "."
                );
              }
            }
            const toReturn = stripTrailingZeroes(splitPaddedNumber.join(""));
            return `${isNegative ? "-" : ""}${toReturn}`;
          }
        }
        exports.scientificStrToDecimalStr = scientificStrToDecimalStr;
      },
      {},
    ],
    20: [
      function (require, module, exports) {
        "use strict";
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.tinyBig = exports.TinyBig = void 0;
        const big_js_1 = __importDefault(require("big.js"));
        const hex_to_decimal_1 = require("../../classes/utils/hex-to-decimal");
        const helpers_1 = require("./helpers");
        /**
         * A wrapper around [big.js](https://github.com/MikeMcl/big.js) which expands scientific notation and creates a "toHexString" function.
         * This is the return type of every operation on ether, wei, etc.
         */
        class TinyBig extends big_js_1.default {
          constructor(value) {
            if (typeof value === "string" && value.startsWith("0x")) {
              value = (0, hex_to_decimal_1.hexToDecimal)(value);
            }
            super(value);
            /**
             * Eithers pads or shortens a string to a specified length
             *
             * @param str the string to pad or chop
             * @param padChar the character to pad the string with
             * @param length the desired length of the given string
             * @returns a string of the desired length, either padded with the specified padChar or with the beginning of the string chopped off
             * @example
             * ```javascript
             * padAndChop('essential-eth', 'a', 8);
             * // 'tial-eth'
             * ```
             * @example
             * ```javascript
             * padAndChop('essential-eth', 'A', 20);
             * // 'AAAAAAAessential-eth'
             * ```
             */
            this.padAndChop = (str, padChar, length) => {
              return (Array(length).fill(padChar).join("") + str).slice(
                length * -1
              );
            };
          }
          /**
           * Used anytime you're passing in "value" to ethers or web3
           * For now, TypeScript will complain that `TinyBig` is not a `BigNumberish`. You can // @ts-ignore or call this
           *
           * @returns the TinyBig represented as a hex string
           * @example
           * ```javascript
           * tinyBig(293).toHexString();
           * // '0x125'
           * ```
           * @example
           * ```javascript
           * tinyBig(681365874).toHexString();
           * // '0x289cd172'
           */
          toHexString() {
            return `0x${BigInt(this.toString()).toString(16)}`;
          }
          toNumber() {
            return Number(
              (0, helpers_1.scientificStrToDecimalStr)(super.toString())
            );
          }
          toString() {
            if (this.toNumber() === 0) {
              return "0";
            }
            return (0, helpers_1.scientificStrToDecimalStr)(super.toString());
          }
          toTwos(bitCount) {
            let binaryStr;
            if (this.gte(0)) {
              const twosComp = this.toNumber().toString(2);
              binaryStr = this.padAndChop(
                twosComp,
                "0",
                bitCount || twosComp.length
              );
            } else {
              binaryStr = this.plus(Math.pow(2, bitCount))
                .toNumber()
                .toString(2);
              if (Number(binaryStr) < 0) {
                throw new Error("Cannot calculate twos complement");
              }
            }
            const binary = `0b${binaryStr}`;
            const decimal = Number(binary);
            return tinyBig(decimal);
          }
        }
        exports.TinyBig = TinyBig;
        /**
         * Helper factory function so that you don't have to type "new" when instantiating a new TinyBig
         *
         * @param value the value to initiate the TinyBig with
         * @returns an initiated {@link TinyBig}
         * @example
         * ```javascript
         * tinyBig(10).times(3).toNumber()
         * // 30
         * ```
         */
        function tinyBig(value) {
          return new TinyBig(value);
        }
        exports.tinyBig = tinyBig;
      },
      {
        "../../classes/utils/hex-to-decimal": 10,
        "./helpers": 19,
        "big.js": 2,
      },
    ],
    21: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.validateType = void 0;
        const validateType = (value, allowedTypes) => {
          if (!allowedTypes.includes(typeof value)) {
            throw new Error(
              `${allowedTypes.join(" or ")} required. Received ${typeof value}`
            );
          }
        };
        exports.validateType = validateType;
      },
      {},
    ],
    22: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.hexZeroPad =
          exports.hexStripZeros =
          exports.hexValue =
          exports.hexConcat =
          exports.hexDataSlice =
          exports.hexDataLength =
          exports.hexlify =
          exports.isHexString =
          exports.zeroPad =
          exports.stripZeros =
          exports.concat =
          exports.arrayify =
          exports.isBytes =
          exports.isBytesLike =
            void 0;
        // primarily duplicate code from https://github.com/ethers-io/ethers.js/blob/f599d6f23dad0d0acaa3828d6b7acaab2d5e455b/packages/bytes/src.ts/index.ts
        const logger_1 = require("../logger/logger");
        /**
         * Check if a value can be converted to a hex string
         *
         * @param value the value to check whether or not it's Hexable
         * @returns whether or not the value is Hexable
         * @example
         * ```javascript
         * const val = tinyBig(203);
         * isHexable(val);
         * // true
         * ```
         */
        function isHexable(value) {
          return !!value.toHexString;
        }
        /**
         * Returns true if and only if value is a valid [Bytes](#bytes) or DataHexString
         * Same as [`ethers.utils.isBytesLike`](https://docs.ethers.io/v5/api/utils/bytes/#utils-isBytesLike)
         *
         * @param value the value to check whether or not it matches BytesLike
         * @returns whether or not the value matches BytesLike
         * @example
         * ```javascript
         * isBytesLike([1,2,3]);
         * // true
         * ```
         * @example
         * ```javascript
         * isBytesLike(false);
         * // false
         * ```
         * @example
         * ```javascript
         * isBytesLike(new Uint8Array(1));
         * // true
         * ```
         */
        function isBytesLike(value) {
          return (isHexString(value) && !(value.length % 2)) || isBytes(value);
        }
        exports.isBytesLike = isBytesLike;
        /**
         * Checks if a value is an integer
         *
         * @param value the value to check whether or not it's an integer
         * @returns whether or not value is an integer
         * @example
         * ```javascript
         * isInteger(4)
         * // true
         * ```
         * @example
         * ```javascript
         * isInteger(6.2)
         * // false
         * ```
         */
        function isInteger(value) {
          return typeof value === "number" && value == value && value % 1 === 0;
        }
        /**
         * Returns true if and only if value is a valid [Bytes](#bytes)
         * Same as [`ethers.utils.isBytes`](https://docs.ethers.io/v5/api/utils/bytes/#utils-isBytes)
         *
         * @param value the value to check whether or not it matches Bytes
         * @returns whether or not the value matches Bytes
         * @example
         * ```javascript
         * isBytes([1,2,3]);
         * // true
         * ```
         * @example
         * ```javascript
         * isBytes(false);
         * // false
         * ```
         * @example
         * ```javascript
         * isBytes(new Uint8Array(1));
         * // true
         * ```
         */
        function isBytes(value) {
          if (value == null) {
            return false;
          }
          if (value.constructor === Uint8Array) {
            return true;
          }
          if (typeof value === "string") {
            return false;
          }
          if (!isInteger(value.length) || value.length < 0) {
            return false;
          }
          for (let i = 0; i < value.length; i++) {
            const v = value[i];
            if (!isInteger(v) || v < 0 || v >= 256) {
              return false;
            }
          }
          return true;
        }
        exports.isBytes = isBytes;
        /**
         * Converts DataHexStringOrArrayish to a Uint8Array
         * Same as [`ethers.utils.arrayify`](https://docs.ethers.io/v5/api/utils/bytes/#utils-arrayify)
         *
         * @param value the value to convert to a Uint8Array
         * @param options options to use when converting the value to a Uint8Array
         * @returns the value represented as a Uint8Array
         * @example
         * ```javascript
         * arrayify(1);
         * // Uint8Array(1) [ 1 ]
         * ```
         * @example
         * ```javascript
         * arrayify(0x1234);
         * // Uint8Array(2) [ 18, 52 ]
         * ```
         * @example
         * ```javascript
         * arrayify('0x1', { hexPad: 'right' });
         * // Uint8Array(1) [ 16 ]
         * ```
         */
        function arrayify(value, options) {
          if (!options) {
            options = {};
          }
          if (typeof value === "number") {
            logger_1.logger.checkSafeUint53(value, "invalid arrayify value");
            const result = [];
            while (value) {
              result.unshift(value & 0xff);
              value = parseInt(String(value / 256));
            }
            if (result.length === 0) {
              result.push(0);
            }
            return new Uint8Array(result);
          }
          if (
            options.allowMissingPrefix &&
            typeof value === "string" &&
            value.substring(0, 2) !== "0x"
          ) {
            value = "0x" + value;
          }
          if (isHexable(value)) {
            value = value.toHexString();
          }
          if (isHexString(value)) {
            let hex = value.substring(2);
            if (hex.length % 2) {
              if (options.hexPad === "left") {
                hex = "0" + hex;
              } else if (options.hexPad === "right") {
                hex += "0";
              } else {
                logger_1.logger.throwArgumentError(
                  "hex data is odd-length",
                  "value",
                  value
                );
              }
            }
            const result = [];
            for (let i = 0; i < hex.length; i += 2) {
              result.push(parseInt(hex.substring(i, i + 2), 16));
            }
            return new Uint8Array(result);
          }
          if (isBytes(value)) {
            return new Uint8Array(value);
          }
          return logger_1.logger.throwArgumentError(
            "invalid arrayify value",
            "value",
            value
          );
        }
        exports.arrayify = arrayify;
        /**
         * Concatenates all the BytesLike in arrayOfBytesLike into a single Uint8Array.
         * Same as [`ethers.utils.concat`](https://docs.ethers.io/v5/api/utils/bytes/#utils-concat)
         *
         * @param arrayOfBytesLike the array of {@link BytesLike} to concatenate together
         * @returns a concatenated Uint8Array
         * @example
         * ```javascript
         * concat([0, 1]);
         * // Uint8Array(2) [ 0, 1 ]
         * ```
         */
        function concat(arrayOfBytesLike) {
          const objects = arrayOfBytesLike.map((item) => arrayify(item));
          const length = objects.reduce(
            (accum, item) => accum + item.length,
            0
          );
          const result = new Uint8Array(length);
          objects.reduce((offset, object) => {
            result.set(object, offset);
            return offset + object.length;
          }, 0);
          return result;
        }
        exports.concat = concat;
        /**
         * Strips leading zeros from a BytesLike object
         *
         * @param value the value to strip leading zeros from
         * @returns value without leading zeroes, expressed as a Uint8Array
         * @example
         * ```javascript
         * stripZeros('0x00002834');
         * // Uint8Array { [Iterator]  0: 40, 1: 52 }
         * // Equivalent to '0x2834'
         * ```
         */
        function stripZeros(value) {
          let result = arrayify(value);
          if (result.length === 0) {
            return result;
          }
          // Find the first non-zero entry
          let start = 0;
          while (start < result.length && result[start] === 0) {
            start++;
          }
          // If we started with zeros, strip them
          if (start) {
            result = result.slice(start);
          }
          return result;
        }
        exports.stripZeros = stripZeros;
        /**
         * Pads the beginning of a {@link BytesLike} with zeros so it's the specified length as a Uint8Array
         *
         * @param value the value to pad
         * @param length the desired length of the value
         * @returns the value padded with zeros to the specified length
         * @example
         * ```javascript
         * zeroPad('0x039284');
         * // Uint8Array { [Iterator]  0: 0, 1: 0, 2: 0, 3: 3, 4: 146, 5: 132 }
         * // Equivalent to 0x000000039284
         * ```
         * @example
         * ```javascript
         * zeroPad([39, 25, 103, 45], 5);
         * // Uint8Array { [Iterator]  0: 0, 1: 39, 2: 25, 3: 103, 4: 45 }
         * ```
         */
        function zeroPad(value, length) {
          value = arrayify(value);
          if (value.length > length) {
            logger_1.logger.throwArgumentError(
              "value out of range",
              "value",
              value
            );
          }
          const result = new Uint8Array(length);
          result.set(value, length - value.length);
          return result;
        }
        exports.zeroPad = zeroPad;
        /**
         * Returns true if and only if object is a valid hex string.
         * If length is specified and object is not a valid DataHexString of length bytes, an InvalidArgument error is thrown.
         * Same as [`ethers.utils.isHexString`](https://docs.ethers.io/v5/api/utils/bytes/#utils-isHexString)
         *
         * @param value the value to check whether or not it's a hex string
         * @param length a length of bytes that the value should be equal to
         * @returns whether the value is a valid hex string (and optionally, whether it matches the length specified)
         * @example
         * ```javascript
         * isHexString('0x4924');
         * // true
         * ```
         * @example
         * ```javascript
         * isHexString('0x4924', 4);
         * // false
         * // length of 4 in bytes would mean a hex string with 8 characters
         * ```
         */
        function isHexString(value, length) {
          if (typeof value !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
            return false;
          }
          if (length && value.length !== 2 + 2 * length) {
            return false;
          }
          return true;
        }
        exports.isHexString = isHexString;
        const HexCharacters = "0123456789abcdef";
        /**
         * Converts a value into a hex string
         *
         * @param value the value to convert
         * @param options options to use when converting the value to a hex string
         * @returns the value represented as a hex string
         * @example
         * ```javascript
         * hexlify(4);
         * // '0x04'
         * ```
         * @example
         * ```javascript
         * hexlify(14);
         * // '0x0e'
         * ```
         */
        function hexlify(value, options) {
          if (!options) {
            options = {};
          }
          if (typeof value === "number") {
            logger_1.logger.checkSafeUint53(value, "invalid hexlify value");
            let hex = "";
            while (value) {
              hex = HexCharacters[value & 0xf] + hex;
              value = Math.floor(value / 16);
            }
            if (hex.length) {
              if (hex.length % 2) {
                hex = "0" + hex;
              }
              return "0x" + hex;
            }
            return "0x00";
          }
          if (typeof value === "bigint") {
            value = value.toString(16);
            if (value.length % 2) {
              return "0x0" + value;
            }
            return "0x" + value;
          }
          if (
            options.allowMissingPrefix &&
            typeof value === "string" &&
            value.substring(0, 2) !== "0x"
          ) {
            value = "0x" + value;
          }
          if (isHexable(value)) {
            return value.toHexString();
          }
          if (isHexString(value)) {
            if (value.length % 2) {
              if (options.hexPad === "left") {
                value = "0x0" + value.substring(2);
              } else if (options.hexPad === "right") {
                value += "0";
              } else {
                logger_1.logger.throwArgumentError(
                  "hex data is odd-length",
                  "value",
                  value
                );
              }
            }
            return value.toLowerCase();
          }
          if (isBytes(value)) {
            let result = "0x";
            for (let i = 0; i < value.length; i++) {
              const v = value[i];
              result +=
                HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
            }
            return result;
          }
          return logger_1.logger.throwArgumentError(
            "invalid hexlify value",
            "value",
            value
          );
        }
        exports.hexlify = hexlify;
        /**
         * Gets the length of data represented as a hex string
         *
         * @param data the data to check the length of
         * @returns the length of the data
         * @example
         * ```javascript
         * hexDataLength([2, 4, 0, 1]);
         * // 4
         * ```
         * @example
         * ```javascript
         * hexDataLength('0x3925');
         * // 2
         * ```
         */
        function hexDataLength(data) {
          if (typeof data !== "string") {
            data = hexlify(data);
          } else if (!isHexString(data) || data.length % 2) {
            return null;
          }
          return (data.length - 2) / 2;
        }
        exports.hexDataLength = hexDataLength;
        /**
         * Slices a {@link BytesLike} to extract a certain part of the input
         *
         * @param data the data to slice from
         * @param offset the index to start extraction at
         * @param endOffset the index to end extraction at
         * @returns the extracted data as a hex string
         * @example
         * ```javascript
         * hexDataSlice([20, 6, 48], 0, 2);
         * // '0x1406'
         * ```
         */
        function hexDataSlice(data, offset, endOffset) {
          if (typeof data !== "string") {
            data = hexlify(data);
          } else if (!isHexString(data) || data.length % 2) {
            logger_1.logger.throwArgumentError(
              "invalid hexData",
              "value",
              data
            );
          }
          offset = 2 + 2 * offset;
          if (endOffset != null) {
            return "0x" + data.substring(offset, 2 + 2 * endOffset);
          }
          return "0x" + data.substring(offset);
        }
        exports.hexDataSlice = hexDataSlice;
        /**
         * Concatenates values together into one hex string
         *
         * @param items the items to concatenate together
         * @returns a single hex string including all of the items to be concatenated
         * @example
         * ```javascript
         * hexConcat([[2, 4, 0, 1], 9, '0x2934', '0x3947']);
         * // '0x020400010929343947'
         * ```
         */
        function hexConcat(items) {
          let result = "0x";
          items.forEach((item) => {
            result += hexlify(item).substring(2);
          });
          return result;
        }
        exports.hexConcat = hexConcat;
        /**
         * Converts a number of different types into a hex string
         *
         * @param value the value to convert into a hex string
         * @returns the value represented as a hex string
         * @example
         * ```javascript
         * hexValue(39);
         * // '0x27'
         * ```
         * @example
         * ```javascript
         * hexValue([9, 4, 19, 4]);
         * // '0x9041304'
         * ```
         */
        function hexValue(value) {
          const trimmed = hexStripZeros(hexlify(value, { hexPad: "left" }));
          if (trimmed === "0x") {
            return "0x0";
          }
          return trimmed;
        }
        exports.hexValue = hexValue;
        /**
         * Strips the leading zeros from a value and returns it as a hex string
         *
         * @param value the value to strip zeros from
         * @returns a hex string representation of the value, without leading zeros
         * @example
         * ```javascript
         * hexStripZeros([0,0,0,48]);
         * // '0x30'
         * ```
         */
        function hexStripZeros(value) {
          if (typeof value !== "string") {
            value = hexlify(value);
          }
          if (!isHexString(value)) {
            logger_1.logger.throwArgumentError(
              "invalid hex string",
              "value",
              value
            );
          }
          value = value.substring(2);
          let offset = 0;
          while (offset < value.length && value[offset] === "0") {
            offset++;
          }
          return "0x" + value.substring(offset);
        }
        exports.hexStripZeros = hexStripZeros;
        /**
         * Returns a hex string padded to a specified length of bytes.
         *
         * Similar to ["hexZeroPad" in ethers.js](https://docs.ethers.io/v5/api/utils/bytes/#utils-hexZeroPad)
         *
         * Differs from ["padLeft" in web3.js](https://web3js.readthedocs.io/en/v1.7.1/web3-utils.html#padleft) because web3 counts by characters, not bytes.
         *
         * @param value A hex-string, hex-number, or decimal number (auto-converts to base-16) to be padded
         * @param length The final length in bytes
         * @returns A hex string padded to the specified length
         * @throws If the value is not a hex string or number
         * @throws If the value is longer than the length
         * @example
         * ```javascript
         * hexZeroPad('0x60', 2);
         * // '0x0060'
         * ```
         * @example
         * ```javascript
         * hexZeroPad(0x60, 3);
         * // '0x000060'
         * ```
         * @example
         * ```javascript
         * hexZeroPad('12345', 1);
         * // Throws
         * ```
         */
        function hexZeroPad(value, length) {
          if (typeof value !== "string") {
            value = hexlify(value);
          } else if (!isHexString(value)) {
            logger_1.logger.throwArgumentError(
              "invalid hex string",
              "value",
              value
            );
          }
          if (value.length > 2 * length + 2) {
            logger_1.logger.throwError("value out of range", { value, length });
          }
          while (value.length < 2 * length + 2) {
            value = "0x0" + value.substring(2);
          }
          return value;
        }
        exports.hexZeroPad = hexZeroPad;
        // export function splitSignature(signature: SignatureLike): Signature {
        //   const result: Signature = {
        //     r: '0x',
        //     s: '0x',
        //     _vs: '0x',
        //     recoveryParam: 0,
        //     v: 0,
        //     yParityAndS: '0x',
        //     compact: '0x',
        //   };
        //   if (isBytesLike(signature)) {
        //     const bytes: Uint8Array = arrayify(signature);
        //     // Get the r, s and v
        //     if (bytes.length === 64) {
        //       // EIP-2098; pull the v from the top bit of s and clear it
        //       result.v = 27 + (bytes[32] >> 7);
        //       bytes[32] &= 0x7f;
        //       result.r = hexlify(bytes.slice(0, 32));
        //       result.s = hexlify(bytes.slice(32, 64));
        //     } else if (bytes.length === 65) {
        //       result.r = hexlify(bytes.slice(0, 32));
        //       result.s = hexlify(bytes.slice(32, 64));
        //       result.v = bytes[64];
        //     } else {
        //       logger.throwArgumentError(
        //         'invalid signature string',
        //         'signature',
        //         signature,
        //       );
        //     }
        //     // Allow a recid to be used as the v
        //     if (result.v < 27) {
        //       if (result.v === 0 || result.v === 1) {
        //         result.v += 27;
        //       } else {
        //         logger.throwArgumentError(
        //           'signature invalid v byte',
        //           'signature',
        //           signature,
        //         );
        //       }
        //     }
        //     // Compute recoveryParam from v
        //     result.recoveryParam = 1 - (result.v % 2);
        //     // Compute _vs from recoveryParam and s
        //     if (result.recoveryParam) {
        //       bytes[32] |= 0x80;
        //     }
        //     result._vs = hexlify(bytes.slice(32, 64));
        //   } else {
        //     result.r = signature.r;
        //     result.s = signature.s;
        //     result.v = signature.v;
        //     result.recoveryParam = signature.recoveryParam;
        //     result._vs = signature._vs;
        //     // If the _vs is available, use it to populate missing s, v and recoveryParam
        //     // and verify non-missing s, v and recoveryParam
        //     if (result._vs != null) {
        //       const vs = zeroPad(arrayify(result._vs), 32);
        //       result._vs = hexlify(vs);
        //       // Set or check the recid
        //       const recoveryParam = vs[0] >= 128 ? 1 : 0;
        //       if (result.recoveryParam == null) {
        //         result.recoveryParam = recoveryParam;
        //       } else if (result.recoveryParam !== recoveryParam) {
        //         logger.throwArgumentError(
        //           'signature recoveryParam mismatch _vs',
        //           'signature',
        //           signature,
        //         );
        //       }
        //       // Set or check the s
        //       vs[0] &= 0x7f;
        //       const s = hexlify(vs);
        //       if (result.s == null) {
        //         result.s = s;
        //       } else if (result.s !== s) {
        //         logger.throwArgumentError(
        //           'signature v mismatch _vs',
        //           'signature',
        //           signature,
        //         );
        //       }
        //     }
        //     // Use recid and v to populate each other
        //     if (result.recoveryParam == null) {
        //       if (result.v == null) {
        //         logger.throwArgumentError(
        //           'signature missing v and recoveryParam',
        //           'signature',
        //           signature,
        //         );
        //       } else if (result.v === 0 || result.v === 1) {
        //         result.recoveryParam = result.v;
        //       } else {
        //         result.recoveryParam = 1 - (result.v % 2);
        //       }
        //     } else {
        //       if (result.v == null) {
        //         result.v = 27 + result.recoveryParam;
        //       } else {
        //         const recId =
        //           result.v === 0 || result.v === 1 ? result.v : 1 - (result.v % 2);
        //         if (result.recoveryParam !== recId) {
        //           logger.throwArgumentError(
        //             'signature recoveryParam mismatch v',
        //             'signature',
        //             signature,
        //           );
        //         }
        //       }
        //     }
        //     if (result.r == null || !isHexString(result.r)) {
        //       logger.throwArgumentError(
        //         'signature missing or invalid r',
        //         'signature',
        //         signature,
        //       );
        //     } else {
        //       result.r = hexZeroPad(result.r, 32);
        //     }
        //     if (result.s == null || !isHexString(result.s)) {
        //       logger.throwArgumentError(
        //         'signature missing or invalid s',
        //         'signature',
        //         signature,
        //       );
        //     } else {
        //       result.s = hexZeroPad(result.s, 32);
        //     }
        //     const vs = arrayify(result.s);
        //     if (vs[0] >= 128) {
        //       logger.throwArgumentError(
        //         'signature s out of range',
        //         'signature',
        //         signature,
        //       );
        //     }
        //     if (result.recoveryParam) {
        //       vs[0] |= 0x80;
        //     }
        //     const _vs = hexlify(vs);
        //     if (result._vs) {
        //       if (!isHexString(result._vs)) {
        //         logger.throwArgumentError(
        //           'signature invalid _vs',
        //           'signature',
        //           signature,
        //         );
        //       }
        //       result._vs = hexZeroPad(result._vs, 32);
        //     }
        //     // Set or check the _vs
        //     if (result._vs == null) {
        //       result._vs = _vs;
        //     } else if (result._vs !== _vs) {
        //       logger.throwArgumentError(
        //         'signature _vs mismatch v and s',
        //         'signature',
        //         signature,
        //       );
        //     }
        //   }
        //   result.yParityAndS = result._vs;
        //   result.compact = result.r + result.yParityAndS.substring(2);
        //   return result;
        // }
        // export function joinSignature(signature: SignatureLike): string {
        //   signature = splitSignature(signature);
        //   return hexlify(
        //     concat([
        //       signature.r,
        //       signature.s,
        //       signature.recoveryParam ? '0x1c' : '0x1b',
        //     ]),
        //   );
        // }
      },
      { "../logger/logger": 13 },
    ],
    23: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.computeAddress = void 0;
        const __1 = require("..");
        const bytes_1 = require("./bytes");
        const keccak256_1 = require("./keccak256");
        /**
         * Computes the address that corresponds to a specified public or private key
         *
         * @param key the public or private key to find the address related to
         * @returns the address that corresponds to the key specified
         * @example
         * ```javascript
         * computeAddress('0x0458eb591f407aef12936bd2989ca699cf5061de9c4964dd6eb6005fd8f580c407434447e813969a1be6e9954b002cad84dfc67a69e032b273e4695e7d0db2d952'); // public key
         * // '0xA2902059a7BF992f1450BACD7357CCAa5cC8336a'
         * ```
         * @example
         * ```javascript
         * computeAddress('0x2f2c419acf4a1da8c1ebea75bb3fcfbd3ec2aa3bf0162901ccdc2f38b8f92427'); // private key
         * // '0xA2902059a7BF992f1450BACD7357CCAa5cC8336a'
         * ```
         */
        function computeAddress(key) {
          // compressed public keys start with 0x04
          // uncompressed public keys start with 0x03 or 0x02
          if (
            !key.startsWith("0x04") &&
            !key.startsWith("0x03") &&
            !key.startsWith("0x02")
          ) {
            key = (0, __1.computePublicKey)(key);
          }
          return (0, __1.toChecksumAddress)(
            (0, bytes_1.hexDataSlice)(
              (0, keccak256_1.keccak256)((0, bytes_1.hexDataSlice)(key, 1)),
              12
            )
          );
        }
        exports.computeAddress = computeAddress;
      },
      { "..": 12, "./bytes": 22, "./keccak256": 30 },
    ],
    24: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.computePublicKey = void 0;
        const secp256k1_1 = require("@noble/secp256k1");
        const bytes_1 = require("./bytes");
        /**
         * Computes the public key from a given private key
         *
         * @param privKey the private key to find a public key from
         * @returns the public key related to the specified private key
         * @example
         * ```javascript
         * computePublicKey('0xb27cc8dea0177d910110e8d3ec5480d56c723abf433529f4063f261ffdb9297c');
         * // '0x045cd0032015eecfde49f82f4e149d804e8ac6e3a0bface32e37c72a71ceac864fe84da7e8df84342f7b11dfb753c4d158f636142b46b29cf7f0f171ae0aa4fb87'
         * ```
         * @example
         * ```javascript
         * computePublicKey([50,102,50,99,52,49,57,97,99,102,52,97,49,100,97,56,99,49,101,98,101,97,55,53,98,98,51,102,99,102,98,100]);
         * // '0x04a9cea77eca949df84f661cee153426fb51f2294b9364b4fac240df57360b9b0ac9c99e4d7966491ab4c81f8c82e0cd24ec5759832ad4ab736d22c7d90b806ee8'
         * ```
         */
        function computePublicKey(privKey) {
          privKey = (0, bytes_1.hexlify)(privKey).slice(2);
          return "0x" + secp256k1_1.Point.fromPrivateKey(privKey).toHex();
        }
        exports.computePublicKey = computePublicKey;
      },
      { "./bytes": 22, "@noble/secp256k1": 1 },
    ],
    25: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.etherToGwei = void 0;
        const tiny_big_1 = require("../shared/tiny-big/tiny-big");
        const validate_type_1 = require("../shared/validate-type");
        /**
         * Convert from Ether to Gwei
         *
         * No direct equivalent in ether.js; requires multiple functions to achieve.
         *
         * No direct equivalent in web3; requires multiple functions to achieve.
         *
         * @param etherQuantity the amount of ether to convert to gwei
         * @returns a number of gwei equivalent to the specified ether
         * @example
         * ```javascript
         * etherToGwei('1000').toString()
         * // '1000000000000'
         * etherToGwei(1000).toString()
         * // '1000000000000'
         * ```
         * @example
         * ```javascript
         * etherToGwei('1000').toNumber()
         * // 1000000000000
         * etherToGwei(1000).toNumber()
         * // 1000000000000
         * ```
         */
        function etherToGwei(etherQuantity) {
          (0, validate_type_1.validateType)(etherQuantity, [
            "string",
            "number",
            "object",
          ]);
          const result = (0, tiny_big_1.tinyBig)(etherQuantity).times(
            "1000000000"
          );
          return (0, tiny_big_1.tinyBig)(result);
        }
        exports.etherToGwei = etherToGwei;
      },
      { "../shared/tiny-big/tiny-big": 20, "../shared/validate-type": 21 },
    ],
    26: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.etherToWei = void 0;
        const tiny_big_1 = require("../shared/tiny-big/tiny-big");
        const validate_type_1 = require("../shared/validate-type");
        /**
         * Convert Ether to Wei
         *
         * Similar to ["parseEther" in ethers.js](https://docs.ethers.io/v5/api/utils/display-logic/#utils-parseEther)
         *
         * Similar to ["toWei" in web3.js](https://web3js.readthedocs.io/en/v1.7.1/web3-utils.html#towei)
         *
         * @param etherQuantity the amount of ether to convert to wei
         * @returns a number of wei equivalent to the specified ether
         * @example
         * ```javascript
         * etherToWei('1000').toString()
         * // '1000000000000000000000'
         * etherToWei(1000).toString()
         * // '1000000000000000000000'
         * ```
         * @example
         * ```javascript
         * etherToWei('1000').toNumber()
         * // 1000000000000000000000
         * etherToWei(1000).toNumber()
         * // 1000000000000000000000
         * ```
         */
        function etherToWei(etherQuantity) {
          (0, validate_type_1.validateType)(etherQuantity, [
            "string",
            "number",
            "object",
          ]);
          const result = (0, tiny_big_1.tinyBig)(etherQuantity).times(
            "1000000000000000000"
          );
          return (0, tiny_big_1.tinyBig)(result);
        }
        exports.etherToWei = etherToWei;
      },
      { "../shared/tiny-big/tiny-big": 20, "../shared/validate-type": 21 },
    ],
    27: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.gweiToEther = void 0;
        const tiny_big_1 = require("../shared/tiny-big/tiny-big");
        const validate_type_1 = require("../shared/validate-type");
        /**
         * Convert from Gwei to Ether
         *
         * No direct equivalent in ethers.js; requires multiple functions to achieve.
         *
         * No direct equivalent in web3; requires multiple functions to achieve.
         *
         * @param gweiQuantity the amount of gwei to convert to ether
         * @returns a number of ether equivalent to the specified gwei
         * @example
         * ```javascript
         * gweiToEther('1000000000000').toString()
         * // '1000'
         * gweiToEther(1000000000000).toString()
         * // '1000'
         * ```
         * @example
         * ```javascript
         * gweiToEther('1000000000000').toNumber()
         * // 1000
         * gweiToEther(1000000000000).toNumber()
         * // 1000
         * ```
         */
        function gweiToEther(gweiQuantity) {
          (0, validate_type_1.validateType)(gweiQuantity, [
            "string",
            "number",
            "object",
          ]);
          const result = (0, tiny_big_1.tinyBig)(gweiQuantity).div(
            "1000000000"
          );
          return (0, tiny_big_1.tinyBig)(result);
        }
        exports.gweiToEther = gweiToEther;
      },
      { "../shared/tiny-big/tiny-big": 20, "../shared/validate-type": 21 },
    ],
    28: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.hashMessage = void 0;
        const index_1 = require("../index");
        const messagePrefix = "\x19Ethereum Signed Message:\n";
        /**
         * Computes the EIP-191 personal message digest of message.
         * Personal messages are converted to UTF-8 bytes and prefixed with \x19Ethereum Signed Message: and the length of message.
         *
         * @param message the message to hash
         * @returns a message hashed using Keccak256 that matches the EIP-191 standard
         * @example
         * ```javascript
         * hashMessage("Hello World");
         * // '0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2'
         * ```
         */
        function hashMessage(message) {
          if (typeof message === "string") {
            message = (0, index_1.toUtf8Bytes)(message);
          }
          return (0, index_1.keccak256)(
            (0, index_1.concat)([
              (0, index_1.toUtf8Bytes)(messagePrefix),
              (0, index_1.toUtf8Bytes)(String(message.length)),
              message,
            ])
          );
        }
        exports.hashMessage = hashMessage;
      },
      { "../index": 12 },
    ],
    29: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.isAddress = void 0;
        const __1 = require("..");
        const validate_type_1 = require("../shared/validate-type");
        /**
         * Returns a boolean as to whether the input is a valid address.
         * Does NOT support ICAP addresses
         *
         * @param address the address to check the validity of
         * @returns a boolean for whether the input is a valid address
         * @example
         * ```javascript
         * isAddress('0xc0deaf6bd3f0c6574a6a625ef2f22f62a5150eab');
         * // true
         * ```
         * @example
         * ```javascript
         * isAddress('bad');
         * // false
         * ```
         * @example
         * ```javascript
         * // Does NOT support ENS.
         * isAddress('vitalik.eth');
         * // false
         * ```
         */
        function isAddress(address) {
          (0, validate_type_1.validateType)(address, ["string"]);
          try {
            (0, __1.toChecksumAddress)(address);
            return true;
          } catch (error) {
            return false;
          }
        }
        exports.isAddress = isAddress;
      },
      { "..": 12, "../shared/validate-type": 21 },
    ],
    30: [
      function (require, module, exports) {
        (function (Buffer) {
          (function () {
            "use strict";
            Object.defineProperty(exports, "__esModule", { value: true });
            exports.keccak256 = void 0;
            const sha3_1 = require("sha3");
            /**
             * Hashes data into a Keccak256 hex string
             *
             * @param data the data to be hashed using Keccak256
             * @returns a hex string with data hashed using Keccak256
             * @example
             * ```javascript
             * keccak256('essential-eth');
             * // '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
             *
             * keccak256('0x123');
             * // '0x5fa2358263196dbbf23d1ca7a509451f7a2f64c15837bfbb81298b1e3e24e4fa'
             * ```
             */
            function keccak256(data) {
              let bufferableData;
              if (typeof data === "string") {
                bufferableData = Buffer.from(data.replace(/^0x/, ""), "hex");
              } else {
                bufferableData = Buffer.from(data);
              }
              const keccak = new sha3_1.Keccak(256);
              const addressHash =
                "0x" + keccak.update(bufferableData).digest("hex");
              return addressHash;
            }
            exports.keccak256 = keccak256;
          }.call(this));
        }.call(this, require("buffer").Buffer));
      },
      { buffer: 52, sha3: 37 },
    ],
    31: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.solidityKeccak256 = exports.pack = void 0;
        const buffer_1 = require("buffer");
        const encode_decode_transaction_1 = require("../classes/utils/encode-decode-transaction");
        const logger_1 = require("../logger/logger");
        const tiny_big_1 = require("../shared/tiny-big/tiny-big");
        const bytes_1 = require("./bytes");
        const keccak256_1 = require("./keccak256");
        const regexBytes = new RegExp("^bytes([0-9]+)$");
        const regexNumber = new RegExp("^(u?int)([0-9]*)$");
        const regexArray = new RegExp("^(.*)\\[([0-9]*)\\]$");
        /**
         * Packs a type and value together into a UTF-8 Byte Array
         *
         * @internal
         * @param type the Solidity type used for the value given
         * @param value the value to pack with its type
         * @param isArray whether the specified data is in an array
         * @returns packed data consisting of the type and value
         * @example N/A - internal function
         */
        function _pack(type, value, isArray) {
          switch (type) {
            case "address":
              if (isArray) {
                return (0, bytes_1.zeroPad)(value, 32);
              }
              return (0, bytes_1.arrayify)(value);
            case "string":
              return buffer_1.Buffer.from(value);
            case "bytes":
              return (0, bytes_1.arrayify)(value);
            case "bool":
              value = value ? "0x01" : "0x00";
              if (isArray) {
                return (0, bytes_1.zeroPad)(value, 32);
              }
              return (0, bytes_1.arrayify)(value);
          }
          let match = type.match(regexNumber);
          if (match) {
            //let signed = (match[1] === "int")
            let size = parseInt(match[2] || "256");
            if (
              (match[2] && String(size) !== match[2]) ||
              size % 8 !== 0 ||
              size === 0 ||
              size > 256
            ) {
              logger_1.logger.throwArgumentError(
                "invalid number type",
                "type",
                type
              );
            }
            if (isArray) {
              size = 256;
            }
            value = (0, tiny_big_1.tinyBig)(value).toTwos(size).toNumber();
            const hexValue = (0, bytes_1.hexlify)(value);
            return (0, bytes_1.zeroPad)(hexValue, size / 8);
          }
          match = type.match(regexBytes);
          if (match) {
            const size = parseInt(match[1]);
            if (String(size) !== match[1] || size === 0 || size > 32) {
              logger_1.logger.throwArgumentError(
                "invalid bytes type",
                "type",
                type
              );
            }
            if ((0, bytes_1.arrayify)(value).byteLength !== size) {
              logger_1.logger.throwArgumentError(
                `invalid value for ${type}`,
                "value",
                value
              );
            }
            if (isArray) {
              return (0, bytes_1.arrayify)(
                (value + encode_decode_transaction_1.hexFalse).substring(0, 66)
              );
            }
            return value;
          }
          match = type.match(regexArray);
          if (match && Array.isArray(value)) {
            const baseType = match[1];
            const count = parseInt(match[2] || String(value.length));
            if (count != value.length) {
              logger_1.logger.throwArgumentError(
                `invalid array length for ${type}`,
                "value",
                value
              );
            }
            const result = [];
            value.forEach(function (value) {
              result.push(_pack(baseType, value, true));
            });
            return (0, bytes_1.concat)(result);
          }
          return logger_1.logger.throwArgumentError(
            "invalid type",
            "type",
            type
          );
        }
        /**
         * Converts arrays with types and values into a hex string that can be hashed
         *
         * @param types array of Solidity types, where `type[0]` is the type for `value[0]`
         * @param values array of values, where `value[0]` is of type `type[0]`
         * @returns a hex string with the data given, packed to include its types
         * @example
         * ```javascript
         * const types = ['bool', 'string', 'uint64'];
         * const values = [true, 'text', 30];
         * pack(types, values);
         * // '0x0174657874000000000000001e'
         * ```
         */
        function pack(types, values) {
          if (types.length != values.length) {
            logger_1.logger.throwArgumentError(
              "wrong number of values; expected ${ types.length }",
              "values",
              values
            );
          }
          const tight = [];
          types.forEach(function (type, index) {
            tight.push(_pack(type, values[index]));
          });
          return (0, bytes_1.hexlify)((0, bytes_1.concat)(tight));
        }
        exports.pack = pack;
        /**
         * Hashes data from Solidity using the Keccak256 algorithm.
         *
         * Similar to ["solidityKeccak256" in ethers.js](https://docs.ethers.io/v5/api/utils/hashing/#utils-solidityKeccak256)
         *
         * @param types Each [Solidity type](https://docs.soliditylang.org/en/v0.8.13/types.html) corresponding to the values passed in. Helps the function parse and pack data properly.
         * @param values Data to be concatenated (combined) and then hashed.
         * @returns A Keccak256 hash (hex string) based on the values provided
         * @example
         * ```javascript
         * const types = ['string', 'bool', 'uint32'];
         * const values = ['essential-eth is great', true, 14];
         * solidityKeccak256(types, values);
         * // '0xe4d4c8e809faac09d58f468f0aeab9474fe8965d554c6c0f868c433c3fd6acab'
         * ```
         * @example
         * ```javascript
         * const types = ['bytes4', 'uint32[5]'];
         * const values = [[116, 101, 115, 116], [5, 3, 4, 9, 18]];
         * solidityKeccak256(types, values);
         * // '0x038707a887f09355dc545412b058e7ba8f3c74047050c7c5e5e52eec608053d9'
         * ```
         */
        function solidityKeccak256(types, values) {
          return (0, keccak256_1.keccak256)(pack(types, values));
        }
        exports.solidityKeccak256 = solidityKeccak256;
      },
      {
        "../classes/utils/encode-decode-transaction": 8,
        "../logger/logger": 13,
        "../shared/tiny-big/tiny-big": 20,
        "./bytes": 22,
        "./keccak256": 30,
        buffer: 52,
      },
    ],
    32: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.splitSignature = void 0;
        const logger_1 = require("./../logger/logger");
        const bytes_1 = require("./bytes");
        /**
         * Expands a signature into the full signature object and fills in missing properties.
         *
         * Same as ["splitSignature" in ethers.js](https://docs.ethers.io/v5/api/utils/bytes/#utils-splitSignature)
         *
         * @param signature the signature object to split, parse, and compute missing properties from
         * @returns a full signature object with all properties filled
         * @example
         * ```javascript
         * const signature = '0x60bc4ed91f2021aefe7045f3f77bd12f87eb733aee24bd1965343b3c27b3971647252185b7d2abb411b01b5d1ac4ab41ea486df1e9b396758c1aec6c1b6eee331b';
         * splitSignature(signature);
         *  {
         *    r: "0x60bc4ed91f2021aefe7045f3f77bd12f87eb733aee24bd1965343b3c27b39716",
         *    s: "0x47252185b7d2abb411b01b5d1ac4ab41ea486df1e9b396758c1aec6c1b6eee33",
         *    _vs: "0x47252185b7d2abb411b01b5d1ac4ab41ea486df1e9b396758c1aec6c1b6eee33",
         *    recoveryParam: 0,
         *    v: 27,
         *    yParityAndS: "0x47252185b7d2abb411b01b5d1ac4ab41ea486df1e9b396758c1aec6c1b6eee33",
         *    compact: "0x60bc4ed91f2021aefe7045f3f77bd12f87eb733aee24bd1965343b3c27b3971647252185b7d2abb411b01b5d1ac4ab41ea486df1e9b396758c1aec6c1b6eee33"
         *  }
         * ```
         */
        function splitSignature(signature) {
          const result = {
            r: "0x",
            s: "0x",
            _vs: "0x",
            recoveryParam: 0,
            v: 0,
            yParityAndS: "0x",
            compact: "0x",
          };
          if ((0, bytes_1.isBytesLike)(signature)) {
            const bytes = (0, bytes_1.arrayify)(signature);
            // Get the r, s and v
            if (bytes.length === 64) {
              // EIP-2098; pull the v from the top bit of s and clear it
              result.v = 27 + (bytes[32] >> 7);
              bytes[32] &= 0x7f;
              result.r = (0, bytes_1.hexlify)(bytes.slice(0, 32));
              result.s = (0, bytes_1.hexlify)(bytes.slice(32, 64));
            } else if (bytes.length === 65) {
              result.r = (0, bytes_1.hexlify)(bytes.slice(0, 32));
              result.s = (0, bytes_1.hexlify)(bytes.slice(32, 64));
              result.v = bytes[64];
            } else {
              logger_1.logger.throwArgumentError(
                "invalid signature string",
                "signature",
                signature
              );
            }
            // Allow a recid to be used as the v
            if (result.v < 27) {
              if (result.v === 0 || result.v === 1) {
                result.v += 27;
              } else {
                logger_1.logger.throwArgumentError(
                  "signature invalid v byte",
                  "signature",
                  signature
                );
              }
            }
            // Compute recoveryParam from v
            result.recoveryParam = 1 - (result.v % 2);
            // Compute _vs from recoveryParam and s
            if (result.recoveryParam) {
              bytes[32] |= 0x80;
            }
            result._vs = (0, bytes_1.hexlify)(bytes.slice(32, 64));
          } else {
            result.r = signature.r;
            result.s = signature.s;
            result.v = signature.v;
            result.recoveryParam = signature.recoveryParam;
            result._vs = signature._vs;
            // If the _vs is available, use it to populate missing s, v and recoveryParam
            // and verify non-missing s, v and recoveryParam
            if (result._vs != null) {
              const vs_1 = (0, bytes_1.zeroPad)(
                (0, bytes_1.arrayify)(result._vs),
                32
              );
              result._vs = (0, bytes_1.hexlify)(vs_1);
              // Set or check the recid
              const recoveryParam = vs_1[0] >= 128 ? 1 : 0;
              if (result.recoveryParam == null) {
                result.recoveryParam = recoveryParam;
              } else if (result.recoveryParam !== recoveryParam) {
                logger_1.logger.throwArgumentError(
                  "signature recoveryParam mismatch _vs",
                  "signature",
                  signature
                );
              }
              // Set or check the s
              vs_1[0] &= 0x7f;
              const s = (0, bytes_1.hexlify)(vs_1);
              if (result.s == null) {
                result.s = s;
              } else if (result.s !== s) {
                logger_1.logger.throwArgumentError(
                  "signature v mismatch _vs",
                  "signature",
                  signature
                );
              }
            }
            // Use recid and v to populate each other
            if (result.recoveryParam == null) {
              if (result.v == null) {
                logger_1.logger.throwArgumentError(
                  "signature missing v and recoveryParam",
                  "signature",
                  signature
                );
              } else if (result.v === 0 || result.v === 1) {
                result.recoveryParam = result.v;
              } else {
                result.recoveryParam = 1 - (result.v % 2);
              }
            } else {
              if (result.v == null) {
                result.v = 27 + result.recoveryParam;
              } else {
                const recId =
                  result.v === 0 || result.v === 1
                    ? result.v
                    : 1 - (result.v % 2);
                if (result.recoveryParam !== recId) {
                  logger_1.logger.throwArgumentError(
                    "signature recoveryParam mismatch v",
                    "signature",
                    signature
                  );
                }
              }
            }
            if (result.r == null || !(0, bytes_1.isHexString)(result.r)) {
              logger_1.logger.throwArgumentError(
                "signature missing or invalid r",
                "signature",
                signature
              );
            } else {
              result.r = (0, bytes_1.hexZeroPad)(result.r, 32);
            }
            if (result.s == null || !(0, bytes_1.isHexString)(result.s)) {
              logger_1.logger.throwArgumentError(
                "signature missing or invalid s",
                "signature",
                signature
              );
            } else {
              result.s = (0, bytes_1.hexZeroPad)(result.s, 32);
            }
            const vs = (0, bytes_1.arrayify)(result.s);
            if (vs[0] >= 128) {
              logger_1.logger.throwArgumentError(
                "signature s out of range",
                "signature",
                signature
              );
            }
            if (result.recoveryParam) {
              vs[0] |= 0x80;
            }
            const _vs = (0, bytes_1.hexlify)(vs);
            if (result._vs) {
              if (!(0, bytes_1.isHexString)(result._vs)) {
                logger_1.logger.throwArgumentError(
                  "signature invalid _vs",
                  "signature",
                  signature
                );
              }
              result._vs = (0, bytes_1.hexZeroPad)(result._vs, 32);
            }
            // Set or check the _vs
            if (result._vs == null) {
              result._vs = _vs;
            } else if (result._vs !== _vs) {
              logger_1.logger.throwArgumentError(
                "signature _vs mismatch v and s",
                "signature",
                signature
              );
            }
          }
          result.yParityAndS = result._vs;
          result.compact = result.r + result.yParityAndS.substring(2);
          return result;
        }
        exports.splitSignature = splitSignature;
      },
      { "./../logger/logger": 13, "./bytes": 22 },
    ],
    33: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.toChecksumAddress = void 0;
        const sha3_1 = require("sha3");
        const validate_type_1 = require("../shared/validate-type");
        /**
         * Returns an Ethereum address in proper mixed-case checksum.
         * Does NOT support ICAP
         *
         * @param address An Ethereum address. Mixed, lower, and uppercase are all valid
         * @returns a valid checksum address
         * @example
         * ```javascript
         * toChecksumAddress('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359');
         * // '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
         * ```
         *
         * Similar to ["getAddress" in ethers.js](https://docs.ethers.io/v5/api/utils/address/#utils-getAddress)
         *
         * Similar to ["toChecksumAddress" in web3.js](https://web3js.readthedocs.io/en/v1.7.1/web3-utils.html#tochecksumaddress)
         */
        function toChecksumAddress(address) {
          (0, validate_type_1.validateType)(address, ["string"]);
          if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
            throw new Error(`Invalid Ethereum address "${address}"`);
          }
          const _address = address.toLowerCase().replace(/^0x/i, "");
          const keccak = new sha3_1.Keccak(256);
          const addressHash = keccak
            .update(_address)
            .digest("hex")
            .replace(/^0x/i, "");
          let checksumAddress = "0x";
          for (let i = 0; i < _address.length; i++) {
            // If ith character is 8 to f then make it uppercase
            if (parseInt(addressHash[i], 16) > 7) {
              checksumAddress += _address[i].toUpperCase();
            } else {
              checksumAddress += _address[i];
            }
          }
          if (
            address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) &&
            checksumAddress !== address
          ) {
            throw new Error(`Invalid Checksum address for "${address}"`);
          }
          return checksumAddress;
        }
        exports.toChecksumAddress = toChecksumAddress;
      },
      { "../shared/validate-type": 21, sha3: 37 },
    ],
    34: [
      function (require, module, exports) {
        (function (Buffer) {
          (function () {
            "use strict";
            Object.defineProperty(exports, "__esModule", { value: true });
            exports.toUtf8Bytes = void 0;
            /**
             * Converts a string into a UTF-8 Byte Array
             *
             * @param data the input to be converted to a UTF-8 Byte Array
             * @returns the specified data as a UTF-8 Byte Array
             * @example
             * ```javascript
             * toUtf8Bytes('essential-eth');
             * // Uint8Array { [Iterator] 0: 101, 1: 115, 2: 115, 3: 101, 4: 110, 5: 116, 6: 105, 7: 97, 8: 108, 9: 45, 10: 101, 11: 116, 12: 104 }
             *
             * toUtf8Bytes('ethereum');
             * // Uint8Array { [Iterator]  0: 101, 1: 116, 2: 104, 3: 101, 4: 114, 5: 101, 6: 117, 7: 109 }
             * ```
             */
            function toUtf8Bytes(data) {
              return new Uint8Array(Buffer.from(data));
            }
            exports.toUtf8Bytes = toUtf8Bytes;
          }.call(this));
        }.call(this, require("buffer").Buffer));
      },
      { buffer: 52 },
    ],
    35: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.weiToEther = void 0;
        const tiny_big_1 = require("../shared/tiny-big/tiny-big");
        const validate_type_1 = require("../shared/validate-type");
        /**
         * Convert from Wei to Ether
         *
         * Similar to ["formatEther" in ethers.js](https://docs.ethers.io/v5/api/utils/display-logic/#utils-formatEther)
         *
         * Similar to ["fromWei" in web3.js](https://web3js.readthedocs.io/en/v1.7.1/web3-utils.html#fromwei)
         *
         * @param weiQuantity the amount of wei to convert to ether
         * @returns a number of ether equivalent to the specified wei
         * @example
         * ```javascript
         * weiToEther('1000000000000000000000').toString()
         * // '1000'
         * weiToEther(1000000000000000000000).toString()
         * // '1000'
         * ```
         * @example
         * ```javascript
         * weiToEther('1000000000000000000000').toNumber()
         * // 1000
         * weiToEther(1000000000000000000000).toNumber()
         * // 1000
         * ```
         */
        function weiToEther(weiQuantity) {
          (0, validate_type_1.validateType)(weiQuantity, [
            "string",
            "number",
            "object",
          ]);
          // eslint-disable-next-line no-useless-catch
          try {
            let _weiQuantity = weiQuantity;
            if (
              typeof weiQuantity === "string" &&
              weiQuantity.slice(0, 2) === "0x"
            ) {
              _weiQuantity = BigInt(weiQuantity).toString();
            }
            const result = (0, tiny_big_1.tinyBig)(_weiQuantity).div(
              "1000000000000000000"
            );
            return (0, tiny_big_1.tinyBig)(result);
          } catch (error) {
            throw error;
          }
        }
        exports.weiToEther = weiToEther;
      },
      { "../shared/tiny-big/tiny-big": 20, "../shared/validate-type": 21 },
    ],
    36: [
      function (require, module, exports) {
        module.exports =
          self.fetch ||
          (self.fetch = require("unfetch").default || require("unfetch"));
      },
      { unfetch: 48 },
    ],
    37: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports["default"] =
          exports.SHAKE =
          exports.SHA3Hash =
          exports.SHA3 =
          exports.Keccak =
            void 0;
        var _buffer = require("buffer");
        var _sponge = _interopRequireDefault(require("./sponge"));
        function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : { default: obj };
        }
        var createHash = function createHash(_ref) {
          var allowedSizes = _ref.allowedSizes,
            defaultSize = _ref.defaultSize,
            padding = _ref.padding;
          return function Hash() {
            var _this = this;
            var size =
              arguments.length > 0 && arguments[0] !== undefined
                ? arguments[0]
                : defaultSize;
            if (!this || this.constructor !== Hash) {
              return new Hash(size);
            }
            if (allowedSizes && !allowedSizes.includes(size)) {
              throw new Error("Unsupported hash length");
            }
            var sponge = new _sponge["default"]({ capacity: size });
            this.update = function (input) {
              var encoding =
                arguments.length > 1 && arguments[1] !== undefined
                  ? arguments[1]
                  : "utf8";
              if (_buffer.Buffer.isBuffer(input)) {
                sponge.absorb(input);
                return _this;
              }
              if (typeof input === "string") {
                return _this.update(_buffer.Buffer.from(input, encoding));
              }
              throw new TypeError("Not a string or buffer");
            };
            this.digest = function () {
              var formatOrOptions =
                arguments.length > 0 && arguments[0] !== undefined
                  ? arguments[0]
                  : "binary";
              var options =
                typeof formatOrOptions === "string"
                  ? { format: formatOrOptions }
                  : formatOrOptions;
              var buffer = sponge.squeeze({
                buffer: options.buffer,
                padding: options.padding || padding,
              });
              if (options.format && options.format !== "binary") {
                return buffer.toString(options.format);
              }
              return buffer;
            };
            this.reset = function () {
              sponge.reset();
              return _this;
            };
            return this;
          };
        };
        var Keccak = createHash({
          allowedSizes: [224, 256, 384, 512],
          defaultSize: 512,
          padding: 1,
        });
        exports.Keccak = Keccak;
        var SHA3 = createHash({
          allowedSizes: [224, 256, 384, 512],
          defaultSize: 512,
          padding: 6,
        });
        exports.SHA3 = SHA3;
        var SHAKE = createHash({
          allowedSizes: [128, 256],
          defaultSize: 256,
          padding: 31,
        });
        exports.SHAKE = SHAKE;
        var SHA3Hash = Keccak;
        exports.SHA3Hash = SHA3Hash;
        SHA3.SHA3Hash = SHA3Hash;
        var _default = SHA3;
        exports["default"] = _default;
      },
      { "./sponge": 38, buffer: 52 },
    ],
    38: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports["default"] = void 0;
        var _buffer = require("buffer");
        var _permute = _interopRequireDefault(require("./permute"));
        function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : { default: obj };
        }
        var xorWords = function xorWords(I, O) {
          for (var i = 0; i < I.length; i += 8) {
            var o = i / 4;
            O[o] ^=
              (I[i + 7] << 24) | (I[i + 6] << 16) | (I[i + 5] << 8) | I[i + 4];
            O[o + 1] ^=
              (I[i + 3] << 24) | (I[i + 2] << 16) | (I[i + 1] << 8) | I[i];
          }
          return O;
        };
        var readWords = function readWords(I, O) {
          for (var o = 0; o < O.length; o += 8) {
            var i = o / 4;
            O[o] = I[i + 1];
            O[o + 1] = I[i + 1] >>> 8;
            O[o + 2] = I[i + 1] >>> 16;
            O[o + 3] = I[i + 1] >>> 24;
            O[o + 4] = I[i];
            O[o + 5] = I[i] >>> 8;
            O[o + 6] = I[i] >>> 16;
            O[o + 7] = I[i] >>> 24;
          }
          return O;
        };
        var Sponge = function Sponge(_ref) {
          var _this = this;
          var capacity = _ref.capacity,
            padding = _ref.padding;
          var keccak = (0, _permute["default"])();
          var stateSize = 200;
          var blockSize = capacity / 8;
          var queueSize = stateSize - capacity / 4;
          var queueOffset = 0;
          var state = new Uint32Array(stateSize / 4);
          var queue = _buffer.Buffer.allocUnsafe(queueSize);
          this.absorb = function (buffer) {
            for (var i = 0; i < buffer.length; i++) {
              queue[queueOffset] = buffer[i];
              queueOffset += 1;
              if (queueOffset >= queueSize) {
                xorWords(queue, state);
                keccak(state);
                queueOffset = 0;
              }
            }
            return _this;
          };
          this.squeeze = function () {
            var options =
              arguments.length > 0 && arguments[0] !== undefined
                ? arguments[0]
                : {};
            var output = {
              buffer: options.buffer || _buffer.Buffer.allocUnsafe(blockSize),
              padding: options.padding || padding,
              queue: _buffer.Buffer.allocUnsafe(queue.length),
              state: new Uint32Array(state.length),
            };
            queue.copy(output.queue);
            for (var i = 0; i < state.length; i++) {
              output.state[i] = state[i];
            }
            output.queue.fill(0, queueOffset);
            output.queue[queueOffset] |= output.padding;
            output.queue[queueSize - 1] |= 128;
            xorWords(output.queue, output.state);
            for (
              var offset = 0;
              offset < output.buffer.length;
              offset += queueSize
            ) {
              keccak(output.state);
              readWords(
                output.state,
                output.buffer.slice(offset, offset + queueSize)
              );
            }
            return output.buffer;
          };
          this.reset = function () {
            queue.fill(0);
            state.fill(0);
            queueOffset = 0;
            return _this;
          };
          return this;
        };
        var _default = Sponge;
        exports["default"] = _default;
      },
      { "./permute": 41, buffer: 52 },
    ],
    39: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports["default"] = void 0;
        var _copy = _interopRequireDefault(require("../copy"));
        function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : { default: obj };
        }
        var chi = function chi(_ref) {
          var A = _ref.A,
            C = _ref.C;
          for (var y = 0; y < 25; y += 5) {
            for (var x = 0; x < 5; x++) {
              (0, _copy["default"])(A, y + x)(C, x);
            }
            for (var _x = 0; _x < 5; _x++) {
              var xy = (y + _x) * 2;
              var x1 = ((_x + 1) % 5) * 2;
              var x2 = ((_x + 2) % 5) * 2;
              A[xy] ^= ~C[x1] & C[x2];
              A[xy + 1] ^= ~C[x1 + 1] & C[x2 + 1];
            }
          }
        };
        var _default = chi;
        exports["default"] = _default;
      },
      { "../copy": 40 },
    ],
    40: [
      function (require, module, exports) {
        "use strict";
        var copy = function copy(I, i) {
          return function (O, o) {
            var oi = o * 2;
            var ii = i * 2;
            O[oi] = I[ii];
            O[oi + 1] = I[ii + 1];
          };
        };
        module.exports = copy;
      },
      {},
    ],
    41: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports["default"] = void 0;
        var _chi = _interopRequireDefault(require("./chi"));
        var _iota = _interopRequireDefault(require("./iota"));
        var _rhoPi = _interopRequireDefault(require("./rho-pi"));
        var _theta = _interopRequireDefault(require("./theta"));
        function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : { default: obj };
        }
        var permute = function permute() {
          var C = new Uint32Array(10);
          var D = new Uint32Array(10);
          var W = new Uint32Array(2);
          return function (A) {
            for (var roundIndex = 0; roundIndex < 24; roundIndex++) {
              (0, _theta["default"])({ A: A, C: C, D: D, W: W });
              (0, _rhoPi["default"])({ A: A, C: C, W: W });
              (0, _chi["default"])({ A: A, C: C });
              (0, _iota["default"])({ A: A, roundIndex: roundIndex });
            }
            C.fill(0);
            D.fill(0);
            W.fill(0);
          };
        };
        var _default = permute;
        exports["default"] = _default;
      },
      { "./chi": 39, "./iota": 42, "./rho-pi": 44, "./theta": 47 },
    ],
    42: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports["default"] = void 0;
        var _roundConstants = _interopRequireDefault(
          require("./round-constants")
        );
        function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : { default: obj };
        }
        var iota = function iota(_ref) {
          var A = _ref.A,
            roundIndex = _ref.roundIndex;
          var i = roundIndex * 2;
          A[0] ^= _roundConstants["default"][i];
          A[1] ^= _roundConstants["default"][i + 1];
        };
        var _default = iota;
        exports["default"] = _default;
      },
      { "./round-constants": 43 },
    ],
    43: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports["default"] = void 0;
        var ROUND_CONSTANTS = new Uint32Array([
          0, 1, 0, 32898, 2147483648, 32906, 2147483648, 2147516416, 0, 32907,
          0, 2147483649, 2147483648, 2147516545, 2147483648, 32777, 0, 138, 0,
          136, 0, 2147516425, 0, 2147483658, 0, 2147516555, 2147483648, 139,
          2147483648, 32905, 2147483648, 32771, 2147483648, 32770, 2147483648,
          128, 0, 32778, 2147483648, 2147483658, 2147483648, 2147516545,
          2147483648, 32896, 0, 2147483649, 2147483648, 2147516424,
        ]);
        var _default = ROUND_CONSTANTS;
        exports["default"] = _default;
      },
      {},
    ],
    44: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports["default"] = void 0;
        var _piShuffles = _interopRequireDefault(require("./pi-shuffles"));
        var _rhoOffsets = _interopRequireDefault(require("./rho-offsets"));
        var _copy = _interopRequireDefault(require("../copy"));
        function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : { default: obj };
        }
        var rhoPi = function rhoPi(_ref) {
          var A = _ref.A,
            C = _ref.C,
            W = _ref.W;
          (0, _copy["default"])(A, 1)(W, 0);
          var H = 0;
          var L = 0;
          var Wi = 0;
          var ri = 32;
          for (var i = 0; i < 24; i++) {
            var j = _piShuffles["default"][i];
            var r = _rhoOffsets["default"][i];
            (0, _copy["default"])(A, j)(C, 0);
            H = W[0];
            L = W[1];
            ri = 32 - r;
            Wi = r < 32 ? 0 : 1;
            W[Wi] = (H << r) | (L >>> ri);
            W[(Wi + 1) % 2] = (L << r) | (H >>> ri);
            (0, _copy["default"])(W, 0)(A, j);
            (0, _copy["default"])(C, 0)(W, 0);
          }
        };
        var _default = rhoPi;
        exports["default"] = _default;
      },
      { "../copy": 40, "./pi-shuffles": 45, "./rho-offsets": 46 },
    ],
    45: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports["default"] = void 0;
        var PI_SHUFFLES = [
          10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20,
          14, 22, 9, 6, 1,
        ];
        var _default = PI_SHUFFLES;
        exports["default"] = _default;
      },
      {},
    ],
    46: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports["default"] = void 0;
        var RHO_OFFSETS = [
          1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62,
          18, 39, 61, 20, 44,
        ];
        var _default = RHO_OFFSETS;
        exports["default"] = _default;
      },
      {},
    ],
    47: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports["default"] = void 0;
        var _copy = _interopRequireDefault(require("../copy"));
        function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : { default: obj };
        }
        var theta = function theta(_ref) {
          var A = _ref.A,
            C = _ref.C,
            D = _ref.D,
            W = _ref.W;
          var H = 0;
          var L = 0;
          for (var x = 0; x < 5; x++) {
            var x20 = x * 2;
            var x21 = (x + 5) * 2;
            var x22 = (x + 10) * 2;
            var x23 = (x + 15) * 2;
            var x24 = (x + 20) * 2;
            C[x20] = A[x20] ^ A[x21] ^ A[x22] ^ A[x23] ^ A[x24];
            C[x20 + 1] =
              A[x20 + 1] ^ A[x21 + 1] ^ A[x22 + 1] ^ A[x23 + 1] ^ A[x24 + 1];
          }
          for (var _x = 0; _x < 5; _x++) {
            (0, _copy["default"])(C, (_x + 1) % 5)(W, 0);
            H = W[0];
            L = W[1];
            W[0] = (H << 1) | (L >>> 31);
            W[1] = (L << 1) | (H >>> 31);
            D[_x * 2] = C[((_x + 4) % 5) * 2] ^ W[0];
            D[_x * 2 + 1] = C[((_x + 4) % 5) * 2 + 1] ^ W[1];
            for (var y = 0; y < 25; y += 5) {
              A[(y + _x) * 2] ^= D[_x * 2];
              A[(y + _x) * 2 + 1] ^= D[_x * 2 + 1];
            }
          }
        };
        var _default = theta;
        exports["default"] = _default;
      },
      { "../copy": 40 },
    ],
    48: [
      function (require, module, exports) {
        module.exports = function (e, n) {
          return (
            (n = n || {}),
            new Promise(function (t, r) {
              var s = new XMLHttpRequest(),
                o = [],
                u = [],
                i = {},
                a = function () {
                  return {
                    ok: 2 == ((s.status / 100) | 0),
                    statusText: s.statusText,
                    status: s.status,
                    url: s.responseURL,
                    text: function () {
                      return Promise.resolve(s.responseText);
                    },
                    json: function () {
                      return Promise.resolve(s.responseText).then(JSON.parse);
                    },
                    blob: function () {
                      return Promise.resolve(new Blob([s.response]));
                    },
                    clone: a,
                    headers: {
                      keys: function () {
                        return o;
                      },
                      entries: function () {
                        return u;
                      },
                      get: function (e) {
                        return i[e.toLowerCase()];
                      },
                      has: function (e) {
                        return e.toLowerCase() in i;
                      },
                    },
                  };
                };
              for (var l in (s.open(n.method || "get", e, !0),
              (s.onload = function () {
                s
                  .getAllResponseHeaders()
                  .replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, function (e, n, t) {
                    o.push((n = n.toLowerCase())),
                      u.push([n, t]),
                      (i[n] = i[n] ? i[n] + "," + t : t);
                  }),
                  t(a());
              }),
              (s.onerror = r),
              (s.withCredentials = "include" == n.credentials),
              n.headers))
                s.setRequestHeader(l, n.headers[l]);
              s.send(n.body || null);
            })
          );
        };
      },
      {},
    ],
    49: [
      function (require, module, exports) {
        // HERE
      },
      { "essential-eth": 12 },
    ],
    50: [
      function (require, module, exports) {
        "use strict";

        exports.byteLength = byteLength;
        exports.toByteArray = toByteArray;
        exports.fromByteArray = fromByteArray;

        var lookup = [];
        var revLookup = [];
        var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;

        var code =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        for (var i = 0, len = code.length; i < len; ++i) {
          lookup[i] = code[i];
          revLookup[code.charCodeAt(i)] = i;
        }

        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        revLookup["-".charCodeAt(0)] = 62;
        revLookup["_".charCodeAt(0)] = 63;

        function getLens(b64) {
          var len = b64.length;

          if (len % 4 > 0) {
            throw new Error("Invalid string. Length must be a multiple of 4");
          }

          // Trim off extra bytes after placeholder bytes are found
          // See: https://github.com/beatgammit/base64-js/issues/42
          var validLen = b64.indexOf("=");
          if (validLen === -1) validLen = len;

          var placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4);

          return [validLen, placeHoldersLen];
        }

        // base64 is 4/3 + up to two characters of the original data
        function byteLength(b64) {
          var lens = getLens(b64);
          var validLen = lens[0];
          var placeHoldersLen = lens[1];
          return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen;
        }

        function _byteLength(b64, validLen, placeHoldersLen) {
          return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen;
        }

        function toByteArray(b64) {
          var tmp;
          var lens = getLens(b64);
          var validLen = lens[0];
          var placeHoldersLen = lens[1];

          var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));

          var curByte = 0;

          // if there are placeholders, only get up to the last complete 4 chars
          var len = placeHoldersLen > 0 ? validLen - 4 : validLen;

          var i;
          for (i = 0; i < len; i += 4) {
            tmp =
              (revLookup[b64.charCodeAt(i)] << 18) |
              (revLookup[b64.charCodeAt(i + 1)] << 12) |
              (revLookup[b64.charCodeAt(i + 2)] << 6) |
              revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xff;
            arr[curByte++] = (tmp >> 8) & 0xff;
            arr[curByte++] = tmp & 0xff;
          }

          if (placeHoldersLen === 2) {
            tmp =
              (revLookup[b64.charCodeAt(i)] << 2) |
              (revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xff;
          }

          if (placeHoldersLen === 1) {
            tmp =
              (revLookup[b64.charCodeAt(i)] << 10) |
              (revLookup[b64.charCodeAt(i + 1)] << 4) |
              (revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xff;
            arr[curByte++] = tmp & 0xff;
          }

          return arr;
        }

        function tripletToBase64(num) {
          return (
            lookup[(num >> 18) & 0x3f] +
            lookup[(num >> 12) & 0x3f] +
            lookup[(num >> 6) & 0x3f] +
            lookup[num & 0x3f]
          );
        }

        function encodeChunk(uint8, start, end) {
          var tmp;
          var output = [];
          for (var i = start; i < end; i += 3) {
            tmp =
              ((uint8[i] << 16) & 0xff0000) +
              ((uint8[i + 1] << 8) & 0xff00) +
              (uint8[i + 2] & 0xff);
            output.push(tripletToBase64(tmp));
          }
          return output.join("");
        }

        function fromByteArray(uint8) {
          var tmp;
          var len = uint8.length;
          var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
          var parts = [];
          var maxChunkLength = 16383; // must be multiple of 3

          // go through the array every three bytes, we'll deal with trailing stuff later
          for (
            var i = 0, len2 = len - extraBytes;
            i < len2;
            i += maxChunkLength
          ) {
            parts.push(
              encodeChunk(
                uint8,
                i,
                i + maxChunkLength > len2 ? len2 : i + maxChunkLength
              )
            );
          }

          // pad the end with zeros, but make sure to not forget the extra bytes
          if (extraBytes === 1) {
            tmp = uint8[len - 1];
            parts.push(lookup[tmp >> 2] + lookup[(tmp << 4) & 0x3f] + "==");
          } else if (extraBytes === 2) {
            tmp = (uint8[len - 2] << 8) + uint8[len - 1];
            parts.push(
              lookup[tmp >> 10] +
                lookup[(tmp >> 4) & 0x3f] +
                lookup[(tmp << 2) & 0x3f] +
                "="
            );
          }

          return parts.join("");
        }
      },
      {},
    ],
    51: [function (require, module, exports) {}, {}],
    52: [
      function (require, module, exports) {
        (function (Buffer) {
          (function () {
            /*!
             * The buffer module from node.js, for the browser.
             *
             * @author   Feross Aboukhadijeh <https://feross.org>
             * @license  MIT
             */
            /* eslint-disable no-proto */

            "use strict";

            var base64 = require("base64-js");
            var ieee754 = require("ieee754");

            exports.Buffer = Buffer;
            exports.SlowBuffer = SlowBuffer;
            exports.INSPECT_MAX_BYTES = 50;

            var K_MAX_LENGTH = 0x7fffffff;
            exports.kMaxLength = K_MAX_LENGTH;

            /**
             * If `Buffer.TYPED_ARRAY_SUPPORT`:
             *   === true    Use Uint8Array implementation (fastest)
             *   === false   Print warning and recommend using `buffer` v4.x which has an Object
             *               implementation (most compatible, even IE6)
             *
             * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
             * Opera 11.6+, iOS 4.2+.
             *
             * We report that the browser does not support typed arrays if the are not subclassable
             * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
             * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
             * for __proto__ and has a buggy typed array implementation.
             */
            Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

            if (
              !Buffer.TYPED_ARRAY_SUPPORT &&
              typeof console !== "undefined" &&
              typeof console.error === "function"
            ) {
              console.error(
                "This browser lacks typed array (Uint8Array) support which is required by " +
                  "`buffer` v5.x. Use `buffer` v4.x if you require old browser support."
              );
            }

            function typedArraySupport() {
              // Can typed array instances can be augmented?
              try {
                var arr = new Uint8Array(1);
                arr.__proto__ = {
                  __proto__: Uint8Array.prototype,
                  foo: function () {
                    return 42;
                  },
                };
                return arr.foo() === 42;
              } catch (e) {
                return false;
              }
            }

            Object.defineProperty(Buffer.prototype, "parent", {
              enumerable: true,
              get: function () {
                if (!Buffer.isBuffer(this)) return undefined;
                return this.buffer;
              },
            });

            Object.defineProperty(Buffer.prototype, "offset", {
              enumerable: true,
              get: function () {
                if (!Buffer.isBuffer(this)) return undefined;
                return this.byteOffset;
              },
            });

            function createBuffer(length) {
              if (length > K_MAX_LENGTH) {
                throw new RangeError(
                  'The value "' + length + '" is invalid for option "size"'
                );
              }
              // Return an augmented `Uint8Array` instance
              var buf = new Uint8Array(length);
              buf.__proto__ = Buffer.prototype;
              return buf;
            }

            /**
             * The Buffer constructor returns instances of `Uint8Array` that have their
             * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
             * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
             * and the `Uint8Array` methods. Square bracket notation works as expected -- it
             * returns a single octet.
             *
             * The `Uint8Array` prototype remains unmodified.
             */

            function Buffer(arg, encodingOrOffset, length) {
              // Common case.
              if (typeof arg === "number") {
                if (typeof encodingOrOffset === "string") {
                  throw new TypeError(
                    'The "string" argument must be of type string. Received type number'
                  );
                }
                return allocUnsafe(arg);
              }
              return from(arg, encodingOrOffset, length);
            }

            // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
            if (
              typeof Symbol !== "undefined" &&
              Symbol.species != null &&
              Buffer[Symbol.species] === Buffer
            ) {
              Object.defineProperty(Buffer, Symbol.species, {
                value: null,
                configurable: true,
                enumerable: false,
                writable: false,
              });
            }

            Buffer.poolSize = 8192; // not used by this implementation

            function from(value, encodingOrOffset, length) {
              if (typeof value === "string") {
                return fromString(value, encodingOrOffset);
              }

              if (ArrayBuffer.isView(value)) {
                return fromArrayLike(value);
              }

              if (value == null) {
                throw TypeError(
                  "The first argument must be one of type string, Buffer, ArrayBuffer, Array, " +
                    "or Array-like Object. Received type " +
                    typeof value
                );
              }

              if (
                isInstance(value, ArrayBuffer) ||
                (value && isInstance(value.buffer, ArrayBuffer))
              ) {
                return fromArrayBuffer(value, encodingOrOffset, length);
              }

              if (typeof value === "number") {
                throw new TypeError(
                  'The "value" argument must not be of type number. Received type number'
                );
              }

              var valueOf = value.valueOf && value.valueOf();
              if (valueOf != null && valueOf !== value) {
                return Buffer.from(valueOf, encodingOrOffset, length);
              }

              var b = fromObject(value);
              if (b) return b;

              if (
                typeof Symbol !== "undefined" &&
                Symbol.toPrimitive != null &&
                typeof value[Symbol.toPrimitive] === "function"
              ) {
                return Buffer.from(
                  value[Symbol.toPrimitive]("string"),
                  encodingOrOffset,
                  length
                );
              }

              throw new TypeError(
                "The first argument must be one of type string, Buffer, ArrayBuffer, Array, " +
                  "or Array-like Object. Received type " +
                  typeof value
              );
            }

            /**
             * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
             * if value is a number.
             * Buffer.from(str[, encoding])
             * Buffer.from(array)
             * Buffer.from(buffer)
             * Buffer.from(arrayBuffer[, byteOffset[, length]])
             **/
            Buffer.from = function (value, encodingOrOffset, length) {
              return from(value, encodingOrOffset, length);
            };

            // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
            // https://github.com/feross/buffer/pull/148
            Buffer.prototype.__proto__ = Uint8Array.prototype;
            Buffer.__proto__ = Uint8Array;

            function assertSize(size) {
              if (typeof size !== "number") {
                throw new TypeError('"size" argument must be of type number');
              } else if (size < 0) {
                throw new RangeError(
                  'The value "' + size + '" is invalid for option "size"'
                );
              }
            }

            function alloc(size, fill, encoding) {
              assertSize(size);
              if (size <= 0) {
                return createBuffer(size);
              }
              if (fill !== undefined) {
                // Only pay attention to encoding if it's a string. This
                // prevents accidentally sending in a number that would
                // be interpretted as a start offset.
                return typeof encoding === "string"
                  ? createBuffer(size).fill(fill, encoding)
                  : createBuffer(size).fill(fill);
              }
              return createBuffer(size);
            }

            /**
             * Creates a new filled Buffer instance.
             * alloc(size[, fill[, encoding]])
             **/
            Buffer.alloc = function (size, fill, encoding) {
              return alloc(size, fill, encoding);
            };

            function allocUnsafe(size) {
              assertSize(size);
              return createBuffer(size < 0 ? 0 : checked(size) | 0);
            }

            /**
             * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
             * */
            Buffer.allocUnsafe = function (size) {
              return allocUnsafe(size);
            };
            /**
             * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
             */
            Buffer.allocUnsafeSlow = function (size) {
              return allocUnsafe(size);
            };

            function fromString(string, encoding) {
              if (typeof encoding !== "string" || encoding === "") {
                encoding = "utf8";
              }

              if (!Buffer.isEncoding(encoding)) {
                throw new TypeError("Unknown encoding: " + encoding);
              }

              var length = byteLength(string, encoding) | 0;
              var buf = createBuffer(length);

              var actual = buf.write(string, encoding);

              if (actual !== length) {
                // Writing a hex string, for example, that contains invalid characters will
                // cause everything after the first invalid character to be ignored. (e.g.
                // 'abxxcd' will be treated as 'ab')
                buf = buf.slice(0, actual);
              }

              return buf;
            }

            function fromArrayLike(array) {
              var length = array.length < 0 ? 0 : checked(array.length) | 0;
              var buf = createBuffer(length);
              for (var i = 0; i < length; i += 1) {
                buf[i] = array[i] & 255;
              }
              return buf;
            }

            function fromArrayBuffer(array, byteOffset, length) {
              if (byteOffset < 0 || array.byteLength < byteOffset) {
                throw new RangeError('"offset" is outside of buffer bounds');
              }

              if (array.byteLength < byteOffset + (length || 0)) {
                throw new RangeError('"length" is outside of buffer bounds');
              }

              var buf;
              if (byteOffset === undefined && length === undefined) {
                buf = new Uint8Array(array);
              } else if (length === undefined) {
                buf = new Uint8Array(array, byteOffset);
              } else {
                buf = new Uint8Array(array, byteOffset, length);
              }

              // Return an augmented `Uint8Array` instance
              buf.__proto__ = Buffer.prototype;
              return buf;
            }

            function fromObject(obj) {
              if (Buffer.isBuffer(obj)) {
                var len = checked(obj.length) | 0;
                var buf = createBuffer(len);

                if (buf.length === 0) {
                  return buf;
                }

                obj.copy(buf, 0, 0, len);
                return buf;
              }

              if (obj.length !== undefined) {
                if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
                  return createBuffer(0);
                }
                return fromArrayLike(obj);
              }

              if (obj.type === "Buffer" && Array.isArray(obj.data)) {
                return fromArrayLike(obj.data);
              }
            }

            function checked(length) {
              // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
              // length is NaN (which is otherwise coerced to zero.)
              if (length >= K_MAX_LENGTH) {
                throw new RangeError(
                  "Attempt to allocate Buffer larger than maximum " +
                    "size: 0x" +
                    K_MAX_LENGTH.toString(16) +
                    " bytes"
                );
              }
              return length | 0;
            }

            function SlowBuffer(length) {
              if (+length != length) {
                // eslint-disable-line eqeqeq
                length = 0;
              }
              return Buffer.alloc(+length);
            }

            Buffer.isBuffer = function isBuffer(b) {
              return (
                b != null && b._isBuffer === true && b !== Buffer.prototype
              ); // so Buffer.isBuffer(Buffer.prototype) will be false
            };

            Buffer.compare = function compare(a, b) {
              if (isInstance(a, Uint8Array))
                a = Buffer.from(a, a.offset, a.byteLength);
              if (isInstance(b, Uint8Array))
                b = Buffer.from(b, b.offset, b.byteLength);
              if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                throw new TypeError(
                  'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
                );
              }

              if (a === b) return 0;

              var x = a.length;
              var y = b.length;

              for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                if (a[i] !== b[i]) {
                  x = a[i];
                  y = b[i];
                  break;
                }
              }

              if (x < y) return -1;
              if (y < x) return 1;
              return 0;
            };

            Buffer.isEncoding = function isEncoding(encoding) {
              switch (String(encoding).toLowerCase()) {
                case "hex":
                case "utf8":
                case "utf-8":
                case "ascii":
                case "latin1":
                case "binary":
                case "base64":
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return true;
                default:
                  return false;
              }
            };

            Buffer.concat = function concat(list, length) {
              if (!Array.isArray(list)) {
                throw new TypeError(
                  '"list" argument must be an Array of Buffers'
                );
              }

              if (list.length === 0) {
                return Buffer.alloc(0);
              }

              var i;
              if (length === undefined) {
                length = 0;
                for (i = 0; i < list.length; ++i) {
                  length += list[i].length;
                }
              }

              var buffer = Buffer.allocUnsafe(length);
              var pos = 0;
              for (i = 0; i < list.length; ++i) {
                var buf = list[i];
                if (isInstance(buf, Uint8Array)) {
                  buf = Buffer.from(buf);
                }
                if (!Buffer.isBuffer(buf)) {
                  throw new TypeError(
                    '"list" argument must be an Array of Buffers'
                  );
                }
                buf.copy(buffer, pos);
                pos += buf.length;
              }
              return buffer;
            };

            function byteLength(string, encoding) {
              if (Buffer.isBuffer(string)) {
                return string.length;
              }
              if (
                ArrayBuffer.isView(string) ||
                isInstance(string, ArrayBuffer)
              ) {
                return string.byteLength;
              }
              if (typeof string !== "string") {
                throw new TypeError(
                  'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
                    "Received type " +
                    typeof string
                );
              }

              var len = string.length;
              var mustMatch = arguments.length > 2 && arguments[2] === true;
              if (!mustMatch && len === 0) return 0;

              // Use a for loop to avoid recursion
              var loweredCase = false;
              for (;;) {
                switch (encoding) {
                  case "ascii":
                  case "latin1":
                  case "binary":
                    return len;
                  case "utf8":
                  case "utf-8":
                    return utf8ToBytes(string).length;
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return len * 2;
                  case "hex":
                    return len >>> 1;
                  case "base64":
                    return base64ToBytes(string).length;
                  default:
                    if (loweredCase) {
                      return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
                    }
                    encoding = ("" + encoding).toLowerCase();
                    loweredCase = true;
                }
              }
            }
            Buffer.byteLength = byteLength;

            function slowToString(encoding, start, end) {
              var loweredCase = false;

              // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
              // property of a typed array.

              // This behaves neither like String nor Uint8Array in that we set start/end
              // to their upper/lower bounds if the value passed is out of range.
              // undefined is handled specially as per ECMA-262 6th Edition,
              // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
              if (start === undefined || start < 0) {
                start = 0;
              }
              // Return early if start > this.length. Done here to prevent potential uint32
              // coercion fail below.
              if (start > this.length) {
                return "";
              }

              if (end === undefined || end > this.length) {
                end = this.length;
              }

              if (end <= 0) {
                return "";
              }

              // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
              end >>>= 0;
              start >>>= 0;

              if (end <= start) {
                return "";
              }

              if (!encoding) encoding = "utf8";

              while (true) {
                switch (encoding) {
                  case "hex":
                    return hexSlice(this, start, end);

                  case "utf8":
                  case "utf-8":
                    return utf8Slice(this, start, end);

                  case "ascii":
                    return asciiSlice(this, start, end);

                  case "latin1":
                  case "binary":
                    return latin1Slice(this, start, end);

                  case "base64":
                    return base64Slice(this, start, end);

                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return utf16leSlice(this, start, end);

                  default:
                    if (loweredCase)
                      throw new TypeError("Unknown encoding: " + encoding);
                    encoding = (encoding + "").toLowerCase();
                    loweredCase = true;
                }
              }
            }

            // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
            // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
            // reliably in a browserify context because there could be multiple different
            // copies of the 'buffer' package in use. This method works even for Buffer
            // instances that were created from another copy of the `buffer` package.
            // See: https://github.com/feross/buffer/issues/154
            Buffer.prototype._isBuffer = true;

            function swap(b, n, m) {
              var i = b[n];
              b[n] = b[m];
              b[m] = i;
            }

            Buffer.prototype.swap16 = function swap16() {
              var len = this.length;
              if (len % 2 !== 0) {
                throw new RangeError(
                  "Buffer size must be a multiple of 16-bits"
                );
              }
              for (var i = 0; i < len; i += 2) {
                swap(this, i, i + 1);
              }
              return this;
            };

            Buffer.prototype.swap32 = function swap32() {
              var len = this.length;
              if (len % 4 !== 0) {
                throw new RangeError(
                  "Buffer size must be a multiple of 32-bits"
                );
              }
              for (var i = 0; i < len; i += 4) {
                swap(this, i, i + 3);
                swap(this, i + 1, i + 2);
              }
              return this;
            };

            Buffer.prototype.swap64 = function swap64() {
              var len = this.length;
              if (len % 8 !== 0) {
                throw new RangeError(
                  "Buffer size must be a multiple of 64-bits"
                );
              }
              for (var i = 0; i < len; i += 8) {
                swap(this, i, i + 7);
                swap(this, i + 1, i + 6);
                swap(this, i + 2, i + 5);
                swap(this, i + 3, i + 4);
              }
              return this;
            };

            Buffer.prototype.toString = function toString() {
              var length = this.length;
              if (length === 0) return "";
              if (arguments.length === 0) return utf8Slice(this, 0, length);
              return slowToString.apply(this, arguments);
            };

            Buffer.prototype.toLocaleString = Buffer.prototype.toString;

            Buffer.prototype.equals = function equals(b) {
              if (!Buffer.isBuffer(b))
                throw new TypeError("Argument must be a Buffer");
              if (this === b) return true;
              return Buffer.compare(this, b) === 0;
            };

            Buffer.prototype.inspect = function inspect() {
              var str = "";
              var max = exports.INSPECT_MAX_BYTES;
              str = this.toString("hex", 0, max)
                .replace(/(.{2})/g, "$1 ")
                .trim();
              if (this.length > max) str += " ... ";
              return "<Buffer " + str + ">";
            };

            Buffer.prototype.compare = function compare(
              target,
              start,
              end,
              thisStart,
              thisEnd
            ) {
              if (isInstance(target, Uint8Array)) {
                target = Buffer.from(target, target.offset, target.byteLength);
              }
              if (!Buffer.isBuffer(target)) {
                throw new TypeError(
                  'The "target" argument must be one of type Buffer or Uint8Array. ' +
                    "Received type " +
                    typeof target
                );
              }

              if (start === undefined) {
                start = 0;
              }
              if (end === undefined) {
                end = target ? target.length : 0;
              }
              if (thisStart === undefined) {
                thisStart = 0;
              }
              if (thisEnd === undefined) {
                thisEnd = this.length;
              }

              if (
                start < 0 ||
                end > target.length ||
                thisStart < 0 ||
                thisEnd > this.length
              ) {
                throw new RangeError("out of range index");
              }

              if (thisStart >= thisEnd && start >= end) {
                return 0;
              }
              if (thisStart >= thisEnd) {
                return -1;
              }
              if (start >= end) {
                return 1;
              }

              start >>>= 0;
              end >>>= 0;
              thisStart >>>= 0;
              thisEnd >>>= 0;

              if (this === target) return 0;

              var x = thisEnd - thisStart;
              var y = end - start;
              var len = Math.min(x, y);

              var thisCopy = this.slice(thisStart, thisEnd);
              var targetCopy = target.slice(start, end);

              for (var i = 0; i < len; ++i) {
                if (thisCopy[i] !== targetCopy[i]) {
                  x = thisCopy[i];
                  y = targetCopy[i];
                  break;
                }
              }

              if (x < y) return -1;
              if (y < x) return 1;
              return 0;
            };

            // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
            // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
            //
            // Arguments:
            // - buffer - a Buffer to search
            // - val - a string, Buffer, or number
            // - byteOffset - an index into `buffer`; will be clamped to an int32
            // - encoding - an optional encoding, relevant is val is a string
            // - dir - true for indexOf, false for lastIndexOf
            function bidirectionalIndexOf(
              buffer,
              val,
              byteOffset,
              encoding,
              dir
            ) {
              // Empty buffer means no match
              if (buffer.length === 0) return -1;

              // Normalize byteOffset
              if (typeof byteOffset === "string") {
                encoding = byteOffset;
                byteOffset = 0;
              } else if (byteOffset > 0x7fffffff) {
                byteOffset = 0x7fffffff;
              } else if (byteOffset < -0x80000000) {
                byteOffset = -0x80000000;
              }
              byteOffset = +byteOffset; // Coerce to Number.
              if (numberIsNaN(byteOffset)) {
                // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
                byteOffset = dir ? 0 : buffer.length - 1;
              }

              // Normalize byteOffset: negative offsets start from the end of the buffer
              if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
              if (byteOffset >= buffer.length) {
                if (dir) return -1;
                else byteOffset = buffer.length - 1;
              } else if (byteOffset < 0) {
                if (dir) byteOffset = 0;
                else return -1;
              }

              // Normalize val
              if (typeof val === "string") {
                val = Buffer.from(val, encoding);
              }

              // Finally, search either indexOf (if dir is true) or lastIndexOf
              if (Buffer.isBuffer(val)) {
                // Special case: looking for empty string/buffer always fails
                if (val.length === 0) {
                  return -1;
                }
                return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
              } else if (typeof val === "number") {
                val = val & 0xff; // Search for a byte value [0-255]
                if (typeof Uint8Array.prototype.indexOf === "function") {
                  if (dir) {
                    return Uint8Array.prototype.indexOf.call(
                      buffer,
                      val,
                      byteOffset
                    );
                  } else {
                    return Uint8Array.prototype.lastIndexOf.call(
                      buffer,
                      val,
                      byteOffset
                    );
                  }
                }
                return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
              }

              throw new TypeError("val must be string, number or Buffer");
            }

            function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
              var indexSize = 1;
              var arrLength = arr.length;
              var valLength = val.length;

              if (encoding !== undefined) {
                encoding = String(encoding).toLowerCase();
                if (
                  encoding === "ucs2" ||
                  encoding === "ucs-2" ||
                  encoding === "utf16le" ||
                  encoding === "utf-16le"
                ) {
                  if (arr.length < 2 || val.length < 2) {
                    return -1;
                  }
                  indexSize = 2;
                  arrLength /= 2;
                  valLength /= 2;
                  byteOffset /= 2;
                }
              }

              function read(buf, i) {
                if (indexSize === 1) {
                  return buf[i];
                } else {
                  return buf.readUInt16BE(i * indexSize);
                }
              }

              var i;
              if (dir) {
                var foundIndex = -1;
                for (i = byteOffset; i < arrLength; i++) {
                  if (
                    read(arr, i) ===
                    read(val, foundIndex === -1 ? 0 : i - foundIndex)
                  ) {
                    if (foundIndex === -1) foundIndex = i;
                    if (i - foundIndex + 1 === valLength)
                      return foundIndex * indexSize;
                  } else {
                    if (foundIndex !== -1) i -= i - foundIndex;
                    foundIndex = -1;
                  }
                }
              } else {
                if (byteOffset + valLength > arrLength)
                  byteOffset = arrLength - valLength;
                for (i = byteOffset; i >= 0; i--) {
                  var found = true;
                  for (var j = 0; j < valLength; j++) {
                    if (read(arr, i + j) !== read(val, j)) {
                      found = false;
                      break;
                    }
                  }
                  if (found) return i;
                }
              }

              return -1;
            }

            Buffer.prototype.includes = function includes(
              val,
              byteOffset,
              encoding
            ) {
              return this.indexOf(val, byteOffset, encoding) !== -1;
            };

            Buffer.prototype.indexOf = function indexOf(
              val,
              byteOffset,
              encoding
            ) {
              return bidirectionalIndexOf(
                this,
                val,
                byteOffset,
                encoding,
                true
              );
            };

            Buffer.prototype.lastIndexOf = function lastIndexOf(
              val,
              byteOffset,
              encoding
            ) {
              return bidirectionalIndexOf(
                this,
                val,
                byteOffset,
                encoding,
                false
              );
            };

            function hexWrite(buf, string, offset, length) {
              offset = Number(offset) || 0;
              var remaining = buf.length - offset;
              if (!length) {
                length = remaining;
              } else {
                length = Number(length);
                if (length > remaining) {
                  length = remaining;
                }
              }

              var strLen = string.length;

              if (length > strLen / 2) {
                length = strLen / 2;
              }
              for (var i = 0; i < length; ++i) {
                var parsed = parseInt(string.substr(i * 2, 2), 16);
                if (numberIsNaN(parsed)) return i;
                buf[offset + i] = parsed;
              }
              return i;
            }

            function utf8Write(buf, string, offset, length) {
              return blitBuffer(
                utf8ToBytes(string, buf.length - offset),
                buf,
                offset,
                length
              );
            }

            function asciiWrite(buf, string, offset, length) {
              return blitBuffer(asciiToBytes(string), buf, offset, length);
            }

            function latin1Write(buf, string, offset, length) {
              return asciiWrite(buf, string, offset, length);
            }

            function base64Write(buf, string, offset, length) {
              return blitBuffer(base64ToBytes(string), buf, offset, length);
            }

            function ucs2Write(buf, string, offset, length) {
              return blitBuffer(
                utf16leToBytes(string, buf.length - offset),
                buf,
                offset,
                length
              );
            }

            Buffer.prototype.write = function write(
              string,
              offset,
              length,
              encoding
            ) {
              // Buffer#write(string)
              if (offset === undefined) {
                encoding = "utf8";
                length = this.length;
                offset = 0;
                // Buffer#write(string, encoding)
              } else if (length === undefined && typeof offset === "string") {
                encoding = offset;
                length = this.length;
                offset = 0;
                // Buffer#write(string, offset[, length][, encoding])
              } else if (isFinite(offset)) {
                offset = offset >>> 0;
                if (isFinite(length)) {
                  length = length >>> 0;
                  if (encoding === undefined) encoding = "utf8";
                } else {
                  encoding = length;
                  length = undefined;
                }
              } else {
                throw new Error(
                  "Buffer.write(string, encoding, offset[, length]) is no longer supported"
                );
              }

              var remaining = this.length - offset;
              if (length === undefined || length > remaining)
                length = remaining;

              if (
                (string.length > 0 && (length < 0 || offset < 0)) ||
                offset > this.length
              ) {
                throw new RangeError("Attempt to write outside buffer bounds");
              }

              if (!encoding) encoding = "utf8";

              var loweredCase = false;
              for (;;) {
                switch (encoding) {
                  case "hex":
                    return hexWrite(this, string, offset, length);

                  case "utf8":
                  case "utf-8":
                    return utf8Write(this, string, offset, length);

                  case "ascii":
                    return asciiWrite(this, string, offset, length);

                  case "latin1":
                  case "binary":
                    return latin1Write(this, string, offset, length);

                  case "base64":
                    // Warning: maxLength not taken into account in base64Write
                    return base64Write(this, string, offset, length);

                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return ucs2Write(this, string, offset, length);

                  default:
                    if (loweredCase)
                      throw new TypeError("Unknown encoding: " + encoding);
                    encoding = ("" + encoding).toLowerCase();
                    loweredCase = true;
                }
              }
            };

            Buffer.prototype.toJSON = function toJSON() {
              return {
                type: "Buffer",
                data: Array.prototype.slice.call(this._arr || this, 0),
              };
            };

            function base64Slice(buf, start, end) {
              if (start === 0 && end === buf.length) {
                return base64.fromByteArray(buf);
              } else {
                return base64.fromByteArray(buf.slice(start, end));
              }
            }

            function utf8Slice(buf, start, end) {
              end = Math.min(buf.length, end);
              var res = [];

              var i = start;
              while (i < end) {
                var firstByte = buf[i];
                var codePoint = null;
                var bytesPerSequence =
                  firstByte > 0xef
                    ? 4
                    : firstByte > 0xdf
                    ? 3
                    : firstByte > 0xbf
                    ? 2
                    : 1;

                if (i + bytesPerSequence <= end) {
                  var secondByte, thirdByte, fourthByte, tempCodePoint;

                  switch (bytesPerSequence) {
                    case 1:
                      if (firstByte < 0x80) {
                        codePoint = firstByte;
                      }
                      break;
                    case 2:
                      secondByte = buf[i + 1];
                      if ((secondByte & 0xc0) === 0x80) {
                        tempCodePoint =
                          ((firstByte & 0x1f) << 0x6) | (secondByte & 0x3f);
                        if (tempCodePoint > 0x7f) {
                          codePoint = tempCodePoint;
                        }
                      }
                      break;
                    case 3:
                      secondByte = buf[i + 1];
                      thirdByte = buf[i + 2];
                      if (
                        (secondByte & 0xc0) === 0x80 &&
                        (thirdByte & 0xc0) === 0x80
                      ) {
                        tempCodePoint =
                          ((firstByte & 0xf) << 0xc) |
                          ((secondByte & 0x3f) << 0x6) |
                          (thirdByte & 0x3f);
                        if (
                          tempCodePoint > 0x7ff &&
                          (tempCodePoint < 0xd800 || tempCodePoint > 0xdfff)
                        ) {
                          codePoint = tempCodePoint;
                        }
                      }
                      break;
                    case 4:
                      secondByte = buf[i + 1];
                      thirdByte = buf[i + 2];
                      fourthByte = buf[i + 3];
                      if (
                        (secondByte & 0xc0) === 0x80 &&
                        (thirdByte & 0xc0) === 0x80 &&
                        (fourthByte & 0xc0) === 0x80
                      ) {
                        tempCodePoint =
                          ((firstByte & 0xf) << 0x12) |
                          ((secondByte & 0x3f) << 0xc) |
                          ((thirdByte & 0x3f) << 0x6) |
                          (fourthByte & 0x3f);
                        if (
                          tempCodePoint > 0xffff &&
                          tempCodePoint < 0x110000
                        ) {
                          codePoint = tempCodePoint;
                        }
                      }
                  }
                }

                if (codePoint === null) {
                  // we did not generate a valid codePoint so insert a
                  // replacement char (U+FFFD) and advance only 1 byte
                  codePoint = 0xfffd;
                  bytesPerSequence = 1;
                } else if (codePoint > 0xffff) {
                  // encode to utf16 (surrogate pair dance)
                  codePoint -= 0x10000;
                  res.push(((codePoint >>> 10) & 0x3ff) | 0xd800);
                  codePoint = 0xdc00 | (codePoint & 0x3ff);
                }

                res.push(codePoint);
                i += bytesPerSequence;
              }

              return decodeCodePointsArray(res);
            }

            // Based on http://stackoverflow.com/a/22747272/680742, the browser with
            // the lowest limit is Chrome, with 0x10000 args.
            // We go 1 magnitude less, for safety
            var MAX_ARGUMENTS_LENGTH = 0x1000;

            function decodeCodePointsArray(codePoints) {
              var len = codePoints.length;
              if (len <= MAX_ARGUMENTS_LENGTH) {
                return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
              }

              // Decode in chunks to avoid "call stack size exceeded".
              var res = "";
              var i = 0;
              while (i < len) {
                res += String.fromCharCode.apply(
                  String,
                  codePoints.slice(i, (i += MAX_ARGUMENTS_LENGTH))
                );
              }
              return res;
            }

            function asciiSlice(buf, start, end) {
              var ret = "";
              end = Math.min(buf.length, end);

              for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i] & 0x7f);
              }
              return ret;
            }

            function latin1Slice(buf, start, end) {
              var ret = "";
              end = Math.min(buf.length, end);

              for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i]);
              }
              return ret;
            }

            function hexSlice(buf, start, end) {
              var len = buf.length;

              if (!start || start < 0) start = 0;
              if (!end || end < 0 || end > len) end = len;

              var out = "";
              for (var i = start; i < end; ++i) {
                out += toHex(buf[i]);
              }
              return out;
            }

            function utf16leSlice(buf, start, end) {
              var bytes = buf.slice(start, end);
              var res = "";
              for (var i = 0; i < bytes.length; i += 2) {
                res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
              }
              return res;
            }

            Buffer.prototype.slice = function slice(start, end) {
              var len = this.length;
              start = ~~start;
              end = end === undefined ? len : ~~end;

              if (start < 0) {
                start += len;
                if (start < 0) start = 0;
              } else if (start > len) {
                start = len;
              }

              if (end < 0) {
                end += len;
                if (end < 0) end = 0;
              } else if (end > len) {
                end = len;
              }

              if (end < start) end = start;

              var newBuf = this.subarray(start, end);
              // Return an augmented `Uint8Array` instance
              newBuf.__proto__ = Buffer.prototype;
              return newBuf;
            };

            /*
             * Need to make sure that buffer isn't trying to write out of bounds.
             */
            function checkOffset(offset, ext, length) {
              if (offset % 1 !== 0 || offset < 0)
                throw new RangeError("offset is not uint");
              if (offset + ext > length)
                throw new RangeError("Trying to access beyond buffer length");
            }

            Buffer.prototype.readUIntLE = function readUIntLE(
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var val = this[offset];
              var mul = 1;
              var i = 0;
              while (++i < byteLength && (mul *= 0x100)) {
                val += this[offset + i] * mul;
              }

              return val;
            };

            Buffer.prototype.readUIntBE = function readUIntBE(
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) {
                checkOffset(offset, byteLength, this.length);
              }

              var val = this[offset + --byteLength];
              var mul = 1;
              while (byteLength > 0 && (mul *= 0x100)) {
                val += this[offset + --byteLength] * mul;
              }

              return val;
            };

            Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 1, this.length);
              return this[offset];
            };

            Buffer.prototype.readUInt16LE = function readUInt16LE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 2, this.length);
              return this[offset] | (this[offset + 1] << 8);
            };

            Buffer.prototype.readUInt16BE = function readUInt16BE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 2, this.length);
              return (this[offset] << 8) | this[offset + 1];
            };

            Buffer.prototype.readUInt32LE = function readUInt32LE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (
                (this[offset] |
                  (this[offset + 1] << 8) |
                  (this[offset + 2] << 16)) +
                this[offset + 3] * 0x1000000
              );
            };

            Buffer.prototype.readUInt32BE = function readUInt32BE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (
                this[offset] * 0x1000000 +
                ((this[offset + 1] << 16) |
                  (this[offset + 2] << 8) |
                  this[offset + 3])
              );
            };

            Buffer.prototype.readIntLE = function readIntLE(
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var val = this[offset];
              var mul = 1;
              var i = 0;
              while (++i < byteLength && (mul *= 0x100)) {
                val += this[offset + i] * mul;
              }
              mul *= 0x80;

              if (val >= mul) val -= Math.pow(2, 8 * byteLength);

              return val;
            };

            Buffer.prototype.readIntBE = function readIntBE(
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var i = byteLength;
              var mul = 1;
              var val = this[offset + --i];
              while (i > 0 && (mul *= 0x100)) {
                val += this[offset + --i] * mul;
              }
              mul *= 0x80;

              if (val >= mul) val -= Math.pow(2, 8 * byteLength);

              return val;
            };

            Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 1, this.length);
              if (!(this[offset] & 0x80)) return this[offset];
              return (0xff - this[offset] + 1) * -1;
            };

            Buffer.prototype.readInt16LE = function readInt16LE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 2, this.length);
              var val = this[offset] | (this[offset + 1] << 8);
              return val & 0x8000 ? val | 0xffff0000 : val;
            };

            Buffer.prototype.readInt16BE = function readInt16BE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 2, this.length);
              var val = this[offset + 1] | (this[offset] << 8);
              return val & 0x8000 ? val | 0xffff0000 : val;
            };

            Buffer.prototype.readInt32LE = function readInt32LE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (
                this[offset] |
                (this[offset + 1] << 8) |
                (this[offset + 2] << 16) |
                (this[offset + 3] << 24)
              );
            };

            Buffer.prototype.readInt32BE = function readInt32BE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (
                (this[offset] << 24) |
                (this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                this[offset + 3]
              );
            };

            Buffer.prototype.readFloatLE = function readFloatLE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);
              return ieee754.read(this, offset, true, 23, 4);
            };

            Buffer.prototype.readFloatBE = function readFloatBE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);
              return ieee754.read(this, offset, false, 23, 4);
            };

            Buffer.prototype.readDoubleLE = function readDoubleLE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 8, this.length);
              return ieee754.read(this, offset, true, 52, 8);
            };

            Buffer.prototype.readDoubleBE = function readDoubleBE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 8, this.length);
              return ieee754.read(this, offset, false, 52, 8);
            };

            function checkInt(buf, value, offset, ext, max, min) {
              if (!Buffer.isBuffer(buf))
                throw new TypeError(
                  '"buffer" argument must be a Buffer instance'
                );
              if (value > max || value < min)
                throw new RangeError('"value" argument is out of bounds');
              if (offset + ext > buf.length)
                throw new RangeError("Index out of range");
            }

            Buffer.prototype.writeUIntLE = function writeUIntLE(
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                checkInt(this, value, offset, byteLength, maxBytes, 0);
              }

              var mul = 1;
              var i = 0;
              this[offset] = value & 0xff;
              while (++i < byteLength && (mul *= 0x100)) {
                this[offset + i] = (value / mul) & 0xff;
              }

              return offset + byteLength;
            };

            Buffer.prototype.writeUIntBE = function writeUIntBE(
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                checkInt(this, value, offset, byteLength, maxBytes, 0);
              }

              var i = byteLength - 1;
              var mul = 1;
              this[offset + i] = value & 0xff;
              while (--i >= 0 && (mul *= 0x100)) {
                this[offset + i] = (value / mul) & 0xff;
              }

              return offset + byteLength;
            };

            Buffer.prototype.writeUInt8 = function writeUInt8(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
              this[offset] = value & 0xff;
              return offset + 1;
            };

            Buffer.prototype.writeUInt16LE = function writeUInt16LE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
              this[offset] = value & 0xff;
              this[offset + 1] = value >>> 8;
              return offset + 2;
            };

            Buffer.prototype.writeUInt16BE = function writeUInt16BE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
              this[offset] = value >>> 8;
              this[offset + 1] = value & 0xff;
              return offset + 2;
            };

            Buffer.prototype.writeUInt32LE = function writeUInt32LE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
              this[offset + 3] = value >>> 24;
              this[offset + 2] = value >>> 16;
              this[offset + 1] = value >>> 8;
              this[offset] = value & 0xff;
              return offset + 4;
            };

            Buffer.prototype.writeUInt32BE = function writeUInt32BE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
              this[offset] = value >>> 24;
              this[offset + 1] = value >>> 16;
              this[offset + 2] = value >>> 8;
              this[offset + 3] = value & 0xff;
              return offset + 4;
            };

            Buffer.prototype.writeIntLE = function writeIntLE(
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1);

                checkInt(this, value, offset, byteLength, limit - 1, -limit);
              }

              var i = 0;
              var mul = 1;
              var sub = 0;
              this[offset] = value & 0xff;
              while (++i < byteLength && (mul *= 0x100)) {
                if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                  sub = 1;
                }
                this[offset + i] = (((value / mul) >> 0) - sub) & 0xff;
              }

              return offset + byteLength;
            };

            Buffer.prototype.writeIntBE = function writeIntBE(
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1);

                checkInt(this, value, offset, byteLength, limit - 1, -limit);
              }

              var i = byteLength - 1;
              var mul = 1;
              var sub = 0;
              this[offset + i] = value & 0xff;
              while (--i >= 0 && (mul *= 0x100)) {
                if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                  sub = 1;
                }
                this[offset + i] = (((value / mul) >> 0) - sub) & 0xff;
              }

              return offset + byteLength;
            };

            Buffer.prototype.writeInt8 = function writeInt8(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
              if (value < 0) value = 0xff + value + 1;
              this[offset] = value & 0xff;
              return offset + 1;
            };

            Buffer.prototype.writeInt16LE = function writeInt16LE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
              this[offset] = value & 0xff;
              this[offset + 1] = value >>> 8;
              return offset + 2;
            };

            Buffer.prototype.writeInt16BE = function writeInt16BE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
              this[offset] = value >>> 8;
              this[offset + 1] = value & 0xff;
              return offset + 2;
            };

            Buffer.prototype.writeInt32LE = function writeInt32LE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert)
                checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
              this[offset] = value & 0xff;
              this[offset + 1] = value >>> 8;
              this[offset + 2] = value >>> 16;
              this[offset + 3] = value >>> 24;
              return offset + 4;
            };

            Buffer.prototype.writeInt32BE = function writeInt32BE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert)
                checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
              if (value < 0) value = 0xffffffff + value + 1;
              this[offset] = value >>> 24;
              this[offset + 1] = value >>> 16;
              this[offset + 2] = value >>> 8;
              this[offset + 3] = value & 0xff;
              return offset + 4;
            };

            function checkIEEE754(buf, value, offset, ext, max, min) {
              if (offset + ext > buf.length)
                throw new RangeError("Index out of range");
              if (offset < 0) throw new RangeError("Index out of range");
            }

            function writeFloat(buf, value, offset, littleEndian, noAssert) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) {
                checkIEEE754(
                  buf,
                  value,
                  offset,
                  4,
                  3.4028234663852886e38,
                  -3.4028234663852886e38
                );
              }
              ieee754.write(buf, value, offset, littleEndian, 23, 4);
              return offset + 4;
            }

            Buffer.prototype.writeFloatLE = function writeFloatLE(
              value,
              offset,
              noAssert
            ) {
              return writeFloat(this, value, offset, true, noAssert);
            };

            Buffer.prototype.writeFloatBE = function writeFloatBE(
              value,
              offset,
              noAssert
            ) {
              return writeFloat(this, value, offset, false, noAssert);
            };

            function writeDouble(buf, value, offset, littleEndian, noAssert) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) {
                checkIEEE754(
                  buf,
                  value,
                  offset,
                  8,
                  1.7976931348623157e308,
                  -1.7976931348623157e308
                );
              }
              ieee754.write(buf, value, offset, littleEndian, 52, 8);
              return offset + 8;
            }

            Buffer.prototype.writeDoubleLE = function writeDoubleLE(
              value,
              offset,
              noAssert
            ) {
              return writeDouble(this, value, offset, true, noAssert);
            };

            Buffer.prototype.writeDoubleBE = function writeDoubleBE(
              value,
              offset,
              noAssert
            ) {
              return writeDouble(this, value, offset, false, noAssert);
            };

            // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
            Buffer.prototype.copy = function copy(
              target,
              targetStart,
              start,
              end
            ) {
              if (!Buffer.isBuffer(target))
                throw new TypeError("argument should be a Buffer");
              if (!start) start = 0;
              if (!end && end !== 0) end = this.length;
              if (targetStart >= target.length) targetStart = target.length;
              if (!targetStart) targetStart = 0;
              if (end > 0 && end < start) end = start;

              // Copy 0 bytes; we're done
              if (end === start) return 0;
              if (target.length === 0 || this.length === 0) return 0;

              // Fatal error conditions
              if (targetStart < 0) {
                throw new RangeError("targetStart out of bounds");
              }
              if (start < 0 || start >= this.length)
                throw new RangeError("Index out of range");
              if (end < 0) throw new RangeError("sourceEnd out of bounds");

              // Are we oob?
              if (end > this.length) end = this.length;
              if (target.length - targetStart < end - start) {
                end = target.length - targetStart + start;
              }

              var len = end - start;

              if (
                this === target &&
                typeof Uint8Array.prototype.copyWithin === "function"
              ) {
                // Use built-in when available, missing from IE11
                this.copyWithin(targetStart, start, end);
              } else if (
                this === target &&
                start < targetStart &&
                targetStart < end
              ) {
                // descending copy from end
                for (var i = len - 1; i >= 0; --i) {
                  target[i + targetStart] = this[i + start];
                }
              } else {
                Uint8Array.prototype.set.call(
                  target,
                  this.subarray(start, end),
                  targetStart
                );
              }

              return len;
            };

            // Usage:
            //    buffer.fill(number[, offset[, end]])
            //    buffer.fill(buffer[, offset[, end]])
            //    buffer.fill(string[, offset[, end]][, encoding])
            Buffer.prototype.fill = function fill(val, start, end, encoding) {
              // Handle string cases:
              if (typeof val === "string") {
                if (typeof start === "string") {
                  encoding = start;
                  start = 0;
                  end = this.length;
                } else if (typeof end === "string") {
                  encoding = end;
                  end = this.length;
                }
                if (encoding !== undefined && typeof encoding !== "string") {
                  throw new TypeError("encoding must be a string");
                }
                if (
                  typeof encoding === "string" &&
                  !Buffer.isEncoding(encoding)
                ) {
                  throw new TypeError("Unknown encoding: " + encoding);
                }
                if (val.length === 1) {
                  var code = val.charCodeAt(0);
                  if (
                    (encoding === "utf8" && code < 128) ||
                    encoding === "latin1"
                  ) {
                    // Fast path: If `val` fits into a single byte, use that numeric value.
                    val = code;
                  }
                }
              } else if (typeof val === "number") {
                val = val & 255;
              }

              // Invalid ranges are not set to a default, so can range check early.
              if (start < 0 || this.length < start || this.length < end) {
                throw new RangeError("Out of range index");
              }

              if (end <= start) {
                return this;
              }

              start = start >>> 0;
              end = end === undefined ? this.length : end >>> 0;

              if (!val) val = 0;

              var i;
              if (typeof val === "number") {
                for (i = start; i < end; ++i) {
                  this[i] = val;
                }
              } else {
                var bytes = Buffer.isBuffer(val)
                  ? val
                  : Buffer.from(val, encoding);
                var len = bytes.length;
                if (len === 0) {
                  throw new TypeError(
                    'The value "' + val + '" is invalid for argument "value"'
                  );
                }
                for (i = 0; i < end - start; ++i) {
                  this[i + start] = bytes[i % len];
                }
              }

              return this;
            };

            // HELPER FUNCTIONS
            // ================

            var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

            function base64clean(str) {
              // Node takes equal signs as end of the Base64 encoding
              str = str.split("=")[0];
              // Node strips out invalid characters like \n and \t from the string, base64-js does not
              str = str.trim().replace(INVALID_BASE64_RE, "");
              // Node converts strings with length < 2 to ''
              if (str.length < 2) return "";
              // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
              while (str.length % 4 !== 0) {
                str = str + "=";
              }
              return str;
            }

            function toHex(n) {
              if (n < 16) return "0" + n.toString(16);
              return n.toString(16);
            }

            function utf8ToBytes(string, units) {
              units = units || Infinity;
              var codePoint;
              var length = string.length;
              var leadSurrogate = null;
              var bytes = [];

              for (var i = 0; i < length; ++i) {
                codePoint = string.charCodeAt(i);

                // is surrogate component
                if (codePoint > 0xd7ff && codePoint < 0xe000) {
                  // last char was a lead
                  if (!leadSurrogate) {
                    // no lead yet
                    if (codePoint > 0xdbff) {
                      // unexpected trail
                      if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
                      continue;
                    } else if (i + 1 === length) {
                      // unpaired lead
                      if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
                      continue;
                    }

                    // valid lead
                    leadSurrogate = codePoint;

                    continue;
                  }

                  // 2 leads in a row
                  if (codePoint < 0xdc00) {
                    if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
                    leadSurrogate = codePoint;
                    continue;
                  }

                  // valid surrogate pair
                  codePoint =
                    (((leadSurrogate - 0xd800) << 10) | (codePoint - 0xdc00)) +
                    0x10000;
                } else if (leadSurrogate) {
                  // valid bmp char, but last char was a lead
                  if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
                }

                leadSurrogate = null;

                // encode utf8
                if (codePoint < 0x80) {
                  if ((units -= 1) < 0) break;
                  bytes.push(codePoint);
                } else if (codePoint < 0x800) {
                  if ((units -= 2) < 0) break;
                  bytes.push(
                    (codePoint >> 0x6) | 0xc0,
                    (codePoint & 0x3f) | 0x80
                  );
                } else if (codePoint < 0x10000) {
                  if ((units -= 3) < 0) break;
                  bytes.push(
                    (codePoint >> 0xc) | 0xe0,
                    ((codePoint >> 0x6) & 0x3f) | 0x80,
                    (codePoint & 0x3f) | 0x80
                  );
                } else if (codePoint < 0x110000) {
                  if ((units -= 4) < 0) break;
                  bytes.push(
                    (codePoint >> 0x12) | 0xf0,
                    ((codePoint >> 0xc) & 0x3f) | 0x80,
                    ((codePoint >> 0x6) & 0x3f) | 0x80,
                    (codePoint & 0x3f) | 0x80
                  );
                } else {
                  throw new Error("Invalid code point");
                }
              }

              return bytes;
            }

            function asciiToBytes(str) {
              var byteArray = [];
              for (var i = 0; i < str.length; ++i) {
                // Node's code seems to be doing this and not & 0x7F..
                byteArray.push(str.charCodeAt(i) & 0xff);
              }
              return byteArray;
            }

            function utf16leToBytes(str, units) {
              var c, hi, lo;
              var byteArray = [];
              for (var i = 0; i < str.length; ++i) {
                if ((units -= 2) < 0) break;

                c = str.charCodeAt(i);
                hi = c >> 8;
                lo = c % 256;
                byteArray.push(lo);
                byteArray.push(hi);
              }

              return byteArray;
            }

            function base64ToBytes(str) {
              return base64.toByteArray(base64clean(str));
            }

            function blitBuffer(src, dst, offset, length) {
              for (var i = 0; i < length; ++i) {
                if (i + offset >= dst.length || i >= src.length) break;
                dst[i + offset] = src[i];
              }
              return i;
            }

            // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
            // the `instanceof` check but they should be treated as of that type.
            // See: https://github.com/feross/buffer/issues/166
            function isInstance(obj, type) {
              return (
                obj instanceof type ||
                (obj != null &&
                  obj.constructor != null &&
                  obj.constructor.name != null &&
                  obj.constructor.name === type.name)
              );
            }
            function numberIsNaN(obj) {
              // For IE11 support
              return obj !== obj; // eslint-disable-line no-self-compare
            }
          }.call(this));
        }.call(this, require("buffer").Buffer));
      },
      { "base64-js": 50, buffer: 52, ieee754: 53 },
    ],
    53: [
      function (require, module, exports) {
        /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
        exports.read = function (buffer, offset, isLE, mLen, nBytes) {
          var e, m;
          var eLen = nBytes * 8 - mLen - 1;
          var eMax = (1 << eLen) - 1;
          var eBias = eMax >> 1;
          var nBits = -7;
          var i = isLE ? nBytes - 1 : 0;
          var d = isLE ? -1 : 1;
          var s = buffer[offset + i];

          i += d;

          e = s & ((1 << -nBits) - 1);
          s >>= -nBits;
          nBits += eLen;
          for (
            ;
            nBits > 0;
            e = e * 256 + buffer[offset + i], i += d, nBits -= 8
          ) {}

          m = e & ((1 << -nBits) - 1);
          e >>= -nBits;
          nBits += mLen;
          for (
            ;
            nBits > 0;
            m = m * 256 + buffer[offset + i], i += d, nBits -= 8
          ) {}

          if (e === 0) {
            e = 1 - eBias;
          } else if (e === eMax) {
            return m ? NaN : (s ? -1 : 1) * Infinity;
          } else {
            m = m + Math.pow(2, mLen);
            e = e - eBias;
          }
          return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
        };

        exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
          var e, m, c;
          var eLen = nBytes * 8 - mLen - 1;
          var eMax = (1 << eLen) - 1;
          var eBias = eMax >> 1;
          var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
          var i = isLE ? 0 : nBytes - 1;
          var d = isLE ? 1 : -1;
          var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

          value = Math.abs(value);

          if (isNaN(value) || value === Infinity) {
            m = isNaN(value) ? 1 : 0;
            e = eMax;
          } else {
            e = Math.floor(Math.log(value) / Math.LN2);
            if (value * (c = Math.pow(2, -e)) < 1) {
              e--;
              c *= 2;
            }
            if (e + eBias >= 1) {
              value += rt / c;
            } else {
              value += rt * Math.pow(2, 1 - eBias);
            }
            if (value * c >= 2) {
              e++;
              c /= 2;
            }

            if (e + eBias >= eMax) {
              m = 0;
              e = eMax;
            } else if (e + eBias >= 1) {
              m = (value * c - 1) * Math.pow(2, mLen);
              e = e + eBias;
            } else {
              m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
              e = 0;
            }
          }

          for (
            ;
            mLen >= 8;
            buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8
          ) {}

          e = (e << mLen) | m;
          eLen += mLen;
          for (
            ;
            eLen > 0;
            buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8
          ) {}

          buffer[offset + i - d] |= s * 128;
        };
      },
      {},
    ],
  },
  {},
  [49]
);
