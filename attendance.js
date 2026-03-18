function calculateAttendance(){

let present = parseInt(document.getElementById("present").value);
let absent = parseInt(document.getElementById("absent").value);
let status = document.getElementById("statusMessage");

if(isNaN(present) || isNaN(absent)){
status.innerText="Please enter valid numbers";
status.style.color="red";
return;
}

let total = present + absent;

if(total === 0){
status.innerText="No classes conducted yet";
status.style.color="red";
return;
}

let percentage = (present*100)/total;

// Classes needed to reach 85%
let extraClasses = 0;

while(((present + extraClasses)*100)/(total + extraClasses) < 85){
extraClasses++;
}

// Bunkable classes calculation
let bunk = 0;

if(percentage >= 85){
while((present*100)/(total + bunk + 1) >= 85){
bunk++;
}
}

// Update dashboard cards
document.getElementById("attendancePercent").innerText = percentage.toFixed(2) + "%";
document.getElementById("attendedCount").innerText = present;
document.getElementById("missedCount").innerText = absent;
document.getElementById("neededClasses").innerText = extraClasses;
document.getElementById("bunkableClasses").innerText = bunk;

// Update progress bar
let progress = document.getElementById("progressFill");
progress.style.width = percentage + "%";

if(percentage >= 85){
progress.style.background = "#22c55e";
status.innerText = "Great! Your attendance is above 85%";
status.style.color = "#22c55e";
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