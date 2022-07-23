
const socket = io();
let onLineUsers;
// selections
const nameForm = document.getElementById("name_form");
const roomAccordion = document.getElementById(
  "accordionPanelsStayOpenExample"
);
const publicRooms = document.getElementById("public_Rooms");
const msgForm = document.getElementById("msg_form");
const onlineUserList = document.getElementById("onlineUserList");
const room = document.querySelector(".room");
const modal = document.querySelector(".modal");
const createRoom = document.querySelector("#create_room");
const messages = document.querySelector(".messages");
const displayName = document.querySelector(".displayNmae");
const nameEl = document.querySelector(".name");
const innerCanvas = document.querySelector(".inner_canvas");
innerCanvas.hidden = true;

// set name
nameForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = nameForm[0].value;
  if (!name) return;
  socket.emit("setname", name, allOnlineUsers => {
    room.hidden = false;
    nameEl.hidden = true;
    displayOnlineUsers(allOnlineUsers);
  });

  socket.emit("getPublicRoom", showPublicRoom);
});

// get online users and display
socket.on("getOnlineUserUpdate", onLineUsers => {
  displayOnlineUsers(onLineUsers);
});

// display online users
function displayOnlineUsers(Users) {
  onLineUsers = Users;
  onlineUserList.innerHTML = "";
  onLineUsers.forEach(user => {
    const li = document.createElement("li");
    li.addEventListener("click", () => {
      const name = li.textContent;
      const id = li.dataset.id;
      displayName.innerHTML = name;
      msgForm[1].value = id;
      innerCanvas.hidden = false;
      messages.innerHTML = "";
    });
    li.classList.add("list-group-item");
    li.classList.add("onLine");
    li.textContent = user.id === socket.id ? "You" : user.name;
    li.style.cursor = "pointer";
    li.dataset.id = user.id;
    onlineUserList.appendChild(li);
  });
}

// send message
msgForm.addEventListener("submit", e => {
  e.preventDefault();
  const msg = msgForm[0].value;
  const id = msgForm[1].value;
  const room = msgForm[1].dataset.room;
  socket.emit(
    "private_msg",
    {
      msg,
      id,
      room,
    },
    () => {
      const li = document.createElement("li");
      li.classList.add("list-group-item");
      li.textContent = "You: " + msg;
      messages.appendChild(li);

      msgForm[0].value = "";
    }
  );
});

// show public rooms
function showPublicRoom(publicRoom) {
  console.log(publicRoom);
  roomAccordion.innerHTML = "";
  publicRoom.forEach(room => {
    const singleroom = document.createElement("div");
    singleroom.classList.add("accordion-item");
    singleroom.innerHTML = `
    <h2 class="accordion-header" id="${room.id}id">
            <button
              class="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#${room.id}option"
              aria-expanded="false"
              aria-controls="${room.id}option"
              
            >
              ${room.name} (${room.size})

              <span onclick="joinRoom('${room.name}')"  class="material-symbols-outlined">
                  group_add
              </span>
            </button>
          </h2>
          <div
            id="${room.id}option"
            class="accordion-collapse collapse"
            aria-labelledby="${room.id}id"
          >
            <div class="accordion-body">
              <ul id="participants"> </ul>
            </div>
          </div>`;

    const participants = singleroom.querySelector("#participants");

    room?.participants.forEach(participant => {
      const li = document.createElement("li");
      li.textContent = participant.name;
      participants.appendChild(li);
    });

    roomAccordion.appendChild(singleroom);
    modal.classList.remove("show");
    modal.style.display = "none";
    createRoom.value = "";
    document.body.classList.remove("modal-open");
    document.body.style = {};
    document.querySelector(".modal-backdrop")?.remove("show");
  });
}

// listen private message
socket.on("private_msg", (data, id) => {
  const user = onLineUsers.find(u => u.id === id);
  const li = document.createElement("li");
  li.classList.add("list-group-item");
  li.textContent = user.name + ": " + data.msg;
  displayName.innerHTML = user.name;
  msgForm[1].value = id;
  innerCanvas.hidden = false;
  messages.appendChild(li);
});

// create room
document.getElementById("create-btn").addEventListener("click", () => {
  const roomName = createRoom.value;
  socket.emit("create-room", roomName, showPublicRoom);
});

// show public room
socket.on("public_room", showPublicRoom);

// join room
function joinRoom(roomName) {
  socket.emit("joinRoom", roomName, showPublicRoom);

  displayName.innerHTML = roomName;
  msgForm[1].value = roomName;
  msgForm[1].dataset.room = true;
  innerCanvas.hidden = false;
}
