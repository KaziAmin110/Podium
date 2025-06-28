// 1. Import Express
import express from 'express';
import cookieParser from 'cookie-parser';
import appRoutes from "./src/routes/app.routes.js"; // Adjust the path as necessary

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// 2. Create an Express application

// 3. Define the port the server will run on
// Use a fallback for environments where PORT isn't set
const PORT = process.env.PORT || 3000;


// Routes
app.use('/api/app', appRoutes);

// 4. Define a basic route for the root URL
// This is a "GET" request handler
app.get('/', (req, res) => {
  res.send('Hello from the Express server!');
});

// 5. Start the server and listen for incoming connections
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});