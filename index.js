var MAX_WAITING_PATIENTS = 6;
var footerTitleMissedTurn = 'GỌI NHỠ ';
var fetchRankDataIntervalInSeconds = 10000;
var fetchMissedTurnIntervalInSeconds = 10000;
var state = {
	query: {
		firstRoom: getUrlParameter('dept_id1'),
		secondRoom: getUrlParameter('dept_id2')
	},
	room: '',
	departmentId: '',
	inTreatment: {},
	missedTurn: { firstRoom: [], secondRoom: [] },
	waitingList: { firstRoom: [], secondRoom: [] }
};

function bodyOnClick() {
	$('body').fullscreen();
}

setInterval(function () {
	document.getElementsByClassName('current-time')[0].innerHTML = moment().format('HH:mm:ss');
}, 1000);

fetchRankData();

setInterval(function () {
	fetchRankData();
}, fetchRankDataIntervalInSeconds);

if (!state.query.secondRoom) {
	hideElement('patients-name-and-rank-section-right');
	hideElement('patients-name-and-rank-sections-separator');
	document.getElementById('patients-name-and-rank-section-left').classList.add('one-room-layout');
}

// HELPER METHODS

function fetchRankData() {
	var http = new XMLHttpRequest();
	var url = window.API_URL + getRankDataUrl + buildQueryParams() + '&token=B131DCA0-69E6-425D-BEC0-8BE8094EBD14';

	http.open('GET', url);
	http.send();
	http.onreadystatechange = function () {
		if (this.readyState === 4 && this.status === 200) {
			var response = JSON.parse(http.responseText);

			for(var i = 0; i < response.length; i++) {
				var newRanking = response[i];
				var room = newRanking.room;
				var departmentId = newRanking.departmentId;

				if (state.query.firstRoom === departmentId || state.query.secondRoom === departmentId) {
					state['room'] = removeSpaceFromString(room);
					state['departmentId'] = departmentId;

					setInTreatmentData(newRanking);
					setWaitingListData(newRanking);
					updateUI(departmentId);
					fetchMissedTurn();
				}
			}
		}
	};
}

function fetchMissedTurn() {
	var http = new XMLHttpRequest();
	var url = window.API_URL + getMissedTurnUrl + buildQueryParams() + '&token=B131DCA0-69E6-425D-BEC0-8BE8094EBD14';

	http.open('GET', url);
	http.send();
	http.onreadystatechange = function () {
		if (this.readyState === 4 && this.status === 200) {
			var response = JSON.parse(http.responseText);

			for(var i = 0; i < response.length; i++) {
				var newRanking = response[i];
				var room = newRanking.room;
				var departmentId = newRanking.departmentId;

				if ([state.query.firstRoom, state.query.secondRoom].includes(departmentId)) {
					state['room'] = removeSpaceFromString(room);
					state['departmentId'] = departmentId;

					setMissedTurnData(newRanking);
					updateMissedTurnList();
				}
			}
		}
	};
}

function buildQueryParams() {
	var firstDepartmentId = state.query.firstRoom;
	var secondDepartmentId = state.query.secondRoom;

	if (isOneRoomLayout(secondDepartmentId)) {
		return '?dept_id1=' + firstDepartmentId;
	} else {
		return '?dept_id1=' + firstDepartmentId + '&dept_id2=' + secondDepartmentId;
	}
}

function updateUI(departmentId) {
	var idPrefix;
	var inTreatmentKey;

	if (isDataForFirstRoom(state.query, departmentId)) {
		idPrefix = 'first-';
		inTreatmentKey = 'firstRoom';
	} else {
		idPrefix = 'second-';
		inTreatmentKey = 'secondRoom';
	}

	updateInTreatment(idPrefix, inTreatmentKey);
	updateWaitingList();
}

