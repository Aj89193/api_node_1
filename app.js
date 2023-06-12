const express=require("express");
const app=express();
app.use(express.json());
const path =require("path");

const {open} =require("sqlite");
const sqlite3=require("sqlite3");

let db=null;

//initialize db and server
const dbPath= path.join(__dirname,"covid19India.db");

let initializeDBAndServer=async()=>{
    try{
        db= await  open({
            filename: dbPath,
            driver:sqlite3.DataBase,
        });
        app.listen(3000,() => {
            console.log("server is running in http://localhost:3000")
        })
    }catch(err){
        console.log(`DB Error:${err.message}`)
        process.exit(1)
    }
}
initializeDBAndServer()

const objectConvert=(dbObject)=>{
    return{
        stateName:dbObject.state_name,
        population:dbObject.population,
        districtId:dbObject.district_id,
        districtName:dbObject.district_name,
        stateId:dbObject.state_id,
        cases:dbObject.cases,
        cured: dbObject.cured,
        active: dbObject.active,
        deaths: dbObject.deaths
};
}

//list of all states
app.get("/states/",async(req,res) => {
    const booksQuery=`
    SELECT * FROM state`
    const allStates=await db.all(booksQuery);
    res.send(allStates.map((eachItem)=>{
        objectConvert(eachItem);
    }));
})
//states based on state Id
app.get("/state/:stateId/",async(req,res) => {
    const{stateId}=req.params;
    const getBook=`SELECT * FROM state WHERE stateId=${stateId};`;
    const stateSpecific= await db.get(getBook);
    res.send(stateSpecific.map(eachItem=>{
        objectConvert(eachItem)
    }))
})

//adding district

app.post("/districts/",async(req,res) => {
    const {contentDetails}=req.body;
    const {districtName,statedId,cases,cured,active,deaths}=contentDetails;
    const addDistrict=`INSERT INTO district (districtName,startedId,cases,cured,active,deaths) VALUES ('${districtName},{stateId},{cases},{cured},{active},{deaths});`;
    const creteDistrict=await db.run(addDistrict);
    res.send("District Successfully Added")
})

//
app.get("/districts/:districtId/",async(req,res) =>{
    const {detailsObject} = req.params;
    const {districtId}=detailsObject;
    const getBook=`SELECT * FROM district WHERE districtId=${districtId};`;
    const getBookQuery=await db.get(getBook);
    res.send(getBookQuery.map((eachItem) => {
        objectConvert(eachItem)
    }))
})

//delete district
app.delete("districts/:districtId/",async(req,res) => {
    const {districtId}=req.params;
    const deleteQuery=`SELECT * FROM district WHERE districtId=${districtId};`;
    const deleteItem=await db.all(deleteQuery);
    res.send("District Removed")
})

//updating details

app.put("/districts/:districtId/",async(req,res)=>{
    const {districtId}=req.params;
    const {detailsObject} = req.body;
    const {districtName,stateId,cases,cured,active,deaths}=detailsObject;
    const updateQuery=`UPDATE district SET districtName='${districtName}',stateId='${stateId}',cases='${cases}',cured='${cured}',active='${active}',deaths='${deaths}';`;
    const updateDistrict= await db.run(updateQuery);
    res.send("District Details Updated")   
})

//getting stats

app.get("/states/:stateId/stats",async(req,res) => {
    const {stateId}=req.params;
    const statQuery=`SELECT * FROM state WHERE stateId=${stateId};`;
    const statRun=await db.get(statQuery);
    res.respond({
        totalCases:statRun['sum(cases)'],
        totalCured:statRun['sum(cured)'],
        totalActive:statRun['sum(active)'],
        totalDetails:statRun['sum(deaths)']
     })
})

//getting state name

app.get("districts/:districtId/details/",async(req,res)=>{
    const {districtId}=req.params;
    const getQuery=`SELECT state_name FROM state NATURAL JOIN district WHERE districtId=${districtId};`;
    const getDetails= await db.get(getQuery);
    res.send(getDetails);
})
module.exports=app