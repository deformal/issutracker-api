let aboutMessage = "Issue Tracker API V2.1";
const { mustBeSignedIn } = require("./auth.js");

function setMessage(_, { message }) {
  //the {message} arguments is an object
  return (aboutMessage = message);
}
function getMessage() {
  return aboutMessage;
}
module.exports = { getMessage, setMessage: mustBeSignedIn(setMessage) };
