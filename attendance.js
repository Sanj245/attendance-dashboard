function calculateAttendance(){

let present = parseInt(document.getElementById("present").value);
let absent = parseInt(document.getElementById("absent").value);

// Validation
if(present <= 0 || isNaN(present)){
alert("Classes Attended must be greater than 0");
return;
}

if(absent < 0 || isNaN(absent)){
alert("Classes Missed cannot be negative");
return;
}

let total = present + absent;
let percentage = (present / total) * 100;

// Classes needed to reach 85%
let extraClasses = 0;

while(((present + extraClasses) * 100) / (total + extraClasses) < 85){
extraClasses++;
}

// Bunkable classes calculation
let bunk = 0;

if(percentage >= 85){
while((present * 100) / (total + bunk + 1) >= 85){
bunk++;
}
}

// Update dashboard cards
document.getElementById("attendancePercent").innerText = percentage.toFixed(2) + "%";
document.getElementById("attendedCount").innerText = present;
document.getElementById("missedCount").innerText = absent;
document.getElementById("neededClasses").innerText = extraClasses;
document.getElementById("bunkableClasses").innerText = bunk;

// Progress bar
let progress = document.getElementById("progressFill");
progress.style.width = percentage + "%";

// Status message
let status = document.getElementById("statusMessage");

if(percentage >= 85){
progress.style.background = "#22c55e";
status.innerText = "Great! Your attendance is above 85%";
status.style.color = "#22c55e";

startConfettiShower();
}
else if(percentage >= 75){
progress.style.background = "#f59e0b";
status.innerText = "Attend " + extraClasses + " more classes to reach 85%";
status.style.color = "#f59e0b";
}
else{
progress.style.background = "#ef4444";
status.innerText = "Attendance is low. Attend classes to reach 85%";
status.style.color = "#ef4444";
}

}
/*confetti celebration */
function startConfettiShower(){

const duration = 2 * 1000;
const animationEnd = Date.now() + duration;

const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

function randomInRange(min, max){
return Math.random() * (max - min) + min;
}

const interval = setInterval(function(){

const timeLeft = animationEnd - Date.now();

if(timeLeft <= 0){
return clearInterval(interval);
}

const particleCount = 50 * (timeLeft / duration);

confetti(Object.assign({}, defaults, {
particleCount,
origin:{ x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
}));

confetti(Object.assign({}, defaults, {
particleCount,
origin:{ x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
}));

},250);

}
// Dark / Light Mode Toggle
function toggleTheme(){

document.body.classList.toggle("dark");

const label = document.getElementById("modeLabel");

if(label){
if(document.body.classList.contains("dark")){
label.textContent = "Dark Mode";
}else{
label.textContent = "Light Mode";
}
}

}

// Press Enter to Calculate
document.getElementById("present").addEventListener("keypress", function(event){
if(event.key === "Enter"){
calculateAttendance();
}
});

document.getElementById("absent").addEventListener("keypress", function(event){
if(event.key === "Enter"){
calculateAttendance();
}
});
