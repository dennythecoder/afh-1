/**
 * 
 * Attempting to mitigate unresponsive UI by using a Web Worker
 * 
 */

function slowlyParseJSONArray(json) {
  let jsonArr = json.replace(/\[|\]/g, "").split("},");
  jsonArr.forEach(function(jsonItem) {
    try {
      postMessage(JSON.parse(jsonItem + "}"));
    } catch (e) {
      return "";
    }
  });
}

function parseJSON(json) {
  slowlyParseJSONArray(json);
}

self.addEventListener(
  "message",
  function(e) {
    parseJSON(e.data);
  },
  false
);
