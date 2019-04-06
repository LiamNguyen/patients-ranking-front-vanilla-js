function httpAuthorizedGet(urlPath, callback) {
	httpGetTextFile(integrationKeyFilePath, function(token) {
		var http = new XMLHttpRequest();
		var url = window.API_URL + urlPath + '&token=' + token;

		http.open('GET', url);
		http.send();
		http.onreadystatechange = function () {
			if (this.readyState === 4 && this.status === 200) {
				callback(JSON.parse(http.responseText));
			}
		};
	});
}

function httpGetTextFile(urlPath, callback) {
	var http = new XMLHttpRequest();
	var url = window.APP_HOST + urlPath;

	http.open('GET', url);
	http.send();
	http.onreadystatechange = function () {
		if (this.readyState === 4) {
			callback(http.responseText);
		}
	};
}
