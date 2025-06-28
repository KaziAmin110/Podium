// 1. Import Express
const express = require('express');

// 2. Create an Express application
const app = express();

// 3. Define the port the server will run on
// Use a fallback for environments where PORT isn't set
const PORT = process.env.PORT || 3000;

// 4. Define a basic route for the root URL
// This is a "GET" request handler
app.get('/', (req, res) => {
  res.send('Hello from the Express server!');
});

// 5. Start the server and listen for incoming connections
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});