const { MongoClient } = require("mongodb");
require("dotenv").config();
const prompt = require("prompt-async");
prompt.start();

const url = process.env.DB_URL || "mongodb://localhost/issuetracker";

//global variables

let db;
let collection;
let client;
let id = 1;
let dataArray = [];
//global varibales end

function prompter() {
  const options = {
    one: "Insert data",
    two: "Show table",
    three: "Remove data",
    four: "Update data",
    nine: "Quit"
  };

  console.log(
    "Welcome to the issueTracker database feel free to make changes\n"
  );
  console.log(
    "Please choose from the following options to interact with the database make sure to make reasonable changes\n"
  );
  console.table(options);

  prompt.get(["choice"], function(err, input) {
    if (err) return onerror(err);
    else {
      switch (parseInt(input.choice)) {
        case 1:
          console.log("Your choice is to  ", options.one);
          insertData();
          break;
        case 2:
          console.log("Your choice is to ", options.two);
          showtable();
          break;
        case 3:
          console.log("Your choice is to ", options.three);
          deleteData();
          break;
        case 4:
          console.log("Your choice is to ", options.four);
          update();
          break;
        case 9:
          console.log("Good Bye ");
          process.exit();
        default:
          console.log(input.choice, "is a wrong choice");
      }
    }
  });
}

async function connecting() {
  client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  try {
    await client.connect();
    console.log(`Connection established ${url}`);
    db = client.db();
    collection = db.collection("employees");
    const result = await collection.find({}, { _id: 0 }).toArray();
    dataArray = [...result];
    prompter();
  } catch (err) {
    9;
    console.log(err);
  }
}

async function showtable() {
  try {
    const result = await collection.find({}, { _id: 0 }).toArray();
    console.table(result);
    prompter();
  } catch (err) {
    console.log(err);
  }
}

async function insertData() {
  try {
    id = dataArray.length + 1;
    const { name, age } = await prompt.get(["name", "age"]);
    console.log("you entered ", name, "  ", parseInt(age));
    const object = {
      id: id,
      name: name,
      age: parseInt(age)
    };
    2;

    await collection.insertOne(object);
    console.log("Submitted");
    showtable();
  } catch (err) {
    console.log(err);
  }
}

async function deleteData() {
  try {
    console.log("Enter the id and name of the person");
    const { id } = await prompt.get(["id"]);
    console.log("You entered the followig things \n", id);
    const query = {
      id: parseInt(id)
    };
    await collection.deleteOne(query);
    console.log("Deleted");
    showtable();
  } catch (err) {
    console.log(err);
  }
}

async function nameUpdate() {
  console.log("Enter the id and name where data to be updated\n");
  let { id, name } = await prompt.get(["id", "name"]);
  let query = { id: parseInt(id) };
  await collection.updateOne(query, { $set: { name: name } });
  console.log("Updated");
  await showtable();
}
async function ageUpdate() {
  console.log("Enter the id and age where data to be updated\n");
  let { id, age } = await prompt.get(["id", "age"]);
  let query = { id: parseInt(id) };
  await collection.updateOne(query, { $set: { age: parseInt(age) } });
  console.log("Updated");
  await showtable();
}

async function update() {
  try {
    console.log("Choose from the menu what to update");
    const updateOptions = {
      one: "Name",
      two: "Age"
    };
    console.table(updateOptions);
    const { choice } = await prompt.get(["choice"]);
    switch (parseInt(choice)) {
      case 1:
        nameUpdate();
        break;
      case 2:
        ageUpdate();
        break;
      default:
        console.log("Wrong choice bro");
        prompter();
    }
  } catch (err) {
    console.log(err);
  }
}

connecting();
