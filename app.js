const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let db = null;

const initailizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () => {
      console.log("Server Running at http://localhost:3002/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initailizeDBAndServer();

const convertStatesDBObjectToResponseObject = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

//Get States API 1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
    *
    FROM
    state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachItem) =>
      convertStatesDBObjectToResponseObject(eachItem)
    )
  );
});
