const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

class FakeUserModel {
  static users = new Map();
  static async exists({ email }) { return [...this.users.values()].some((user) => user.email === email); }
  static async create(data) { const user = { ...data, _id: `user-${this.users.size + 1}`, role: "user", avatarUrl: "https://www.gravatar.com/avatar/?d=mp", createdAt: new Date(), updatedAt: new Date() }; this.users.set(user._id, user); return user; }
  static findOne(query) { return { select: async () => [...this.users.values()].find((user) => query.email ? user.email === query.email : user.refreshTokenHash === query.refreshTokenHash && user.refreshTokenExpiresAt > query.refreshTokenExpiresAt.$gt) || null }; }
  static async updateOne(query, update) { const user = query._id ? this.users.get(query._id) : [...this.users.values()].find((item) => item.refreshTokenHash === query.refreshTokenHash); if (user) Object.assign(user, update); }
  static async findById(id) { return this.users.get(id) || null; }
  static async findByIdAndUpdate(id, update) { const user = this.users.get(id); if (user) Object.assign(user, update.$set); return user || null; }
}

async function request(server, path, options) { return fetch(`${server}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } }); }

test("registration, duplicate email, login, invalid credentials, and protected me", async () => {
  FakeUserModel.users.clear();
  const server = await new Promise((resolve) => { const app = createApp({ UserModel: FakeUserModel }); const listener = app.listen(0, () => resolve({ url: `http://127.0.0.1:${listener.address().port}`, close: () => listener.close() })); });
  const body = { name: "Ada", email: "ada@example.com", password: "correct horse battery staple" };
  const registered = await request(server.url, "/api/v1/auth/register", { method: "POST", body: JSON.stringify(body) });
  assert.equal(registered.status, 201);
  const duplicate = await request(server.url, "/api/v1/auth/register", { method: "POST", body: JSON.stringify(body) });
  assert.equal(duplicate.status, 409);
  const invalid = await request(server.url, "/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email: body.email, password: "wrong password" }) });
  assert.equal(invalid.status, 401);
  const login = await request(server.url, "/api/v1/auth/login", { method: "POST", body: JSON.stringify(body) });
  assert.equal(login.status, 200);
  const loginData = await login.json();
  const me = await request(server.url, "/api/v1/auth/me", { headers: { Authorization: `Bearer ${loginData.accessToken}` } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.email, body.email);
  server.close();
});
