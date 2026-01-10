const url = 'http://190.61.110.177:2728/stream.m3u8';

// Old Regex Logic (Simulated)
function oldConvert(url) {
    let result = url;
    if (result.includes('190.61.110.177')) {
        result = result.replace(/https?:\/\/190\.61\.110\.177/, 'http://127.0.0.1:81');
    }
    return result;
}

// New URL Logic
function newConvert(url) {
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname;

      if (host === '190.61.110.177') {
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
    return url;
}

console.log('Original:', url);
console.log('Old Regex Result:', oldConvert(url));
console.log('New Logic Result:', newConvert(url));
