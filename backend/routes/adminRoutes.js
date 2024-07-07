const express = require('express');
const {
  getAllTeachers,
  createTeacher,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  allow,
  setRole,
  approveStudent,
  deleteStudent
} = require('../controllers/adminController');
const { verifyToken } = require('../controllers/authController');
const router = express.Router();

// Route to get all teachers and create a new teacher
router.route('/')
  .get(verifyToken, allow('admin'), getAllTeachers)
  .post(verifyToken, allow('admin'), setRole('teacher'), createTeacher);

// Routes to get, update, and delete a teacher by ID
router.route('/:id')
  .get(verifyToken, allow('admin'), getTeacher)
  .patch(verifyToken, allow('admin'), updateTeacher)
  .delete(verifyToken, allow('admin'), deleteTeacher);

// Route to delete a student
router.route('/rejectStudent/:id')
  .delete(verifyToken, allow('admin'), deleteStudent);

// Route to approve a student
router.route('/approveStudent/:id')
  .patch(verifyToken, allow('admin'), approveStudent);

module.exports = router;
