const fs = require('fs');

const cssFile = 'src/app/globals.css';
let content = fs.readFileSync(cssFile, 'utf8');

// Replace glowPulse to use opacity on pseudo element if it's there
content = content.replace(
  /@keyframes glowPulse {\n  0% { box-shadow: 0 0 15px rgba\(0, 204, 255, 0.2\); }\n  50% { box-shadow: 0 0 25px rgba\(0, 204, 255, 0.6\); }\n  100% { box-shadow: 0 0 15px rgba\(0, 204, 255, 0.2\); }\n}/g,
  `@keyframes glowPulse {
  0% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.5; transform: scale(1); }
}`
);

// Append new modal animations
const newClasses = `
/* --- New Modal Animations --- */
.modal-overlay {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.modal-animate-in {
  animation: scaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
`;

if (!content.includes('.modal-overlay')) {
  fs.writeFileSync(cssFile, content + newClasses);
  console.log('CSS updated successfully!');
} else {
  console.log('CSS already contains modal classes.');
}
