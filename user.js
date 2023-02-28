class User {
    constructor(conn, id) {
        this.conn = conn;
        this.id = id;
        this.session = null;
        this.nickName = null;
    }

    send(data) {
        this.conn.send(JSON.stringify(data));
    }

    sendAll(msg) {
        this.session.users.forEach((user) =>
            user.conn.send(JSON.stringify(msg))
        );
    }
}

module.exports = User;
