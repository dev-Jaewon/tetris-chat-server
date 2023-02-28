const express = require("express");
const expressSession = require("express-session");
const app = express();
app.set("port", 8000);

app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: true,
        },
    })
);

const appServer = app.listen(app.get("port"), () => {
    console.log(app.get("port"), "번 포트에서 대기 중");
});

const Session = require("./session");
const User = require("./user");
const Ws = require("ws").Server;
const crypto = require("crypto");

const server = new Ws({ server: appServer });

const sessions = {};

const createId = () => {
    return crypto.randomBytes(6).toString("base64");
};

const createSession = (id) => {
    const session = new Session(id);

    sessions[session.id] = session;
    return session;
};

server.on("connection", (conn) => {
    const user = new User(conn, createId());

    console.log(user.id + "접속하셨습니다.");

    conn.on("message", (msg) => {
        const { type, id, session, content } = JSON.parse(msg);

        if (type === "join") {
            user.nickName = id;

            if (!sessions[session]) {
                createSession(session).join(user);
            } else {
                sessions[session].join(user);
            }

            user.sendAll({
                type: "notification",
                content: `${id}님이 입장하셨습니다`,
            });
        }

        if (type === "message") {
            user.sendAll({
                type: "message",
                id,
                content,
            });
        }
    });

    conn.on("close", () => {
        if (!user.session) return;

        const nickName = user.nickName;
        const session = user.session.leave(user);

        if (session.users.size === 0) {
            delete sessions[session.id];
        } else {
            Array.from(session.users)[0].sendAll({
                type: "notification",
                content: `${nickName}님이 나가셨습니다.`,
            });
        }
    });
});
