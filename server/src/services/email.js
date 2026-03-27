const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Usa Resend se configurado, senão SMTP genérico
  if (process.env.RESEND_API_KEY) {
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: process.env.RESEND_API_KEY }
    });
  } else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  } else {
    // Fallback: log no console (dev)
    return null;
  }

  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    logger.warn('Email não enviado (sem configuração SMTP)', { to, subject });
    return;
  }

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || 'TaskFlow <noreply@taskflow.app>',
      to,
      subject,
      html
    });
    logger.info('Email enviado', { to, subject });
  } catch (err) {
    logger.error('Erro ao enviar email', { to, subject, error: err.message });
  }
}

async function sendPasswordReset(email, name, resetUrl) {
  await sendEmail({
    to: email,
    subject: 'Redefinição de senha - TaskFlow',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#6366f1">Redefinir sua senha</h2>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600">
          Redefinir senha
        </a>
        <p style="color:#666;font-size:13px">Este link expira em 1 hora. Se você não solicitou isso, ignore este email.</p>
      </div>
    `
  });
}

async function sendWelcome(email, name, tenantName) {
  await sendEmail({
    to: email,
    subject: `Bem-vindo ao TaskFlow, ${name}!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#6366f1">Bem-vindo ao TaskFlow! 🚀</h2>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Seu workspace <strong>${tenantName}</strong> foi criado com sucesso.</p>
        <p>Você tem 14 dias de trial gratuito para explorar todos os recursos.</p>
        <a href="${process.env.CLIENT_URL}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600">
          Acessar TaskFlow
        </a>
      </div>
    `
  });
}

async function sendMemberInvite(email, name, inviterName, tenantName, loginUrl) {
  await sendEmail({
    to: email,
    subject: `${inviterName} te convidou para o ${tenantName} no TaskFlow`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#6366f1">Você foi convidado!</h2>
        <p>Olá, <strong>${name}</strong>!</p>
        <p><strong>${inviterName}</strong> te adicionou ao workspace <strong>${tenantName}</strong> no TaskFlow.</p>
        <a href="${loginUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600">
          Acessar agora
        </a>
      </div>
    `
  });
}

module.exports = { sendEmail, sendPasswordReset, sendWelcome, sendMemberInvite };
