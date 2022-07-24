const socket = io();


// selections
const nameForm = document.getElementById('name_form');
const msgForm = document.getElementById('msg_form');
const publicRoomsDiv = document.getElementById('accordionPanelsStayOpenExample');
const roomCreateBtn = document.getElementById('create-btn');
const roomNameInputEl = document.getElementById('create_room');
const onlineUserList = document.getElementById('onlineUserList');
const nameFormArea = document.querySelector(".name");
const messages = document.querySelector(".messages");
const roomArea = document.querySelector('.room')
const innerCanvas = document.querySelector('.inner_canvas')
const displayName = document.querySelector('.displayNmae')
const modal = document.querySelector(".modal");
innerCanvas.hidden = true;



// global variables
let activeUsers;
let publicRooms;



// set name 
nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameForm[0].value;
    if (!name) return;
    socket.emit('setName', name, () => {
        nameFormArea.hidden = true;
        roomArea.hidden = false;
    })
})


// get active users 
socket.on("get_active_users", (users) => {
    activeUsers = users;
    onlineUserList.innerHTML = ''
    activeUsers.forEach(user => {
        const li = document.createElement('li');
        li.style.cursor= 'pointer'
        li.addEventListener('click', () => {
            openCanvas(user)
            msgForm[1].dataset.room = false;
            messages.innerHTML = ''

        })
        li.textContent = user.id === socket.id ? "You" : user.name;
        li.dataset.id = user.id;
        li.classList.add("list-group-item");
        li.classList.add("onLine");
        onlineUserList.appendChild(li)
    })
    
})



// send private msg 
msgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = msgForm[0].value;
    const id = msgForm[1].value;
    const isRoom = msgForm[1].dataset.room;

    if (msg) {
        socket.emit("send_a_msg", {msg, id, isRoom}, () => {
            const li = document.createElement("li");
            li.classList.add("list-group-item");
            li.textContent ="You" + ": " + msg;
            messages.appendChild(li)
            msgForm[0].value = '';
        })
    }
})



// receive an event

socket.on("receive_a_message", (data, senderId) => {

    const isRoom = data.isRoom;

   
    const user = activeUsers.find(u => u.id === data.id);
     

    const sender = activeUsers.find(u => u.id ===senderId);
    if (isRoom) {

        innerCanvas.hidden = false;
        displayName.textContent = data.id;
        msgForm[1].value = data.id;
        msgForm[1].dataset.room = true;
    } else {
        openCanvas(sender) 
        msgForm[1].dataset.room = false;
    }

    const li = document.createElement("li");
    li.classList.add("list-group-item");
    li.textContent =sender.name + ": " + data.msg;


    messages.appendChild(li)

})



// open the msg canvas
function openCanvas(user) {
    innerCanvas.hidden = false;
    displayName.textContent = user.name;
    msgForm[1].value = user.id;
}


// create room functionality
roomCreateBtn.addEventListener('click', (e) => {
    const roomName = roomNameInputEl.value;
    if (roomName) {
        socket.emit("create_room", roomName, () => {
            modalClose()
        })
    }
})


// get public rooms
socket.on('getPublicRooms', (rooms) => {
    publicRooms = rooms;
    publicRoomsDiv.innerHTML = ''
    rooms.forEach(room => {
        const accordionItem = document.createElement('div');
        accordionItem.classList.add("accordion-item")
        
        accordionItem.innerHTML = `
        <h2 class="accordion-header" id="${room.id}id">
                <button
                  class="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#${room.id}option"
                  aria-expanded="false"
                  aria-controls="${room.id}option"
                  
                >
                  ${room.roomName} (${room.size})
    
                  <span onclick="joinRoom('${room.roomName}')"  class="material-symbols-outlined">
                      group_add
                  </span>

                  <span 
                  onclick="leaveRoom('${room.roomName}')"
                  class="material-symbols-outlined"> logout </span>
                </button>
              </h2>
              <div
                id="${room.id}option"
                class="accordion-collapse collapse"
                aria-labelledby="${room.id}id"
              >
                <div class="accordion-body">
                  <ul id="participants"></ul>
                </div>
              </div>`;


        const participantUl = accordionItem.querySelector('#participants');

        room?.participants?.forEach(participant => {
            const li = document.createElement('li');
            li.textContent = participant.name;
            participantUl.appendChild(li)
        })

        publicRoomsDiv.appendChild(accordionItem);

   })
})



function joinRoom(roomName) {
    socket.emit("joinRoom", roomName, () => {
        messages.innerHTML = ''
        innerCanvas.hidden = false;
        displayName.textContent = roomName;
        msgForm[1].value = roomName;
        msgForm[1].dataset.room = true;
     })
}



// modal close 
function modalClose() {
    modal.classList.remove("show");
    modal.style.display = "none";
    roomNameInputEl.value = "";
    document.body.classList.remove("modal-open");
    document.body.style = {};
    document.querySelector(".modal-backdrop")?.remove("show");
}


function leaveRoom(roomName) {
    socket.emit("leaveRoom", roomName, () => {
        innerCanvas.hidden = true;
    })
}