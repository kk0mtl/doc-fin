// events.js
// roomId를 docId로 사용
const { Server } = require("socket.io");
const docController = require("../controllers/documents");

const usersInRooms = {}; // 각 roomId에 대한 사용자 배열을 저장하는 객체
const userColors = {}; // 사용자별 색상을 저장하는 객체
const COLORS = ["#00323F", "#FFCE00", "#83C9D9", "#6690D8", "#a86be4", "#590202"]; // 색상 배열

// 랜덤 색상 생성 함수
function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function assignColor(userName, roomId) {
  // 이미 색상이 부여된 사용자인 경우 기존 색상 반환
  if (userColors[roomId] && userColors[roomId][userName]) {
    return userColors[roomId][userName];
  }

  const usedColors = usersInRooms[roomId]?.map((user) => user.color) || [];
  const availableColors = COLORS.filter((color) => !usedColors.includes(color));
  const assignedColor = availableColors.length > 0 ? availableColors[0] : COLORS[Math.floor(Math.random() * COLORS.length)];

  if (!userColors[roomId]) {
    userColors[roomId] = {};
  }
  userColors[roomId][userName] = assignedColor;

  return assignedColor;
}

exports.init = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-room", async ({ userName, roomId }) => {
      console.log(`${userName} joined room ${roomId}`);

      // 방 목록에 사용자가 존재하는지 확인 후 추가
      if (!usersInRooms[roomId]) {
        usersInRooms[roomId] = [];
      }

      // 중복된 이름 방지 및 사용자 추가
      if (!usersInRooms[roomId].some((user) => user.name === userName)) {
        const color = assignColor(userName, roomId); // 색상 순차 할당
        usersInRooms[roomId].push({ name: userName, color });
        userColors[userName] = color; // 사용자별 색상 저장
      }

      // 방에 있는 모든 사용자에게 사용자 목록 전달
      io.to(roomId).emit("update-user-list", usersInRooms[roomId]);

      // roomId를 documentId로 간주하여 문서 로드 또는 생성
      const document = await docController.getDocumentByRoomId(roomId);
      if (!document) {
        await docController.createDocument(roomId);
      } else socket.emit("load-document", document?.data);

      socket.join(roomId);
      console.log(`User ${userName} has joined room: ${roomId}`);

      // 방에 있는 모든 사용자에게 사용자 목록 전달
      io.to(roomId).emit("update-user-list", usersInRooms[roomId]);

      // 커서 위치를 받아서 다른 사용자에게 전송
      socket.on("cursor-position", ({ cursor, userName, color }) => {
        const userColor = userColors[roomId][userName];
        socket.to(roomId).emit("cursor-position-update", { cursor, userName, color: userColor });
      });

      // 연결 해제 시 사용자 제거 처리
      socket.on("disconnect", () => {
        usersInRooms[roomId] = usersInRooms[roomId].filter((user) => user.name !== userName);
        io.to(roomId).emit("update-user-list", usersInRooms[roomId]);
        console.log(`${userName} left room ${roomId}`);
      });
    });

    // 클라이언트에서 발생하는 문서 수정 사항 전송
    socket.on("send-changes", async (delta) => {
      const roomId = Array.from(socket.rooms)[1]; // 소켓이 가입된 방 중 실제 roomId 가져오기
      if (roomId) {
        console.log(`Sending changes to room ${roomId}`);
        socket.broadcast.to(roomId).emit("receive-changes", delta);
      }
    });

    // 문서 저장
    socket.on("save-changes", async (data) => {
      const roomId = Array.from(socket.rooms)[1]; // 소켓이 가입된 방 중 실제 roomId 가져오기
      if (roomId) {
        console.log(`Saving changes for room ${roomId}`);
        await docController.updateDocument(roomId, data);
        socket.broadcast.to(roomId).emit("send-changes", data);
      }
    });

    // 문서 제목 업데이트
    socket.on("update-title", async ({ roomId, newTitle }) => {
      if (roomId) {
        console.log(`Updating title for room ${roomId} : ${newTitle}`);
        await docController.updateTitle(roomId, newTitle);
        io.to(roomId).emit("title-updated", newTitle);
      }
    });
  });
};
