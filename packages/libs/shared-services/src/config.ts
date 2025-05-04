export interface ConfigTypo {
    APP_INO_SERVICE_URL: string;
    APP_REQ_RETRY_MAX_ATTEMPTS: number;
    APP_REQ_RETRY_STATUS_CODES: string;
    APP_REQ_RETRY_DELAY: number;
    APP_RETRY_CODES: string;
    maxPayloadSize: string; // 👈 add this line
  }
  
  export const configVariables: ConfigTypo = {
    APP_INO_SERVICE_URL: 'http://localhost:3005',
    APP_REQ_RETRY_MAX_ATTEMPTS: 3,
    APP_REQ_RETRY_STATUS_CODES: '429,502',
    APP_REQ_RETRY_DELAY: 2000,
    APP_RETRY_CODES: 'ECONNABORTED',
    maxPayloadSize: '50mb', // 👈 add this value
  };
  