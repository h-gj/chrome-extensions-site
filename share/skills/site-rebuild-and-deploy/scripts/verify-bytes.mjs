#!/usr/bin/env node
/**
 * verify-bytes.mjs — 逐文件 sha256 比对两个目录（字节保真的唯一裁判）
 *
 * 用法：
 *   node verify-bytes.mjs --ref <参照目录> --check <待查目录> [--only a,b] [--quiet]
 *
 * 用途：
 *   1) 发布树生成后：--ref <复刻产物> --check deploy
 *   2) 全新 clone 后：--ref <复刻产物> --check <clone 目录>   ← 证明 git 没改字节
 *
 * 退出码：0 = 全部一致；1 = 有差异/缺失/多余；2 = 参数错误
 *
 * 注意：本脚本只比 sha256，不看 mtime——所以「用 git 检出后复算」才能抓到 EOL 转换问题。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const argv = process.argv.slice(2);
function flag(n) { return argv.includes("--" + n); }
function arg(n, d = undefined) {
  const i = argv.indexOf("--" + n);
  if (i === -1) return d;
  const v = argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}

const ref = arg("ref");
const check = arg("check");
const only = arg("only");
const quiet = flag("quiet");

if (!ref || !check) {
  console.error("用法: node verify-bytes.mjs --ref <参照目录> --check <待查目录> [--only a,b] [--quiet]");
  process.exit(2);
}
for (const [label, p] of [["--ref", ref], ["--check", check]]) {
  if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) {
    console.error(`FATAL: ${label} 不是目录: ${p}`);
    process.exit(2);
  }
}

const SKIP_DIRS = new Set([".git", "node_modules", ".github"]);

function walk(dir, base = dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, base, acc);
    else if (e.isFile()) acc.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return acc;
}
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

let refFiles = walk(ref).sort();
const checkFiles = walk(check).sort();

// 发布树会额外带 CNAME / .nojekyll / .gitattributes / README.md —— 默认忽略这些 meta 文件
const META = new Set(["CNAME", ".nojekyll", ".gitattributes", "README.md"]);
if (only && only !== true) {
  const keep = new Set(String(only).split(",").map((s) => s.trim()));
  refFiles = refFiles.filter((f) => keep.has(f));
}

const refSet = new Set(refFiles);
const checkSet = new Set(checkFiles);

let ok = 0;
const mismatched = [];
const missing = [];
for (const f of refFiles) {
  if (!checkSet.has(f)) { missing.push(f); continue; }
  const a = sha256(path.join(ref, f));
  const b = sha256(path.join(check, f));
  if (a === b) ok++;
  else mismatched.push({ f, ref: a, check: b, size: [fs.statSync(path.join(ref, f)).size, fs.statSync(path.join(check, f)).size] });
}
const extra = checkFiles.filter((f) => !refSet.has(f) && !META.has(f));

if (!quiet) {
  for (const f of refFiles) {
    const bad = mismatched.find((m) => m.f === f);
    const miss = missing.includes(f);
    const tag = bad ? "MISMATCH" : miss ? "MISSING " : "ok      ";
    if (bad) {
      console.log(`  ${tag}  ${f}   ref=${bad.ref.slice(0, 12)} check=${bad.check.slice(0, 12)}  size ${bad.size[0]}→${bad.size[1]}`);
    } else if (!quiet) {
      console.log(`  ${tag}  ${f}`);
    }
  }
}

console.log("");
console.log(`参照: ${ref}  (${refFiles.length} 文件)`);
console.log(`待查: ${check} (${checkFiles.length} 文件)`);
console.log(`一致 ${ok}/${refFiles.length}` + (mismatched.length ? `  差异 ${mismatched.length}` : "") + (missing.length ? `  缺失 ${missing.length}` : "") + (extra.length ? `  多余 ${extra.length}` : ""));
if (extra.length) {
  console.log(`多余文件（不在参照里，通常可接受）: ${extra.slice(0, 10).join(", ")}${extra.length > 10 ? " …" : ""}`);
}

const bad = mismatched.length + missing.length;
if (bad) {
  console.error(`\n✗ 字节保真失败：${bad} 个文件不一致或缺失`);
  if (mismatched.length) {
    console.error(`  提示：若差异普遍存在且大小变了（如 +N 字节），基本可判定是 git 的 LF→CRLF 转换 —— 检查 .gitattributes 是否有 '* -text'。`);
  }
  process.exit(1);
}
console.log(`\n✓ 字节保真通过：${ok} 个文件 sha256 全部一致（meta 文件除外）`);
