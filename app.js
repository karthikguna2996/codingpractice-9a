let express = require("express");
let app = express();
app.use(express.json());
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let path = require("path");
let dbPath = path.join(__dirname, "userData.db");
let bcrypt = require("bcrypt");
let db = null;
let connectDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("server connected");
    });
  } catch (err) {
    console.log(err.message);
  }
};
connectDatabase();

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let encryptedPass = await bcrypt.hash(password, 10);
  console.log(`${password}`.length);
  let postQuery1 = `
         SELECT *
         FROM user
         WHERE username = '${username}'
    `;
  let getResponse = await db.get(postQuery1);
  console.log(getResponse);
  if (getResponse !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (getResponse === undefined) {
    if (`${password}`.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let postQuery = `
                 INSERT INTO user(username,name,password,gender,location)
                 VALUES (
                     '${username}',
                     '${name}',
                     '${encryptedPass}',
                     '${gender}',
                     '${location}'
                 )
        `;
      await db.run(postQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let getQuery2 = `
                      SELECT *
                      FROM user 
                      WHERE username = '${username}'
        `;
  let getResponseLogin = await db.get(getQuery2);
  if (getResponseLogin === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let isPassMatch = await bcrypt.compare(password, getResponseLogin.password);
    if (isPassMatch === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  let encryptedPass = await bcrypt.hash(newPassword, 10);
  let getPassQuery = `
          SELECT *
          FROM user
          WHERE username = '${username}'
        `;
  let getResponseUpdate = await db.get(getPassQuery);

  if (getResponseUpdate === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    isPassSame = await bcrypt.compare(oldPassword, getResponseUpdate.password);
    if (isPassSame === true) {
      if (`${newPassword}`.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        let putQuery = `
                         UPDATE user
                         SET password = '${encryptedPass}'
                         WHERE username = '${username}'
                `;
        await db.run(putQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
