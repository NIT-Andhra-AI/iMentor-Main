module.exports = {
  apps: [
    {
      name: "imentor-weekly-gate-generator",
      script: "python3",
      args: "./server/scripts/generate_massive_question_banks.py",
      cwd: "/home/sri/Downloads/iMentor_march/iMentorV2",
      cron_restart: "0 2 * * 0", // Runs at 02:00 AM every Sunday
      autorestart: false,
      watch: false,
      max_memory_restart: "1G"
    },
    {
      name: "imentor-textbook-generator",
      script: "python3",
      args: "./server/scripts/course_material_generator.py",
      cwd: "/home/sri/Downloads/iMentor_march/iMentorV2",
      cron_restart: "0 3 * * 0", // Runs at 03:00 AM every Sunday to incrementally build books
      autorestart: false,
      watch: false,
      max_memory_restart: "1G"
    }
  ]
};
