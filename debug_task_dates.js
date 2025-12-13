const mongoose = require('mongoose');
const Task = require('./models/Task');
const User = require('./models/User');
require('dotenv').config();

async function debugDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an employee user
    const user = await User.findOne({ 'companies.role': 'employee' });

    if (!user) {
      console.log('No employee found');
      return;
    }

    console.log('Debugging tasks for user:', user.email);

    const tasks = await Task.find({ assigned_to: user._id });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const fs = require('fs');
    let output = '';

    output += '--- Date Boundaries ---\n';
    output += `Today (Start): ${today.toDateString()}\n`;
    output += `Tomorrow (Start): ${tomorrow.toDateString()}\n`;
    output += `Next Week (End): ${nextWeek.toDateString()}\n`;
    output += '-----------------------\n';

    tasks.filter(t => t.title.includes('DEBUG:')).forEach(task => {
      let category = 'None';
      let dateStr = 'No Date';

      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        dateStr = dueDate.toDateString();

        if (dueDate.getTime() === today.getTime()) {
          category = 'TODAY';
        } else if (dueDate >= tomorrow && dueDate <= nextWeek) {
          category = 'THIS WEEK';
        } else if (dueDate > nextWeek) {
          category = 'LATER';
        } else {
          category = 'PAST/UNKNOWN';
        }
      } else {
        category = 'LATER (No Date)';
      }

      output += `[${category}] ${task.title} (Due: ${dateStr})\n`;
    });

    fs.writeFileSync('debug_output.txt', output);
    console.log('Output written to debug_output.txt');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugDates();
