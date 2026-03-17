function calculateAttendance() {

let present = parseInt(document.getElementById("present").value);
let absent = parseInt(document.getElementById("absent").value);
let status = document.getElementById("statusMessage");

if (isNaN(present) || isNaN(absent)) {
status.innerText = "Please enter valid numbers.";
status.style.color = "red";
return;
}

let total = present + absent;

if (total === 0) {
status.innerText = "No classes conducted yet.";
status.style.color = "red";
return;
}

let percentage = (present * 100) / total;

let extraClasses = 0;

while (((present + extraClasses) * 100) / (total + extraClasses) <= 85) {
extraClasses++;
}

document.getElementById("attendancePercent").innerText = percentage.toFixed(2) + "%";
document.getElementById("attendedCount").innerText = present;
document.getElementById("missedCount").innerText = absent;
document.getElementById("neededClasses").innerText = extraClasses;

if (percentage >= 85) {
status.innerText = "Great! Your attendance is above 85% ✅";
status.style.color = "#22c55e";
} else {
status.innerText = "Attend " + extraClasses + " more classes to reach 85%.";
status.style.color = "#ef4444";
}

}