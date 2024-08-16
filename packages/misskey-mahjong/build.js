import { build } from "esbuild";
import { globSync } from "glob";

const entryPoints = globSync("./src/**/**.{ts,tsx}");

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints,
  minify: true,
  outdir: "./built/esm",
  target: "es2022",
  platform: "browser",
  format: "esm",
};

if (process.env.WATCH === "true") {
  options.watch = {
    onRebuild(error, result) {
      if (error) {
        console.error("watch build failed:", error);
      } else {
        console.log("watch build succeeded:", result);
      }
    },
  };
}

build(options).catch((err) => {
  process.stderr.write(err.stderr);
  process.exit(1);
});
