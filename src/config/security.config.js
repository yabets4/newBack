export default {
  cors: { 
    origin: '*', 
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true 
  },
  helmet: {}, 
  passwordHashRounds: 10,
};

