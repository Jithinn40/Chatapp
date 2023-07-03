const express = require('express');
const socketIO = require('socket.io');
const { MongoClient } = require('mongodb');

const app = express();
const server = app.listen(4000, () => {
  console.log('Server started on port 4000');
});

// Serve static files from the "public" directory
app.use(express.static('public'));

// Connect to MongoDB
MongoClient.connect('mongodb://127.0.0.1:27017', (err, client) => {
  if (err) {
    throw err;
  }

  console.log('MongoDB connected...');
  const db = client.db('mongochat');
  const chat = db.collection('chats');

  // Initialize Socket.IO
  const io = socketIO(server);

  // Handle socket connection
  io.on('connection', (socket) => {
    // Get chats from MongoDB collection
    chat.find().limit(100).sort({ _id: 1 }).toArray((err, res) => {
      if (err) {
        throw err;
      }

      // Emit the messages
      socket.emit('output', res);
    });

    // Handle input events
    socket.on('input', (data) => {
      const { name, message } = data;

      // Check for name and message
      if (name === '' || message === '') {
        // Send error status
        sendStatus(socket, 'Please enter a name and message');
      } else {
        // Insert message
        chat.insertOne({ name, message }, () => {
          io.emit('output', [data]);

          // Send status object
          sendStatus(socket, {
            message: 'Message sent',
            clear: true
          });
        });
      }
    });

    // Handle clear
    socket.on('clear', () => {
      // Remove all chats from collection
      chat.deleteMany({}, () => {
        // Emit cleared
        socket.emit('cleared');
      });
    });
  });
});

// Function to send status
function sendStatus(socket, s) {
  socket.emit('status', s);
}
