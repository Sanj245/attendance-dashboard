let subjectData = {}; // session only
let chart = null;

/* Load dropdown */
function loadDropdown() {

let dropdown = document.getElementById("subjectDropdown");

dropdown.innerHTML = '<option value="">Select Subject</option>';

Object.keys(subjectData).forEach(sub => {
let option = document.createElement("option");
option.value = sub;
option.textContent = sub;
dropdown.appendChild(option);
});

}

/* Select subject */
function selectSubject() {

let subject = document.getElementById("subjectDropdown").value;

if (subject && subjectData[subject]) {

document.getElementById("subjectName").value = subject;
document.getElementById("present").value = subjectData[subject].present;
document.getElementById("absent").value = subjectData[subject].absent;

calculateAttendance();

}

}

/* Main function */
function calculateAttendance(){

let subject = document.getElementById("subjectName").value.trim();
let present = parseInt(document.getElementById("present").value);
let absent = parseInt(document.getElementById("absent").value);

if(subject === ""){
alert("Please enter subject name");
return;
}

if(present <= 0 || isNaN(present)){
alert("Classes Attended must be greater than 0");
return;
}

if(absent < 0 || isNaN(absent)){
alert("Classes Missed cannot be negative");
return;
}

/* Store in memory */
subjectData[subject] = { present, absent };

loadDropdown();

let total = present + absent;
let percentage = (present / total) * 100;

/* Needed */
let extraClasses = 0;
while(((present + extraClasses) * 100) / (total + extraClasses) < 85){
extraClasses++;
}

/* Bunk */
let bunk = 0;
if(percentage >= 85){
while((present * 100) / (total + bunk + 1) >= 85){
bunk++;
}
}

/* Update cards */
document.getElementById("attendancePercent").innerText =
percentage.toFixed(2) + "%";

document.getElementById("attendedCount").innerText = present;
document.getElementById("missedCount").innerText = absent;

let neededCard = document.getElementById("neededCard");
let bunkCard = document.getElementById("bunkCard");

if(percentage >= 85){
neededCard.style.display = "none";
bunkCard.style.display = "block";
document.getElementById("bunkableClasses").innerText = bunk;
}
else{
neededCard.style.display = "block";
bunkCard.style.display = "none";
document.getElementById("neededClasses").innerText = extraClasses;
}

/* Progress */
let progress = document.getElementById("progressFill");
progress.style.width = percentage + "%";

/* Status */
let status = document.getElementById("statusMessage");

if(percentage >= 85){
progress.style.background = "#22c55e";
status.innerText = subject + " is safe 😎";
status.style.color = "#22c55e";
startConfettiShower();
}
else if(percentage >= 75){
progress.style.background = "#f59e0b";
status.innerText = "Attend " + extraClasses + " more classes";
status.style.color = "#f59e0b";
}
else{
progress.style.background = "#ef4444";
status.innerText = subject + " attendance is low";
status.style.color = "#ef4444";
}

/* Graph */
updateChart();

}

/* Graph */
function updateChart(){

let subjects = Object.keys(subjectData);

let percentages = subjects.map(sub => {
let {present, absent} = subjectData[sub];
return (present / (present + absent)) * 100;
});

if(chart){
chart.destroy();
}

let ctx = document.getElementById("attendanceChart").getContext("2d");

let gradient = ctx.createLinearGradient(0,0,0,400);
gradient.addColorStop(0,"#6366f1");
gradient.addColorStop(1,"#8b5cf6");

chart = new Chart(ctx, {

type: "bar",

data: {
labels: subjects,
datasets: [{
data: percentages,
backgroundColor: gradient,
borderRadius: 10
}]
},

options: {
plugins:{ legend:{display:false} },
scales:{
y:{ beginAtZero:true, max:100 }
},
animation:{ duration:1200 }
}

});

}

/* Theme */
function toggleTheme(){

document.body.classList.toggle("dark");

let label = document.getElementById("modeLabel");

label.textContent = document.body.classList.contains("dark")
? "Light Mode"
: "Dark Mode";

}

/* Confetti */
function startConfettiShower(){

const end = Date.now() + 2000;

const interval = setInterval(function(){

if(Date.now() > end){
clearInterval(interval);
return;
}

confetti({
particleCount:60,
spread:100,
origin:{ y:0.6 }
});

},250);

}