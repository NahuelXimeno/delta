import winston from "winston";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Definir los niveles de log
const logLevels = {
  debug: 0,
  http: 1,
  info: 2,
  warning: 3,
  error: 4,
  fatal: 5,
};

// Configuración del transporte para archivos de errores
const errorTransport = new winston.transports.File({
  filename: join(__dirname, "errors.log"),
  level: "error",
});

// Configuración del logger de desarrollo
const developmentLogger = winston.createLogger({
  levels: logLevels,
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({
      level: "debug",
    }),
  ],
});

// Configuración del logger de producción
const productionLogger = winston.createLogger({
  levels: logLevels,
  format: winston.format.simple(),
  transports: [errorTransport],
});

// Exportar los loggers
export const logger =
  process.env.NODE_ENV === "production" ? productionLogger : developmentLogger;
