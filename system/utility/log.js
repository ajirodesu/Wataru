import chalk from 'chalk';

// Function to get the current time in Asia/Manila timezone in 24-hour format
const getCurrentTime = () => {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
};

const log = {
  main: (message) => {
    console.log(
      chalk.blue(`[${getCurrentTime()}] [ Wataru ] » ${message}`),
    );
  },
  info: (message) => {
    console.log(
      chalk.blue(`[${getCurrentTime()}] [ Info ] » ${message}`),
    );
  },
  warn: (message) => {
    console.log(
      chalk.yellow(`[${getCurrentTime()}] [ Warning ] » ${message}`),
    );
  },
  success: (message) => {
    console.log(
      chalk.green(`[${getCurrentTime()}] [ Success ] » ${message}`),
    );
  },
  system: (message) => {
    console.log(
      chalk.green(`[${getCurrentTime()}] [ System ] » ${message}`),
    );
  },
  error: (message) => {
    console.log(
      chalk.red(`[${getCurrentTime()}] [ Error ] » ${message}`),
    );
  },
};

export default log;