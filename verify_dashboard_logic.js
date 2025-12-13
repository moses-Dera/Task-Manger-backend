const today = new Date();
today.setHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

const dayAfterNextWeek = new Date(nextWeek);
dayAfterNextWeek.setDate(dayAfterNextWeek.getDate() + 1);

const tasks = [
    { id: 1, title: 'Task Due Today', due_date: today.toISOString() },
    { id: 2, title: 'Task Due Tomorrow', due_date: tomorrow.toISOString() },
    { id: 3, title: 'Task Due Next Week', due_date: nextWeek.toISOString() },
    { id: 4, title: 'Task Due Later', due_date: dayAfterNextWeek.toISOString() },
    { id: 5, title: 'Task No Date', due_date: null }
];

console.log('--- Testing Dashboard Filtering Logic ---');
console.log('Today:', today.toISOString());
console.log('Tomorrow:', tomorrow.toISOString());
console.log('Next Week:', nextWeek.toISOString());

const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
});

const weekTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= tomorrow && dueDate <= nextWeek;
});

const laterTasks = tasks.filter(task => {
    if (!task.due_date) return true;
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate > nextWeek;
});

console.log('\nResults:');
console.log('Today Tasks:', todayTasks.map(t => t.title));
console.log('Week Tasks:', weekTasks.map(t => t.title));
console.log('Later Tasks:', laterTasks.map(t => t.title));

// Assertions
if (todayTasks.length !== 1 || todayTasks[0].id !== 1) console.error('FAIL: Today tasks incorrect');
else console.log('PASS: Today tasks correct');

if (weekTasks.length !== 2 || !weekTasks.find(t => t.id === 2) || !weekTasks.find(t => t.id === 3)) console.error('FAIL: Week tasks incorrect');
else console.log('PASS: Week tasks correct');

if (laterTasks.length !== 2 || !laterTasks.find(t => t.id === 4) || !laterTasks.find(t => t.id === 5)) console.error('FAIL: Later tasks incorrect');
else console.log('PASS: Later tasks correct');
