# 🚀 VortexBoard Quick Start Guide

Get VortexBoard up and running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js (v18+) installed: `node --version`
- ✅ MongoDB installed and running: `mongod --version`
- ✅ npm or yarn: `npm --version`

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Express, MongoDB, JWT, and testing tools.

## Step 2: Configure Environment

The `.env.example` file contains all configuration options. For local development, you can use these default values:

- **PORT**: 5000
- **DB_URI**: mongodb://localhost:27017/vortexboard
- **JWT_SECRET**: (use a strong secret in production)

**Important**: Make sure MongoDB is running on your system!

### Start MongoDB (if not running)

**Windows:**
```bash
# Start MongoDB service
net start MongoDB
```

**macOS/Linux:**
```bash
# Start MongoDB
mongod
# or if installed via brew
brew services start mongodb-community
```

## Step 3: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

You should see:
```
🌀 VortexBoard API Server
Status: Running
Port: 5000
Environment: development
```

## Step 4: Test the API

### Option 1: Using cURL

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Register a User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from the response!

**Create a Board:**
```bash
curl -X POST http://localhost:5000/api/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "My First Board",
    "description": "Getting started with VortexBoard"
  }'
```

### Option 2: Using Postman

1. Import `VortexBoard.postman_collection.json` into Postman
2. Set the `baseUrl` variable to `http://localhost:5000/api`
3. Register a user and copy the token
4. Set the `token` variable in Postman
5. Start making requests!

### Option 3: Using Browser (for GET requests)

Visit these URLs in your browser:
- http://localhost:5000/ - Welcome message
- http://localhost:5000/health - Health check

## Step 5: Run Tests

```bash
npm test
```

This will run the test suite and show you coverage reports.

## Common Issues & Solutions

### MongoDB Connection Error
**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:** 
- Make sure MongoDB is running
- Check if the DB_URI in .env is correct
- Try: `mongod` in a separate terminal

### Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
- Change PORT in .env to a different port (e.g., 5001)
- Or kill the process using port 5000

### JWT Secret Error
**Error:** `secretOrPrivateKey must have a value`

**Solution:**
- Make sure JWT_SECRET is set in your .env file
- Copy from .env.example if needed

## Next Steps

1. **Explore the API**: Check out the full API documentation in README.md
2. **Add Features**: Customize the code to add your own features
3. **Deploy**: Follow the deployment guide in README.md
4. **Test**: Write more tests in the `tests/` directory

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Check for outdated packages
npm outdated

# Update packages
npm update
```

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Boards
- `GET /api/boards` - Get all boards (requires auth)
- `POST /api/boards` - Create board (requires auth)
- `GET /api/boards/:id` - Get single board (requires auth)
- `PUT /api/boards/:id` - Update board (requires auth)
- `DELETE /api/boards/:id` - Delete board (requires auth)

### Tasks
- `GET /api/tasks/boards/:boardId/tasks` - Get all tasks (requires auth)
- `POST /api/tasks/boards/:boardId/tasks` - Create task (requires auth)
- `GET /api/tasks/:id` - Get single task (requires auth)
- `PUT /api/tasks/:id` - Update task (requires auth)
- `DELETE /api/tasks/:id` - Delete task (requires auth)

## Development Workflow

1. **Make changes** to the code
2. **Server auto-reloads** (if using `npm run dev`)
3. **Test your changes** using Postman or cURL
4. **Write tests** for new features
5. **Run tests** to ensure everything works
6. **Commit** your changes

## Need Help?

- 📖 Read the full [README.md](README.md)
- 🐛 Check the error logs in `logs/` directory
- 💬 Review the code comments for detailed explanations
- 🔍 Use the Postman collection for API testing

---

**Happy Coding! 🎉**

Built with ❤️ using Node.js and Express
