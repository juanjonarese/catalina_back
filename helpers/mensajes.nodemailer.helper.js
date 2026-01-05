const { transporter } = require("../middleware/nodemailer.middleware");

const registroExitoso = async (emailUsuario, nombreUsuario) => {
  try {
    await transporter.sendMail({
      from: `"FotoShow" <${process.env.GMAIL_APP_USER}>`,
      to: `${emailUsuario}`,
      subject: "Registro exitoso ✔",
      text: "Gracias por registrarte", // plain‑text body
      html: `<b>Bienvenido ${nombreUsuario}</b>`, // HTML body
    });

    return {
      msg: "ok",
      statusCode: 200,
    };
  } catch (error) {
    console.log(error);
    return {
      error,
      statusCode: 500,
    };
  }
};

const recuperarContrasenia = async (token, emailUsuario) => {
  try {
    const info = await transporter.sendMail({
      from: `"FotoShow" <${process.env.GMAIL_APP_USER}>`,
      to: `${emailUsuario}`,
      subject: "Recuperacion contraseña ****",
      html: `
        <b>Para recuperar tu contraseña hace click en el link a continuacion:</b>
        <a href="https://fotoshow-frontend.vercel.app/changepass?token=${token}">Ir a la página </a>
      `,
    });
    console.log(info);
    return {
      msg: "ok",
      statusCode: 200,
    };
  } catch (error) {
    console.log({ error });
    return {
      error,
      statusCode: 500,
    };
  }
};

// ⚡ NUEVA FUNCIÓN GENÉRICA para enviar cualquier email
const enviarEmail = async ({ email, nombre, asunto, html, text }) => {
  try {
    console.log("📧 Enviando email a:", email);
    console.log("   Asunto:", asunto);

    const info = await transporter.sendMail({
      from: `"FotoShow" <${process.env.GMAIL_APP_USER}>`,
      to: email,
      subject: asunto,
      text: text || "", // Texto plano (opcional)
      html: html, // HTML del email
    });

    console.log("✅ Email enviado exitosamente. Message ID:", info.messageId);

    return {
      success: true,
      msg: "Email enviado correctamente",
      messageId: info.messageId,
      statusCode: 200,
    };
  } catch (error) {
    console.error("❌ Error al enviar email:", error);

    return {
      success: false,
      error: error.message,
      statusCode: 500,
    };
  }
};

// Confirmación de reserva de hotel
const confirmarReserva = async (reserva) => {
  try {
    const { codigoReserva, emailCliente, nombreCliente, fechaCheckIn, fechaCheckOut, habitacionId, precioTotal } = reserva;

    // Formatear fechas
    const formatearFecha = (fecha) => {
      return new Date(fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const checkInFormateado = formatearFecha(fechaCheckIn);
    const checkOutFormateado = formatearFecha(fechaCheckOut);

    // Calcular noches
    const inicio = new Date(fechaCheckIn);
    const fin = new Date(fechaCheckOut);
    const noches = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));

    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #0d6efd;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .info-row {
            margin: 15px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-left: 4px solid #0d6efd;
          }
          .info-label {
            font-weight: bold;
            color: #0d6efd;
          }
          .codigo-reserva {
            font-size: 28px;
            color: #0d6efd;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            letter-spacing: 2px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .total {
            font-size: 24px;
            color: #28a745;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: #d4edda;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏨 Confirmación de Reserva</h1>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${nombreCliente}</strong>,</p>
            <p>¡Gracias por elegirnos! Su reserva ha sido confirmada exitosamente.</p>

            <div class="codigo-reserva">
              🎫 ${codigoReserva}
            </div>
            <p style="text-align: center; color: #666; margin-top: -10px;">
              <small><strong>Código de Reserva</strong> - Preséntelo al momento del check-in</small>
            </p>

            <div class="info-row">
              <span class="info-label">📅 Check-in:</span> ${checkInFormateado}
            </div>

            <div class="info-row">
              <span class="info-label">📅 Check-out:</span> ${checkOutFormateado}
            </div>

            <div class="info-row">
              <span class="info-label">🛏️ Habitación:</span> Room ${habitacionId?.numero || 'N/A'} - ${habitacionId?.titulo || 'N/A'}
            </div>

            <div class="info-row">
              <span class="info-label">🌙 Noches:</span> ${noches} ${noches === 1 ? 'noche' : 'noches'}
            </div>

            <div class="total">
              💰 Total: $${precioTotal?.toLocaleString('es-AR') || '0'}
            </div>

            <p><strong>Información importante:</strong></p>
            <ul>
              <li>Horario de check-in: 14:00 hrs</li>
              <li>Horario de check-out: 11:00 hrs</li>
              <li>Por favor, presente este email al momento de su llegada</li>
            </ul>

            <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
            <p>¡Esperamos recibirlo pronto!</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"Hotel Reservaciones" <${process.env.GMAIL_APP_USER}>`,
      to: emailCliente,
      subject: `✅ Confirmación de Reserva ${codigoReserva} - Room ${habitacionId?.numero}`,
      html: htmlEmail,
    });

    console.log("✅ Email de confirmación enviado:", info.messageId);

    return {
      success: true,
      msg: "Email de confirmación enviado correctamente",
      messageId: info.messageId,
      statusCode: 200,
    };
  } catch (error) {
    console.error("❌ Error al enviar email de confirmación:", error);
    return {
      success: false,
      error: error.message,
      statusCode: 500,
    };
  }
};

module.exports = {
  registroExitoso,
  recuperarContrasenia,
  enviarEmail,
  confirmarReserva, // Nueva función para confirmar reservas
};
