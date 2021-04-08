const Axios = require('axios');
const JWTDecode = require('jwt-decode').default;

const BoteAPI = Axios.create({
	baseURL: 'https://hakuna.bote.my.id'
});

const HakunaAPI = Axios.create({
	baseURL: 'https://api.hakuna.live'
});

var PassLoginHints = new Array();
var TabListeners = new Array();

var getURLParams = (search_string) => {
	if (search_string !== undefined) {
		var parse = function(params, pairs) {
			var pair = pairs[0];
			var parts = pair.split('=');
			var key = decodeURIComponent(parts[0]);
			var value = decodeURIComponent(parts.slice(1).join('='));

			if (typeof params[key] === 'undefined') {
				params[key] = value;
			} else {
				params[key] = [].concat(params[key], value);
			}

			return pairs.length == 1 ? params : parse(params, pairs.slice(1));
		}

		return search_string.length == 0 ? {} : parse({}, search_string.substr(1).split('&'));
	}
}

var catchOauthGoogle = (tabId) => {
	if (TabListeners.indexOf(tabId) == -1) {
		chrome.tabs.get(tabId, tabInfo => {
			if (tabInfo.url.match(/.*hakuna\.live/)) {
				TabListeners.push(tabInfo.id);
				chrome.webRequest.onBeforeRequest.addListener(function(details) {
					if (details.url !== undefined) {
						if (details.url.match(/oauth2\/iframerpc\?action=issueToken/)) {
							chrome.cookies.getAll({}, cookies => {
								var url = new URL(details.url);
								var url_parameters = getURLParams(url.search);;
								var set_cookie = '__Secure-3PSID='+cookies[arrayObjectFindValue(cookies, 'name', '__Secure-3PSID')].value+';__Host-3PLSID='+cookies[arrayObjectFindValue(cookies, 'name', '__Host-3PLSID')].value+';';
								if (PassLoginHints.indexOf(url_parameters.login_hint) == -1) {
									PassLoginHints.push(url_parameters.login_hint);
									Axios.defaults.withCredentials = true;
									Axios.get('https://accounts.google.com/o/oauth2/iframerpc', {
										credentials: 'same-origin',
										params: {
											'action':'issueToken',
											'response_type':'token id_token',
											'login_hint': url_parameters.login_hint,
											'client_id': url_parameters.client_id,
											'origin':'https://hakuna.live',
											'scope':'openid profile email',
											'ss_domain':'https://hakuna.live'
										},
										headers: {
											'x-requested-with': 'XmlHttpRequest',
											'cookie': set_cookie
										}
									}).then(response => {
										var decoded_google_token = JWTDecode(response.data.id_token);
										HakunaAPI.post('login/google', {
											accessToken: response.data.id_token,
											googleId: decoded_google_token.sub,
											timeZoneId: 'Asia/Jakarta'
										}, {
											headers: {
												authorization: 'Bearer '+response.data.id_token
											}
										}).then(oauth_google => {
											if (oauth_google.status == 400) {
												// do registration
											} else {
												submitAccount(response.data.login_hint, set_cookie);
											}
										});
									}).catch(console.log);
								}
							});
						}
					}
				},
				{
					urls: ["<all_urls>"]
				},
				["requestBody"]);
			}
		});
	}
}

var submitAccount = (login_hint, set_cookie) => {
}

var arrayObjectFindValue = (arrayName, searchKey, searchValue) => {
	let find = arrayName.findIndex(i => i[searchKey] == searchValue);
	return (find !== -1)?find:false;
}

chrome.runtime.onInstalled.addListener(function() {
	// Check for first installation
	if (localStorage.getItem('plugged') == null) {
		// do on first installation
	}

	// Listen message event from injector.js
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (sender.id == chrome.runtime.id) {
			switch (request.type) {
				case 'init':
					catchOauthGoogle(sender.tab.id, sendResponse);
					sendResponse({status: 'ok'});
				break;

				default:
				break;
			}
		}
	});

	chrome.tabs.onActivated.addListener(tab => catchOauthGoogle(tab.tabId));
});