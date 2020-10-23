const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");

const GraphQLDate = new GraphQLScalarType({
  name: "GraphQLDate",
  description: "A date() type in graphql as a scalar",
  serialize(value) {
    return value.toISOString();
  },
  parseValue(value) {
    const datevalue = new Date(value);
    return isNaN(datevalue) ? undefined : datevalue;
  },
  parseLiteral(ast) {
    if (ast.kind == Kind.STRING) {
      const value = new Date(ast.value);
      return isNaN(value) ? undefined : value;
    }
  }
});
module.exports = GraphQLDate;
