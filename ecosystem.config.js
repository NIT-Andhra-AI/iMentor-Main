module.exports = {
  apps: [
    {
      name: 'imentor-rag',
      script: './start_rag.sh',
      interpreter: 'bash',
      cwd: '/home/sri/Downloads/iMentor_march/iMentor-Main/server/rag_service',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PYTHONUNBUFFERED: '1'
      }
    },
    {
      name: 'imentor-backend',
      script: 'server.js',
      cwd: '/home/sri/Downloads/iMentor_march/iMentor-Main/server',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'imentor-frontend',
      script: 'npx',
      args: 'vite --host --port 3005',
      cwd: '/home/sri/Downloads/iMentor_march/iMentor-Main/frontend',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
