console.log('inject', chrome);

// initialize script
chrome.runtime.sendMessage({type: 'init'});