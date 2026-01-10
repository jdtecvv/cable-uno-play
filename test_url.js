const url = 'http://190.61.110.177:2728/CABLEUNO.m3u8';
const url2 = 'http://190.61.110.177/CABLEUNO.m3u8';

function convert(inputUrl) {
    try {
      const urlObj = new URL(inputUrl);
      const host = urlObj.hostname;

      const isXUIUrl = host === 'app.teleunotv.cr' || host === '190.61.110.177';

      if (isXUIUrl) {
        urlObj.protocol = 'http:';
        urlObj.hostname = '127.0.0.1';

        if (!urlObj.port) {
          urlObj.port = '81';
        }

        return urlObj.toString();
      }
    } catch (e) {
      return e.message;
    }
    return inputUrl;
}

console.log('Input 1:', url);
console.log('Output 1:', convert(url));
console.log('Input 2:', url2);
console.log('Output 2:', convert(url2));
