import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API",
      version: "1.0.0",
    },
  },
  apis: ["./src/Routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
