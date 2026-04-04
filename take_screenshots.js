const { chromium } = require('playwright');
const fs = require('fs');

const screens = [
  { file: 'screen1_task_detail.html', name: 'TaskDetail' },
  { file: 'screen2_task_configure.html', name: 'TaskConfigure' },
  { file: 'screen3_gantt_chart.html', name: 'GanttChart' },
  { file: 'screen4_projects.html', name: 'Projects' },
  { file: 'screen5_attachment_source.html', name: 'AttachmentSource' },
  { file: 'screen6_dashboard.html', name: 'Dashboard' },
  { file: 'screen7_registration.html', name: 'Registration' },
  { file: 'screen8_profile.html', name: 'Profile' },
  { file: 'screen9_login.html', name: 'Login' },
  { file: 'screen10_notifications.html', name: 'Notifications' },
  { file: 'screen11_calendar.html', name: 'Calendar' }
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  for (const screen of screens) {
    await page.goto(`http://localhost:3000/${screen.file}`);
    await page.waitForTimeout(1000); // wait for rendering
    await page.screenshot({ path: `screenshots/${screen.name}.png` });
    console.log(`Screenshot taken for ${screen.name}`);
  }

  await browser.close();
})();
