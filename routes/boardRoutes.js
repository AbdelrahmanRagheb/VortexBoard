const express = require('express');
const router = express.Router();
const {
    getBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    addCollaborator,
    removeCollaborator
} = require('../controllers/boardController');
const { protect } = require('../middleware/auth');
const { validateBoard, validateObjectId } = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Board routes
router.route('/')
    .get(getBoards)
    .post(validateBoard, createBoard);

router.route('/:id')
    .get(validateObjectId('id'), getBoard)
    .put(validateObjectId('id'), validateBoard, updateBoard)
    .delete(validateObjectId('id'), deleteBoard);

// Collaborator routes
router.post('/:id/collaborators', validateObjectId('id'), addCollaborator);
router.delete('/:id/collaborators/:userId', validateObjectId('id'), validateObjectId('userId'), removeCollaborator);

module.exports = router;
