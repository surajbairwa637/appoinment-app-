const Appointment = require('../models/Appointment');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { connect } = require('../utils/sendEmail');
const { signToken } = require('./authController');
const transporter = connect()

const getTeacherWithAppointments = async (id) => {
    return await Appointment.find({
        "students.studentId": { '$not': { '$eq': id } }
    });
};

const getRegisteredAppointments = async (id) => {
    return await Appointment.find({
        "students.studentId": { '$eq': id }
    });
};


exports.register = catchAsync(
    async (req, res, next) => {
        const user = {
            email: req.body.email,
            name: req.body.name,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            department: req.body.department,
            age: req.body.age
        }
        const newUser = await User.create(user);
        newUser.password = undefined
        const token = await signToken(user._id, user.roles, user.name, user.email, user.admissionStatus);
        res.status(200).json({
            status: 'SUCCESS',
            message: "Student created",
            data: {
                newUser
            },
            token
        })
    }
)

exports.bookAppointment = catchAsync(async (req, res, next) => {

    const appointmentId = req.params.id;

    const existingStudent = await Appointment.findOne({ "students.studentId": req.user.id });
    if (existingStudent) {
        return next(new AppError("You have already booked the appointment", 500));
    }

    const newAppointment = await Appointment.findOneAndUpdate(
        { _id: appointmentId },
        { $push: { students: { studentId: req.user.id, approved: false } } },
        { new: true }
    );

    const scheduledDate = new Date(newAppointment.scheduleAt);
    const formattedDate = scheduledDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: '2-digit' });
    const formattedTime = scheduledDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });


    let info = await transporter.sendMail({
        from: '"tutor-time@brevo.com',
        to: newAppointment.sendBy,
        subject: "Appointment Request",
        html: `
            <h2>Dear Teacher,</h2>
            <p>We hope this message finds you well.</p>
            <p>You have received an appointment request from a student scheduled for ${formattedDate}, and the timing is ${formattedTime}.</p>
            <p>Please log in to our platform to review and respond to the request.</p>
            <p>Thank you for your time and commitment to your students.</p>
            <p>Best regards,</p>
            <p>Tutor-Time</p>
            <p><a href="Website URL">Visit our website</a></p>
        `,
    });
    res.status(200).json({
        status: 'SUCCESS',
        data: {
            newAppointment
        }
    })
})


exports.getTeacherWithAppointments = catchAsync(async (req, res, next) => {
    const appointments = await getTeacherWithAppointments(req.user.id);
    res.status(200).json({
        status: 'Success',
        appointments
    })
})

exports.registeredAppointments = catchAsync(async (req, res, next) => {
    const appointments = await getRegisteredAppointments(req.user.id);
    res.status(200).json({
        status: "Success",
        appointments
    })
})