function updateInTreatment(idPrefix, inTreatmentKey) {
	var inTreatment = state.inTreatment[inTreatmentKey];
	var roomNameEl = document.getElementById(idPrefix + 'room-name');
	var newRoomNameEl = document.getElementById(idPrefix + 'new-room-name');
	var patientNameEl = document.getElementById(idPrefix + 'patient-name');
	var patientNumberEl = document.getElementById(idPrefix + 'patient-number');

	roomNameEl.innerText = inTreatment.roomName;
	patientNameEl.innerText = inTreatment.patient;
	patientNumberEl.innerText = inTreatment.rank;

	if ((inTreatment.oldRoom !== null &&
		inTreatment.oldRank !== null &&
		inTreatment.oldRoom !== '' &&
		inTreatment.oldRank !== '')) {
		unhideElement(idPrefix + 'change-room-icon');
		unhideElement(idPrefix + 'new-room-name');
		newRoomNameEl.innerText = inTreatment.roomName;
		roomNameEl.innerText = inTreatment.oldRoom;
		patientNumberEl.innerText = inTreatment.rank;
	} else {
		hideElement(idPrefix + 'change-room-icon');
		hideElement(idPrefix + 'new-room-name');
	}
}

function updateWaitingList() {
	removeAllChildNodes('left-waiting-list-sub-section');
	removeAllChildNodes('right-waiting-list-sub-section');

	var leftWaitingListSubSectionEl = document.getElementById('left-waiting-list-sub-section');
	var rightWaitingListSubSectionEl = document.getElementById('right-waiting-list-sub-section');
	var firstRoomWaitingList = state.waitingList.firstRoom;
	var secondRoomWaitingList = state.waitingList.secondRoom;
	// var listToDisplay = _.isEmpty(state.room)
	// 	? []
	// 	: isDataForFirstRoom(state.query, state.departmentId)
	// 		? getDisplayWaitingList(firstRoomWaitingList, secondRoomWaitingList)
	// 		: getDisplayWaitingList(secondRoomWaitingList, firstRoomWaitingList);
	// var firstSubList = _.chunk(listToDisplay, 3)[0];
	// var secondSubList = _.chunk(listToDisplay, 3)[1];

	if (isOneRoomLayout(state.query.secondRoom)) {
		hideElement('right-line-break');
		hideElement('waiting-list-sections-separator');
		hideElement('right-waiting-list');
	} else {
		unhideElement('right-line-break');
		unhideElement('waiting-list-sections-separator');
		unhideElement('right-waiting-list');
	}
	if (!_.isEmpty(firstRoomWaitingList)) {
		firstRoomWaitingList.forEach(function (item) {
			var listItemEl = renderWaitingListItem(item);
			leftWaitingListSubSectionEl.appendChild(listItemEl);
		});
	}
	if (!_.isEmpty(secondRoomWaitingList)) {
		secondRoomWaitingList.forEach(function (item) {
			var listItemEl = renderWaitingListItem(item);
			rightWaitingListSubSectionEl.appendChild(listItemEl);
		});
	}
}

function renderWaitingListItem(item) {
	var listItemEl = document.createElement('p');
	var listItemTextEl = document.createTextNode(item.rank + '. ');
	var patientNameEl = document.createElement('b');

	patientNameEl.innerHTML = item.patient;
	listItemEl.appendChild(listItemTextEl);
	listItemEl.appendChild(patientNameEl);

	return listItemEl;
}

function updateMissedTurnList() {
	if (isOneRoomLayout(state.query.secondRoom)) {
		hideElement('footer-right-line-break');
		hideElement('second-missed-turn');
	} else {
		unhideElement('footer-right-line-break');
		unhideElement('second-missed-turn');
	}

	removeAllChildNodes('first-missed-turn');
	removeAllChildNodes('second-missed-turn');

	var firstRoom = state.inTreatment.firstRoom;
	var secondRoom = state.inTreatment.secondRoom;
	var firstMissedTurnRoom = state.missedTurn.firstRoom;
	var secondMissedTurnRoom = state.missedTurn.secondRoom;
	var firstMissedTurnEl = document.getElementById('first-missed-turn');
	var secondMissedTurnEl = document.getElementById('second-missed-turn');
	var isSecondRoom = true;

	createMissedTurnChildElements(firstMissedTurnEl, firstMissedTurnRoom, firstRoom, !isSecondRoom);
	createMissedTurnChildElements(secondMissedTurnEl, secondMissedTurnRoom, secondRoom, isSecondRoom);
}

