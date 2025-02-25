import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Community Connect API",
            version: "1.0.0",
            description: "API documentation for Community Connect Web Application",
        },
        servers: [{ url: "http://localhost:5050" }],
    },
    apis: [path.join(__dirname, "../config/swagger.yaml")], // ✅ Fixed path
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;