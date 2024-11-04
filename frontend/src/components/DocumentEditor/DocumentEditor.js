import "./DocumentEditor.css";
import { useEffect, useCallback, useState } from "react";
import Quill from "quill";
import { io } from "socket.io-client";
import "quill/dist/quill.snow.css";
import { Link } from "react-router-dom";
import OpenAi from "../TextGen/TextGen";
import Logo from "../../Assets/LOGO.png";
import { saveAs } from 'file-saver';
import * as quillToWord from 'quill-to-word';
import QuillCursors from 'quill-cursors';

// Quill에 커서 모듈 등록
Quill.register('modules/cursors', QuillCursors);

const Font = Quill.import("formats/font");
Font.whitelist = ["sans-serif", "noto-sans", "gowun-dodum", "nanum-gothic"];
Quill.register(Font, true);

const OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: ["sans-serif", "noto-sans", "gowun-dodum", "nanum-gothic"] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  ["clean"],
];

function DocumentEditor() {
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("Untitled Document");
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [isOpenAIVisible, setIsOpenAIVisible] = useState(true);

  const params = new URLSearchParams(window.location.search);
  let userName = params.get('userName') || sessionStorage.getItem("user");
  let roomId = params.get('roomId');

  const saveAsWord = async () => {
    if (!quill) return;

    const delta = quill.getContents();
    const modifiedDelta = delta.ops.map(op => {
      if (op.insert && op.insert.image) {
        return { insert: `[이미지: ${op.insert.image}]` };
      }
      return op;
    });

    try {
      const docBlob = await quillToWord.generateWord({ ops: modifiedDelta }, {
        exportAs: 'blob',
        title: title,
      });

      saveAs(docBlob, `${title}.docx`);
    } catch (error) {
      console.error("Word 파일 생성 중 오류 발생:", error);
    }
  };

  const toggleOpenAISection = () => {
    setIsOpenAIVisible((prev) => !prev);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    socket.emit("update-title", { roomId, newTitle });
  };

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: OPTIONS,
        cursors: {
          hideDelayMs: 0, // 이름표 숨김 지연 시간 설정 (0으로 설정하여 항상 표시)
          hideSpeedMs: 0, // 이름표 숨김 속도 설정 (0으로 설정하여 항상 표시)
        }, // 커서 모듈 활성화
      },
    });
    setQuill(q);
  }, []);

  useEffect(() => {
    const s = io(process.env.REACT_APP_BACKEND || "http://localhost:8080", {
      transports: ['websocket', 'polling'],
    });
    setSocket(s);

    s.on("update-user-list", (userList) => {
      setUsers(userList);
    });

    s.emit('join-room', { userName, roomId });

    s.on("cursor-position-update", ({ cursor, userName, color }) => {
      const cursorModule = quill.getModule("cursors");
      cursorModule.createCursor(userName, userName, color);
      cursorModule.moveCursor(userName, cursor);
      cursorModule.toggleFlag(userName, true);  // 이름표 항상 표시
    });

    s.on("title-updated", (newTitle) => {
      setTitle(newTitle);
    });

    return () => {
      s.disconnect();
    };
  }, [userName, roomId, quill]);

  useEffect(() => {
    if (!quill || !socket) return;

    const sendCursorPosition = () => {
      const range = quill.getSelection();
      if (range) {
        socket.emit("cursor-position", { cursor: range, userName });
      }
    };

    quill.on("selection-change", (range) => {
      sendCursorPosition();
    });

    quill.on("text-change", (delta, oldDelta, source) => {
      if (source === "user") {
        socket.emit("send-changes", delta);
        sendCursorPosition();
      }
    });

    socket.on("receive-changes", (delta) => {
      quill.updateContents(delta);
    });

    return () => {
      quill.off("selection-change");
      quill.off("text-change");
    };
  }, [quill, socket, userName]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit("get-document", roomId);
  }, [socket, quill, roomId]);

  return (
    <div>
      <div id="header">
        <div className="flex">
          <Link to="/dashboard">
            <img src={Logo} alt="Logo" />
          </Link>
          <input
            id="text"
            type="text"
            value={title}
            onChange={handleTitleChange}
          />
          <div id="user-now">
            <ul>
              {users.map((user, index) => (
                <li key={index} style={{ backgroundColor: user.color }}>{user.name}</li>
              ))}
            </ul>
          </div>
        </div>
        <div id="share">
          <button onClick={saveAsWord}>Download</button>
        </div>
      </div>
      <div className="documents">
        <div id="container" ref={wrapperRef}></div>
        <div className="assistant">
          <div className={`openai-drawer ${isOpenAIVisible ? 'open' : 'closed'}`}>
            <OpenAi />
          </div>
          <button
            className="openai-toggle-button"
            style={{
              right: isOpenAIVisible ? "400px" : "0",
            }}
            onClick={toggleOpenAISection}
          >
            {isOpenAIVisible ? ">" : "<"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentEditor;
