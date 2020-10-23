const { UserInputError } = require("apollo-server-express");
const { getDB, getNextSequence, getPrevSequence } = require("./db.js");
const { mustBeSignedIn } = require("./auth.js");
const db = require("./db.js");
const PAGE_SIZE = 10;

async function get(_, { id }) {
  const db = getDB();
  const issue = await db.collection("issues").findOne({ id });
  return issue;
}

async function list(_, { status, effortMin, effortMax, search, page }) {
  const db = getDB();
  const filter = {};
  if (status) filter.status = status;
  if (effortMin !== undefined || effortMax !== undefined) {
    filter.effort = {};
    if (effortMin !== undefined) filter.effort.$gte = effortMin;
    if (effortMax !== undefined) filter.effort.$lte = effortMax;
  }
  if (search) filter.$text = { $search: search };
  const cursor = db
    .collection("issues")
    .find(filter)
    .sort({ id: 1 })
    .skip(PAGE_SIZE * (page - 1))
    .limit(PAGE_SIZE);

  const totalCount = await cursor.count(false);
  const issues = cursor.toArray();
  const pages = Math.ceil(totalCount / PAGE_SIZE);
  return { issues, pages };
}

function Validate(issue) {
  const errors = [];
  if (issue.title.length < 3)
    errors.push('Field "title" must be at least 3 characters long.');
  if (issue.status == "Assigned" && !issue.owner)
    errors.push('Field "owner" is required when status is "Assigned" ');
  if (errors.length > 0)
    throw new UserInputError("Invalid inputs form the user", { errors });
}

async function add(_, { issue }) {
  const db = getDB();
  Validate(issue);
  issue.created = new Date();
  issue.id = await getNextSequence("issues");
  const finding = await db.collection("issues").findOne({ id: issue.id });
  if (finding) {
    issue.id = issue.id + 1;
  }
  const result = await db.collection("issues").insertOne(issue);
  const savedIssue = await db
    .collection("issues")
    .findOne({ _id: result.insertedId });
  return savedIssue;
}

async function update(_, { id, changes }) {
  const db = getDB();
  if (changes.title || changes.status || changes.owner) {
    const issue = await db.collection("issues").findOne({ id });
    Object.assign(issue, changes);
    Validate(issue);
  }
  await db.collection("issues").updateOne({ id }, { $set: changes });
  const savedIssue = await db.collection("issues").findOne({ id });
  return savedIssue;
}

async function removing(_, { id }) {
  const db = getDB();
  const issue = await db.collection("issues").findOne({ id });
  if (!issue) return false; //not found
  issue.deleted = new Date();

  let deleteTabledata = db.collection("deleted_issues").findOne({ id });
  if (deleteTabledata) {
    let found = await db.collection("deleted_issues").deleteOne({ id }, issue);
    let result = await db.collection("deleted_issues").insertOne(issue);
    if (result.insertedId) {
      result = await db.collection("issues").deleteOne({ id });

      const newCount = await db.collection("issues").countDocuments();
      const cntr = await db
        .collection("counters")
        .updateOne({ _id: "issues" }, { $set: { current: newCount } });
      return result.deletedCount === 1;
    }
  } else {
    let result = await db.collection("deleted_issues").insertOne(issue);

    if (result.insertedId) {
      result = await db.collection("issues").deleteOne({ id });

      const newCount = await db.collection("issues").countDocuments();
      const cntr = await db
        .collection("counters")
        .updateOne({ _id: "issues" }, { $set: { current: newCount } });
      return result.deletedCount === 1;
    }
  }
  return false;
}

async function restore(_, { id }) {
  const db = getDB();
  const issue = await db.collection("deleted_issues").findOne({ id });
  if (!issue) return false;
  issue.deleted = new Date();
  let result = await db.collection("issues").insertOne(issue);
  if (result.insertedId) {
    reuslt = await db.collection("deleted_issues").removeOne({ id });
    return result.deletedCount === 1;
  }
  return false;
}

async function counts(_, { status, effortMin, effortMax }) {
  const db = getDB();
  const filter = {};
  if (status) filter.status = status;

  if (effortMin !== undefined || effortMax !== undefined) {
    filter.effort = {};
    if (effortMin !== undefined) filter.effort.$gte = effortMin;
    if (effortMax !== undefined) filter.effort.$lte = effortMax;
  }

  const results = await db
    .collection("issues")
    .aggregate([
      { $match: filter },
      {
        $group: {
          _id: { owner: "$owner", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();
  const stats = {};
  results.forEach((result) => {
    const { owner, status: statusKey } = result._id;
    if (!stats[owner]) stats[owner] = { owner };
    stats[owner][statusKey] = result.count;
  });
  return Object.values(stats);
}

module.exports = {
  list,
  add: mustBeSignedIn(add),
  get,
  update: mustBeSignedIn(update),
  removing: mustBeSignedIn(removing),
  restore: mustBeSignedIn(restore),
  counts,
};
