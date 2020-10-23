db.issues.remove({});
db.deleted_issues.remove({});
const issuesDB = [
  {
    id: 1,
    status: "New",
    owner: "Saurabh",
    effort: "5",
    created: new Date("2020-02-12"),
    due: new Date("2020-03-12"),
    title: "Error in console when clicking ADD",
    description:
      "When the add button is clicked there is an error in the console which shows that there is no function attached to it. Why? this is just not normal as there is a function that is assigned to the button",
  },
  {
    id: 2,
    status: "Assigned",
    owner: "Annu",
    effort: "2",
    created: new Date("2020-02-18"),
    due: new Date("2020-03-20"),
    title: "Missing bottom border on the panel",
    description:
      "The bottom border of the ui panel is missing and there is no way to see the status of the current active file",
  },
];
db.issues.insertMany(issuesDB);
const count = db.issues.count();
print("Inserted", count, "issues");
db.counters.remove({ _id: "issues" });
db.counters.insert({ _id: "issues", current: count });
db.issues.createIndex({ id: 1 }, { unique: true });
db.issues.createIndex({ status: 1 });
db.issues.createIndex({ owner: 1 });
db.issues.createIndex({ created: 1 });
db.issues.createIndex({ title: "text", description: "text" });
db.deleted_issues.createIndex({ id: 1 }, { unique: true });
