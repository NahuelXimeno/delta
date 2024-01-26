import nodemailer from "nodemailer";

// Configuración del transportador para enviar correos
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tu_correo@gmail.com", // Reemplaza con tu dirección de correo
    pass: "tu_contraseña", // Reemplaza con tu contraseña
  },
});

// Función para enviar un correo al usuario inactivo
export const enviarCorreoUsuarioInactivo = async (destinatario) => {
  const opcionesCorreo = {
    from: "tu_correo@gmail.com", // Reemplaza con tu dirección de correo
    to: destinatario,
    subject: "Cuenta eliminada por inactividad",
    text: "Lamentamos informarte que tu cuenta ha sido eliminada debido a inactividad.",
  };

  try {
    await transporter.sendMail(opcionesCorreo);
    console.log(`Correo enviado a ${destinatario}`);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
};
export const enviarCorreoProductoEliminado = async (
  destinatario,
  nombreProducto
) => {
  const opcionesCorreo = {
    from: "tu_correo@gmail.com",
    to: destinatario,
    subject: "Producto Eliminado",
    text: `Tu producto "${nombreProducto}" ha sido eliminado.`,
  };

  try {
    await transporter.sendMail(opcionesCorreo);
    console.log(`Correo enviado a ${destinatario}`);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
};
