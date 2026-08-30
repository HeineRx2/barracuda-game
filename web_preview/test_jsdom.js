const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => {
  console.error("JSDOM Error:", err);
});
virtualConsole.on("log", (msg) => {
  console.log("JSDOM Log:", msg);
});
virtualConsole.on("jsdomError", (err) => {
  console.error("JSDOM Execution Error:", err);
});

const dom = new JSDOM(html, {
  url: "http://localhost:8088/index.html",
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
});

setTimeout(() => {
  console.log("Finished running JSDOM.");
}, 3000);
