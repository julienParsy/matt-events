const nodemailer = require('nodemailer');
require('dotenv').config(); // Si besoin

async function sendContactMail({ nom, email, message }) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: email,
        to: process.env.EMAIL_RECEIVER,
        subject: `Contact via site : ${nom}`,
        text: `Message de ${nom} (${email}) :\n\n${message}`,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = {
    // ...tes autres exports
    sendContactMail,
};
