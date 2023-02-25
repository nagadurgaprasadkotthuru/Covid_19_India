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

const convertDistrictDBObjectToResponseObject = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

const convertStatesStatsDBObjectToResponseStatsObject = (obj) => {
  return {
    totalCases: obj.cases,
    totalCured: obj.cured,
    totalActive: obj.active,
    totalDeaths: obj.deaths,
  };
};

const convertStateNameDBObjectToResponseObject = (obj) => {
  return {
    stateName: obj.state_name,
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

//Get State API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertStatesDBObjectToResponseObject(state));
});

//Post District API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrictDetailsQuery = `
    INSERT INTO
    district(
        district_name,
        state_id,
        cases,
        cured,
        active,
        deaths
    )VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  await db.run(postDistrictDetailsQuery);
  response.send("District Successfully Added");
});

//Get district API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM
    district
    WHERE
    district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictDBObjectToResponseObject(district));
});

//Delete District API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE
    FROM
    district
    WHERE
    district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update District API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
    district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE
    district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Get Stats Of State API 7
app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
    SUM(cases) as cases,
    SUM(cured) as cured,
    SUM(active) as active,
    SUM(deaths) as deaths
    FROM
    district
    WHERE
    state_id = ${stateId}
    GROUP BY
    state_id;`;
  const stateStats = await db.get(getStateStatsQuery);
  response.send(convertStatesStatsDBObjectToResponseStatsObject(stateStats));
});

//Get District Details API 8
app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `
    SELECT 
    state_name
    FROM
    state NATURAL JOIN district
    WHERE
    district.district_id = ${districtId};`;
  const state = await db.get(getStateIdQuery);
  response.send(convertStateNameDBObjectToResponseObject(state));
});

module.exports = app;
