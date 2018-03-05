/**
 *
 * Attempting to mitigate unresponsive UI by using a Web Worker
 *
 */

function slowlyParseJSONArray(json) {
  const jsonArr = json.replace(/\[|\]/g, '').split('},');
  jsonArr.forEach((jsonItem) => {
    try {
      postMessage(JSON.parse(`${jsonItem}}`));
    } catch (e) {
      return '';
    }
  });
}

function parseJSON(json) {
  slowlyParseJSONArray(json);
}

self.addEventListener(
  'message',
  (e) => {
    parseJSON(e.data);
  },
  false,
);
