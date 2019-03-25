const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'catania.fco@gmail.com',
    subject: 'Welcome to TaskManagerApp',
    text: `Welcome ${name}!`
  })
}

const sendGoodbyeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'catania.fco@gmail.com',
    subject: `Goodbye ${name}`,
    text: `${name}!, we are sorry to know you are leaving.`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendGoodbyeEmail
}
