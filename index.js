var socket = io('http://localhost:5000');
var state = {
	query: {
		firstRoom: getUrlParameter('firstRoom'),
		secondRoom: getUrlParameter('secondRoom')
	},
	room: '',
	inTreatment: {},
	missedTurn: { firstRoom: [], secondRoom: [] },
	waitingList: { firstRoom: [], secondRoom: [] }
};

setInterval(function () {
	document.getElementsByClassName('current-time')[0].innerHTML = moment().format('HH:mm:ss');
}, 1000);

socket.on('refresh-ranking-display', function (newRanking) {
	var room = newRanking.room;
	var spaceRemovedRoom = removeSpaceFromString(room);

	if ([state.query.firstRoom, state.query.secondRoom].includes(spaceRemovedRoom)) {
		state['room'] = spaceRemovedRoom;

		setMissedTurnData(newRanking);
		setInTreatmentData(newRanking);
		setWaitingListData(newRanking);
		updateUI(newRanking.room);
	}
	// this.storeCurrentRankingState();
});

if (!state.query.secondRoom) {
	hideElement('patients-name-and-rank-section-right');
	hideElement('patients-name-and-rank-sections-separator');
	addClassNames('patients-name-and-rank-section-left', 'one-room-layout');
}

// HELPER METHODS

function updateUI(room) {
	var idPrefix;
	var inTreatmentKey;

	if (isDataForFirstRoom(state.query, room)) {
		idPrefix = 'first-';
		inTreatmentKey = 'firstRoom';
	} else {
		idPrefix = 'second-';
		inTreatmentKey = 'secondRoom';
	}
	var inTreatment = state.inTreatment[inTreatmentKey];
	var roomNameEl = document.getElementById(idPrefix + 'room-name');
	var newRoomNameEl = document.getElementById(idPrefix + 'new-room-name');
	var patientNameEl = document.getElementById(idPrefix + 'patient-name');
	var patientNumberEl = document.getElementById(idPrefix + 'patient-number');
	var newRankEl = document.getElementById(idPrefix + 'new-rank');

	roomNameEl.innerText = inTreatment.roomName;
	patientNameEl.innerText = inTreatment.patient;
	patientNumberEl.innerText = inTreatment.rank;

	if (inTreatment.oldRoom) {
		unhideElement(idPrefix + 'change-room-icon');
		unhideElement(idPrefix + 'new-room-name');
		unhideElement(idPrefix + 'change-rank-icon');
		unhideElement(idPrefix + 'new-rank');
		newRoomNameEl.innerText = inTreatment.roomName;
		roomNameEl.innerText = inTreatment.oldRoom;
		patientNumberEl.innerText = inTreatment.oldRank;
		newRankEl.innerText = inTreatment.rank;
	}
}

function hideElement(targetId) {
	var element = document.getElementById(targetId);
	var currentClasses = element.getAttribute('class');

	element.removeAttribute('class');
	element.setAttribute('class', currentClasses + ' ' + 'hide');
}

function unhideElement(targetId) {
	var element = document.getElementById(targetId);
	var currentClasses = element.getAttribute('class');

	element.removeAttribute('class');
	element.setAttribute('class', currentClasses.replace('hide', ''));
}

function addClassNames(targetId, classNames) {
	var element = document.getElementById(targetId);
	var currentClassNames = element.className;

	element.removeAttribute('class');
	element.setAttribute('class', currentClassNames + ' ' + classNames);
}

function getUrlParameter(name) {
	name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
	var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
	var results = regex.exec(location.search);
	return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function removeSpaceFromString(string) {
	var split = string.split(' ');
	return split.join('');
}

function isDataForFirstRoom(query, room) {
	return query.firstRoom === removeSpaceFromString(room);
}

function setMissedTurnData(newRanking) {
	var room = newRanking.room;
	var newMissedTurn = newRanking.missedTurn;
	var storingMissedTurn = Object.assign({}, state.missedTurn);

	if (isDataForFirstRoom(state.query, room)) {
		storingMissedTurn['firstRoom'] = newMissedTurn || [];
	} else {
		storingMissedTurn['secondRoom'] = newMissedTurn || [];
	}
	state['missedTurn'] = storingMissedTurn;
}

function setInTreatmentData(newRanking) {
	var room = newRanking.room;
	var newInTreatment = newRanking.inTreatment;
	var storingInTreatment = Object.assign({}, state.inTreatment);

	newInTreatment['roomName'] = room;
	if (isDataForFirstRoom(state.query, room)) {
		storingInTreatment['firstRoom'] = newInTreatment;
	} else {
		storingInTreatment['secondRoom'] = newInTreatment;
	}
	state['inTreatment'] = storingInTreatment;
}

function setWaitingListData(newRanking) {
	var room = newRanking.room;
	var newWaitingList = newRanking.waitingList;
	var sortedNewWaitingList = _.sortBy(newWaitingList, 'rank');
	var storingWaitingList = Object.assign({}, state.waitingList);

	if (isDataForFirstRoom(state.query, room)) {
		storingWaitingList['firstRoom'] = sortedNewWaitingList;
	} else {
		storingWaitingList['secondRoom'] = sortedNewWaitingList;
	}
	state['waitingList'] = storingWaitingList;
}
