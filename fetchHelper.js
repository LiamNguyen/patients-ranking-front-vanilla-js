function httpGet(urlPath, callback) {
	var http = new XMLHttpRequest();
	var url = window.API_URL + '/' + urlPath;

	http.open('GET', url);
	http.send();
	http.onreadystatechange = function () {
		if (this.readyState === 4 && this.status === 200) {
			callback(JSON.parse(http.responseText));
		}
	};
}
