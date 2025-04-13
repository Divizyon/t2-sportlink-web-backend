import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sportlink API',
            version: '1.0.0',
            description: 'Sportlink web uygulaması için REST API dokümantasyonu',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: ['./src/routes/*.ts'], // Swagger JSDoc'un arayacağı dosya yolları
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;