function removeSpaceFromString(string) {
	var split = string.split(' ');
	return split.join('');
}

function hideElement(targetId) {
	if (isElementHidden(targetId)) return;

	var element = document.getElementById(targetId);
	var currentClasses = element.getAttribute('class');

	element.removeAttribute('class');
	element.setAttribute('class', currentClasses + ' ' + 'hide');
}

function unhideElement(targetId) {
	if (!isElementHidden(targetId)) return;

	var element = document.getElementById(targetId);
	var currentClasses = element.getAttribute('class');

	element.removeAttribute('class');
	element.setAttribute('class', currentClasses.replace(' hide', '').replace('hide', ''));
}

function isElementHidden(targetId) {
	var element = document.getElementById(targetId);
	var classes = element.getAttribute('class');

	if (!classes) return;

	var classesArray = classes.split(' ');
	var result = false;

	for (var i = 0; i < classesArray.length; i++) {
		if (classesArray[i] === 'hide') {
			return true;
		}
	}
	return result;
}

function getUrlParameter(name) {
	name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
	var regex = new RegExp('[\\?$]' + name + '=([^$#]*)');
	var results = regex.exec(location.search);
	return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function removeAllChildNodes(parentId) {
	var parentNode = document.getElementById(parentId);

	if (!parentNode) return;
	while (parentNode.firstChild) {
		parentNode.removeChild(parentNode.firstChild);
	}
}
