module.exports = {
  apps: [
    {
      name: "new_crm_system",
      script: "node_modules/next/dist/bin/next",
      cwd: "/home/r55gead41rbl/public_html/202608/",
      args: "start -p 3040", // choose your port
      exec_mode: "fork",       // run in fork mode
      instances: 1,            // only one instance in fork mode
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};