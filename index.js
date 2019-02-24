var MAX_WAITING_PATIENTS = 6;
var socket = io(window.API_URL);
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
		updateUI(room);
	}
	// this.storeCurrentRankingState();
});

if (!state.query.secondRoom) {
	hideElement('patients-name-and-rank-section-right');
	hideElement('patients-name-and-rank-sections-separator');
	document.getElementById('patients-name-and-rank-section-left').classList.add('one-room-layout');
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

	// Update waiting list
	remoteAllChildNodes('left-waiting-list-sub-section');
	remoteAllChildNodes('right-waiting-list-sub-section');
	var leftWaitingListEl = document.getElementById('left-waiting-list');
	var leftWaitingListSubSectionEl = document.getElementById('left-waiting-list-sub-section');
	var rightWaitingListSubSectionEl = document.getElementById('right-waiting-list-sub-section');
	var firstRoomWaitingList = state.waitingList.firstRoom;
	var secondRoomWaitingList = state.waitingList.secondRoom;
	var listToDisplay = _.isEmpty(state.room)
		? []
		: isDataForFirstRoom(state.query, state.room)
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

function isDataForFirstRoom(query, room) {
	return query.firstRoom === removeSpaceFromString(room);
}

function isOneRoomLayout(secondRoomFromQuery) {
	return typeof secondRoomFromQuery === 'undefined';
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
