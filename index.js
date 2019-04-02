var MAX_WAITING_PATIENTS = 6;
var footerTitleMissedTurn = 'KHÁCH HÀNG GỌI NHỠ';
var call = 'gọi';
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

setInterval(function () {
	document.getElementsByClassName('current-time')[0].innerHTML = moment().format('HH:mm:ss');
}, 1000);

setInterval(function () {
	httpGet('api/integration/rank', function (response) {
		response.forEach(function (newRanking) {
			var room = newRanking.room;
			var departmentId = newRanking.departmentId;

			if ([state.query.firstRoom, state.query.secondRoom].includes(departmentId)) {
				state['room'] = removeSpaceFromString(room);
				state['departmentId'] = departmentId;

				setMissedTurnData(newRanking);
				setInTreatmentData(newRanking);
				setWaitingListData(newRanking);
				updateUI(room, departmentId);
			}
		});
	});
}, 5000);

if (!state.query.secondRoom) {
	hideElement('patients-name-and-rank-section-right');
	hideElement('patients-name-and-rank-sections-separator');
	document.getElementById('patients-name-and-rank-section-left').classList.add('one-room-layout');
}

// HELPER METHODS

function updateUI(room, departmentId) {
	var idPrefix;
	var inTreatmentKey;

	if (isDataForFirstRoom(state.query, departmentId)) {
		idPrefix = 'first-';
		inTreatmentKey = 'firstRoom';
	} else {
		idPrefix = 'second-';
		inTreatmentKey = 'secondRoom';
	}

	updateInTreatment(room, idPrefix, inTreatmentKey);
	updateWaitingList();
	updateMissedTurnList();
}

function updateInTreatment(room, idPrefix, inTreatmentKey) {
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

function updateWaitingList() {
	removeAllChildNodes('left-waiting-list-sub-section');
	removeAllChildNodes('right-waiting-list-sub-section');

	var leftWaitingListEl = document.getElementById('left-waiting-list');
	var leftWaitingListSubSectionEl = document.getElementById('left-waiting-list-sub-section');
	var rightWaitingListSubSectionEl = document.getElementById('right-waiting-list-sub-section');
	var firstRoomWaitingList = state.waitingList.firstRoom;
	var secondRoomWaitingList = state.waitingList.secondRoom;
	var listToDisplay = _.isEmpty(state.room)
		? []
		: isDataForFirstRoom(state.query, state.departmentId)
			? getDisplayWaitingList(firstRoomWaitingList, secondRoomWaitingList)
			: getDisplayWaitingList(secondRoomWaitingList, firstRoomWaitingList);
	var firstSubList = _.chunk(listToDisplay, 3)[0];
	var secondSubList = _.chunk(listToDisplay, 3)[1];

	if (!_.isEmpty(firstSubList)) {
		if (listToDisplay.length <= 3) {
			leftWaitingListEl.classList.add('align-center');
		} else {
			leftWaitingListEl.classList.remove('align-center');
		}
		firstSubList.forEach(function (item) {
			var listItemEl = document.createElement('p');
			var listItemTextEl = document.createTextNode(item.rank + '. ' + item.patient);

			listItemEl.appendChild(listItemTextEl);
			leftWaitingListSubSectionEl.appendChild(listItemEl);
		});
	}
	if (!_.isEmpty(secondSubList)) {
		secondSubList.forEach(function (item) {
			var listItemEl = document.createElement('p');
			var listItemTextEl = document.createTextNode(item.rank + '. ' + item.patient);

			listItemEl.appendChild(listItemTextEl);
			rightWaitingListSubSectionEl.appendChild(listItemEl);
		});
	}
}

function updateMissedTurnList() {
	removeAllChildNodes('first-missed-turn');
	removeAllChildNodes('second-missed-turn');

	var firstRoom = state.inTreatment.firstRoom;
	var secondRoom = state.inTreatment.secondRoom;
	var firstMissedTurnRoom = state.missedTurn.firstRoom;
	var secondMissedTurnRoom = state.missedTurn.secondRoom;
	var footerTitleEl = document.getElementById('footer-title');
	var firstMissedTurnEl = document.getElementById('first-missed-turn');
	var secondMissedTurnEl = document.getElementById('second-missed-turn');

	if (!_.isEmpty(firstMissedTurnRoom) || !_.isEmpty(secondMissedTurnRoom)) {
		footerTitleEl.innerText = footerTitleMissedTurn;
	}
	createMissedTurnChildElements(firstMissedTurnEl, firstMissedTurnRoom, firstRoom);
	createMissedTurnChildElements(secondMissedTurnEl, secondMissedTurnRoom, secondRoom);
}

function createMissedTurnChildElements(missedTurnedEl, missedTurnList, room) {
	if (!_.isEmpty(missedTurnList) && room) {
		missedTurnList.forEach(function (item) {
			var roomNameSpan = document.createElement('span');
			var patientNumberSpan = document.createElement('span');
			var patientNameSpan = document.createElement('span');

			missedTurnedEl.appendChild(document.createTextNode('  -  '));
			roomNameSpan.classList.add('room-name-in-footer');
			roomNameSpan.innerText = room.roomName;
			missedTurnedEl.appendChild(roomNameSpan);
			missedTurnedEl.appendChild(document.createTextNode(' ' + call + ' '));
			patientNumberSpan.classList.add('patient-number-in-footer');
			patientNumberSpan.innerText = item.rank;
			missedTurnedEl.appendChild(patientNumberSpan);
			missedTurnedEl.appendChild(document.createTextNode('. '));
			patientNameSpan.classList.add('patient-name-in-footer');
			patientNameSpan.innerText = item.patient;
			missedTurnedEl.appendChild(patientNameSpan);
		});
	}
}

function isDataForFirstRoom(query, departmentId) {
	return query.firstRoom === departmentId;
}

function isOneRoomLayout(secondRoomFromQuery) {
	return typeof secondRoomFromQuery === 'undefined';
}

function setMissedTurnData(newRanking) {
	var newMissedTurn = newRanking.missedTurn;
	var storingMissedTurn = Object.assign({}, state.missedTurn);

	if (isDataForFirstRoom(state.query, newRanking.departmentId)) {
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