function createMissedTurnChildElements(missedTurnedEl, missedTurnList, room, isSecondRoom) {
	if (!_.isEmpty(missedTurnList) && room) {
		var roomNameSpan = document.createElement('span');

		roomNameSpan.classList.add('room-name-in-footer');
		roomNameSpan.innerText = footerTitleMissedTurn + ' ' + room.roomName + ': ';
		missedTurnedEl.appendChild(roomNameSpan);

		for(var i = 0; i < missedTurnList.length; i++) {
			var item = missedTurnList[i];
			var patientNumberSpan = document.createElement('span');

			if (isSecondRoom) {
				patientNumberSpan.classList.add('second-room');
			}
			patientNumberSpan.classList.add('patient-number-in-footer');
			patientNumberSpan.innerText = item.rank;
			missedTurnedEl.appendChild(patientNumberSpan);

			if (i < missedTurnList.length - 1) {
				missedTurnedEl.appendChild(document.createTextNode(', '));
			}
		}
	}
}

function isDataForFirstRoom(query, departmentId) {
	return query.firstRoom === departmentId;
}

function isOneRoomLayout(secondRoomFromQuery) {
	return typeof secondRoomFromQuery === 'undefined' || secondRoomFromQuery === '';
}

function setMissedTurnData(newRanking) {
	var newMissedTurn = newRanking.missedTurn;
	var storingMissedTurn = Object.assign({}, state.missedTurn);

	if (isDataForFirstRoom(state.query, newRanking.departmentId)) {
		if (newMissedTurn) {
			storingMissedTurn['firstRoom'] = newMissedTurn;
		} else {
			storingMissedTurn['firstRoom'] = [];
		}
	} else {
		if (newMissedTurn) {
			storingMissedTurn['secondRoom'] = newMissedTurn;
		} else {
			storingMissedTurn['secondRoom'] = [];
		}
	}
	state['missedTurn'] = storingMissedTurn;
}

function setInTreatmentData(newRanking) {
	var room = newRanking.room;
	var newInTreatment = newRanking.inTreatment;
	var storingInTreatment = Object.assign({}, state.inTreatment);

	newInTreatment['roomName'] = room;
	if (isDataForFirstRoom(state.query, newRanking.departmentId)) {
		storingInTreatment['firstRoom'] = newInTreatment;
	} else {
		storingInTreatment['secondRoom'] = newInTreatment;
	}
	state['inTreatment'] = storingInTreatment;
}

function setWaitingListData(newRanking) {
	var newWaitingList = newRanking.waitingList;
	var sortedNewWaitingList = _.sortBy(newWaitingList, 'rank');
	var storingWaitingList = Object.assign({}, state.waitingList);

	if (isDataForFirstRoom(state.query, newRanking.departmentId)) {
		storingWaitingList['firstRoom'] = sortedNewWaitingList;
	} else {
		storingWaitingList['secondRoom'] = sortedNewWaitingList;
	}
	state['waitingList'] = storingWaitingList;
}

function getDisplayWaitingList(currentRoom, theOtherRoom) {
	if (isOneRoomLayout(state.query.secondRoom)) return currentRoom;
	if (_.isEmpty(currentRoom)) return theOtherRoom;

	var currentRoomToDisplay;

	if (theOtherRoom.length > 3) {
		currentRoomToDisplay = _.chunk(currentRoom, 3)[0];
		var theOtherRoomToDisplay = _.chunk(
			theOtherRoom,
			MAX_WAITING_PATIENTS - currentRoomToDisplay.length
		)[0];

		return _.sortBy(
			_.concat(currentRoomToDisplay, theOtherRoomToDisplay),
			'rank'
		);
	} else {
		currentRoomToDisplay = _.chunk(
			currentRoom,
			MAX_WAITING_PATIENTS - theOtherRoom.length
		)[0];

		return _.sortBy(_.concat(currentRoomToDisplay, theOtherRoom), 'rank');
	}
}
