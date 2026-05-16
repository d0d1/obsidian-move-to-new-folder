import esbuild from "esbuild";
import { builtinModules } from "node:module";
import process from "process";

const prod = process.argv[2] === "production";
const builtinExternals = Array.from(
  new Set(
    builtinModules.flatMap((moduleName) => {
      const bareModuleName = moduleName.replace(/^node:/, "");
      return [bareModuleName, `node:${bareModuleName}`];
    }),
  ),
);

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtinExternals,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
});

if (prod) {
  await context.rebuild();
  await context.dispose();
  process.exit(0);
}

await context.watch();
