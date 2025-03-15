import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sportlink API',
      version: '1.0.0',
      description: 'Sportlink web uygulaması API dokümantasyonu',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Geliştirme sunucusu',
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
  },
  apis: [
    './src/routes/*.ts', 
    './src/models/*.ts',
    './src/controllers/*.ts'
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;